// Media Service Layer - Medya Yükleme ve Yönetimi
class MediaService {
    constructor() {
        this.client = window.supabaseClient;
        this.bucketName = 'media';
        this.allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/avi', 'video/mov', 'application/pdf'];
        this.maxFileSize = 50 * 1024 * 1024; // 50MB
    }

    // File validation
    validateFile(file) {
        const errors = [];

        if (!file) {
            errors.push('Dosya seçilmedi');
            return { isValid: false, errors };
        }

        if (!this.allowedTypes.includes(file.type)) {
            errors.push('Desteklenmeyen dosya formatı. Desteklenen formatlar: JPG, PNG, GIF, WebP, MP4, AVI, MOV, PDF');
        }

        if (file.size > this.maxFileSize) {
            errors.push(`Dosya boyutu çok büyük. Maksimum: ${this.formatFileSize(this.maxFileSize)}`);
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Upload single file
    async uploadFile(file, options = {}) {
        try {
            // Validate file
            const validation = this.validateFile(file);
            if (!validation.isValid) {
                return { success: false, error: validation.errors.join(', ') };
            }

            // Generate unique filename
            const timestamp = Date.now();
            const randomString = Math.random().toString(36).substring(7);
            const fileExtension = file.name.split('.').pop();
            const fileName = `${timestamp}_${randomString}.${fileExtension}`;
            const filePath = options.folder ? `${options.folder}/${fileName}` : fileName;

            // Upload to Supabase Storage
            const { data: uploadData, error: uploadError } = await this.client.storage
                .from(this.bucketName)
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                throw uploadError;
            }

            // Get public URL
            const { data: urlData } = this.client.storage
                .from(this.bucketName)
                .getPublicUrl(filePath);

            // Get file dimensions for images
            let width = null, height = null;
            if (file.type.startsWith('image/')) {
                const dimensions = await this.getImageDimensions(file);
                width = dimensions.width;
                height = dimensions.height;
            }

            // Save to database
            const mediaData = {
                filename: fileName,
                original_filename: file.name,
                file_url: urlData.publicUrl,
                file_size: file.size,
                mime_type: file.type,
                media_type: this.getMediaType(file.type),
                width: width,
                height: height,
                alt_text: options.altText || null,
                caption: options.caption || null,
                is_public: options.isPublic !== false,
                uploaded_by: (await this.client.auth.getUser()).data.user?.id,
                related_event_id: options.eventId || null,
                related_content_id: options.contentId || null
            };

            const { data, error } = await this.client
                .from('media')
                .insert([mediaData])
                .select()
                .single();

            if (error) {
                // Clean up uploaded file if database insert fails
                await this.client.storage.from(this.bucketName).remove([filePath]);
                throw error;
            }

            return { 
                success: true, 
                data: {
                    ...data,
                    file_path: filePath
                }
            };

        } catch (error) {
            console.error('File upload error:', error);
            return { success: false, error: error.message };
        }
    }

    // Upload multiple files
    async uploadMultipleFiles(files, options = {}) {
        const results = [];
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const result = await this.uploadFile(file, {
                ...options,
                folder: options.folder || `batch_${Date.now()}`
            });
            
            results.push({
                file: file.name,
                ...result
            });
        }

        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);

        return {
            success: failed.length === 0,
            total: files.length,
            successful: successful.length,
            failed: failed.length,
            results,
            data: successful.map(r => r.data)
        };
    }

    // Get image dimensions
    getImageDimensions(file) {
        return new Promise((resolve) => {
            if (!file.type.startsWith('image/')) {
                resolve({ width: null, height: null });
                return;
            }

            const img = new Image();
            img.onload = function() {
                resolve({ width: this.width, height: this.height });
            };
            img.onerror = function() {
                resolve({ width: null, height: null });
            };
            img.src = URL.createObjectURL(file);
        });
    }

    // Get media type from MIME type
    getMediaType(mimeType) {
        if (mimeType.startsWith('image/')) return 'image';
        if (mimeType.startsWith('video/')) return 'video';
        if (mimeType === 'application/pdf') return 'document';
        return 'other';
    }

    // Get media files
    async getMedia(filters = {}) {
        try {
            let query = this.client
                .from('media')
                .select('*')
                .order('created_at', { ascending: false });

            if (filters.mediaType) {
                query = query.eq('media_type', filters.mediaType);
            }

            if (filters.eventId) {
                query = query.eq('related_event_id', filters.eventId);
            }

            if (filters.contentId) {
                query = query.eq('related_content_id', filters.contentId);
            }

            if (filters.isPublic !== undefined) {
                query = query.eq('is_public', filters.isPublic);
            }

            if (filters.uploadedBy) {
                query = query.eq('uploaded_by', filters.uploadedBy);
            }

            const { data, error } = await query;

            if (error) throw error;

            return { success: true, data };

        } catch (error) {
            console.error('Get media error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get single media file
    async getMediaById(mediaId) {
        try {
            const { data, error } = await this.client
                .from('media')
                .select('*')
                .eq('id', mediaId)
                .single();

            if (error) throw error;

            return { success: true, data };

        } catch (error) {
            console.error('Get media by ID error:', error);
            return { success: false, error: error.message };
        }
    }

    // Update media metadata
    async updateMedia(mediaId, updates) {
        try {
            const { data, error } = await this.client
                .from('media')
                .update(updates)
                .eq('id', mediaId)
                .select()
                .single();

            if (error) throw error;

            return { success: true, data };

        } catch (error) {
            console.error('Update media error:', error);
            return { success: false, error: error.message };
        }
    }

    // Delete media file
    async deleteMedia(mediaId) {
        try {
            // Get media info first
            const mediaResult = await this.getMediaById(mediaId);
            if (!mediaResult.success) {
                throw new Error('Media not found');
            }

            const media = mediaResult.data;

            // Delete from storage
            const filePath = media.file_url.split('/').pop();
            const { error: storageError } = await this.client.storage
                .from(this.bucketName)
                .remove([filePath]);

            if (storageError) {
                console.warn('Storage deletion warning:', storageError);
            }

            // Delete from database
            const { error: dbError } = await this.client
                .from('media')
                .delete()
                .eq('id', mediaId);

            if (dbError) throw dbError;

            return { success: true };

        } catch (error) {
            console.error('Delete media error:', error);
            return { success: false, error: error.message };
        }
    }

    // Link media to event
    async linkToEvent(mediaId, eventId, isCoverImage = false, displayOrder = 0) {
        try {
            const { data, error } = await this.client
                .from('event_media')
                .insert([{
                    event_id: eventId,
                    media_id: mediaId,
                    is_cover_image: isCoverImage,
                    display_order: displayOrder
                }])
                .select()
                .single();

            if (error) throw error;

            return { success: true, data };

        } catch (error) {
            console.error('Link to event error:', error);
            return { success: false, error: error.message };
        }
    }

    // Unlink media from event
    async unlinkFromEvent(mediaId, eventId) {
        try {
            const { error } = await this.client
                .from('event_media')
                .delete()
                .eq('media_id', mediaId)
                .eq('event_id', eventId);

            if (error) throw error;

            return { success: true };

        } catch (error) {
            console.error('Unlink from event error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get event media
    async getEventMedia(eventId) {
        try {
            const { data, error } = await this.client
                .from('event_media')
                .select(`
                    *,
                    media (*)
                `)
                .eq('event_id', eventId)
                .order('display_order', { ascending: true });

            if (error) throw error;

            return { success: true, data };

        } catch (error) {
            console.error('Get event media error:', error);
            return { success: false, error: error.message };
        }
    }

    // Generate thumbnail URL (for images)
    getThumbnailUrl(mediaUrl, width = 300, height = 300) {
        // This would typically be handled by a CDN or image processing service
        // For now, return the original URL
        return mediaUrl;
    }

    // Format file size
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Get storage usage
    async getStorageUsage() {
        try {
            const { data, error } = await this.client
                .from('media')
                .select('file_size');

            if (error) throw error;

            const totalSize = data.reduce((sum, media) => sum + (media.file_size || 0), 0);
            const fileCount = data.length;

            return {
                success: true,
                data: {
                    totalSize,
                    fileCount,
                    formattedSize: this.formatFileSize(totalSize)
                }
            };

        } catch (error) {
            console.error('Get storage usage error:', error);
            return { success: false, error: error.message };
        }
    }

    // Create media gallery HTML
    createGalleryHtml(mediaItems, options = {}) {
        const { 
            showCaptions = true, 
            clickable = true, 
            thumbnailSize = 'medium',
            gridColumns = 3 
        } = options;

        const sizeClasses = {
            small: 'w-24 h-24',
            medium: 'w-32 h-32',
            large: 'w-48 h-48'
        };

        const gridClass = `grid-cols-${gridColumns}`;

        return `
            <div class="media-gallery grid ${gridClass} gap-4">
                ${mediaItems.map(media => `
                    <div class="media-item relative group ${clickable ? 'cursor-pointer' : ''}" 
                         ${clickable ? `onclick="openMediaViewer('${media.id}')"` : ''}>
                        <div class="media-thumbnail ${sizeClasses[thumbnailSize]} rounded-lg overflow-hidden bg-gray-200">
                            ${media.media_type === 'image' ? `
                                <img src="${media.file_url}" 
                                     alt="${media.alt_text || media.original_filename}"
                                     class="w-full h-full object-cover">
                            ` : media.media_type === 'video' ? `
                                <video class="w-full h-full object-cover">
                                    <source src="${media.file_url}" type="${media.mime_type}">
                                </video>
                                <div class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                                    <i class="fas fa-play text-white text-2xl"></i>
                                </div>
                            ` : `
                                <div class="w-full h-full flex items-center justify-center bg-gray-100">
                                    <i class="fas fa-file text-gray-500 text-2xl"></i>
                                </div>
                            `}
                        </div>
                        
                        ${showCaptions && media.caption ? `
                            <div class="media-caption mt-2 text-sm text-gray-600">
                                ${media.caption}
                            </div>
                        ` : ''}
                        
                        <div class="media-overlay absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div class="text-white text-center">
                                <div class="text-xs">${media.original_filename}</div>
                                <div class="text-xs mt-1">${this.formatFileSize(media.file_size)}</div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Create upload form HTML
    createUploadFormHtml(options = {}) {
        const {
            multiple = false,
            accept = 'image/*,video/*,.pdf',
            maxFiles = 5,
            eventId = null,
            contentId = null
        } = options;

        return `
            <div class="media-upload-form">
                <div class="upload-area border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <input type="file" 
                           id="mediaFileInput" 
                           ${multiple ? 'multiple' : ''}
                           accept="${accept}"
                           class="hidden">
                    
                    <div class="upload-icon mb-4">
                        <i class="fas fa-cloud-upload-alt text-4xl text-gray-400"></i>
                    </div>
                    
                    <div class="upload-text">
                        <h3 class="text-lg font-semibold mb-2">Dosya Yükle</h3>
                        <p class="text-gray-600 mb-4">
                            Dosyaları buraya sürükleyin veya seçmek için tıklayın
                        </p>
                        <button type="button" 
                                class="btn btn-primary"
                                onclick="document.getElementById('mediaFileInput').click()">
                            <i class="fas fa-folder-open"></i> Dosya Seç
                        </button>
                    </div>
                    
                    <div class="upload-info text-xs text-gray-500 mt-4">
                        Desteklenen formatlar: JPG, PNG, GIF, WebP, MP4, AVI, MOV, PDF<br>
                        Maksimum dosya boyutu: ${this.formatFileSize(this.maxFileSize)}
                        ${multiple ? `<br>Maksimum ${maxFiles} dosya seçebilirsiniz` : ''}
                    </div>
                </div>
                
                <div id="uploadPreview" class="upload-preview mt-4 hidden"></div>
                
                <div class="upload-options mt-4 hidden" id="uploadOptions">
                    <div class="form-group">
                        <label for="mediaAltText">Alt Text (Resimler için)</label>
                        <input type="text" id="mediaAltText" class="form-control" 
                               placeholder="Resim açıklaması">
                    </div>
                    
                    <div class="form-group">
                        <label for="mediaCaption">Açıklama</label>
                        <textarea id="mediaCaption" class="form-control" rows="2" 
                                  placeholder="Medya açıklaması"></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="mediaIsPublic" checked>
                            <span>Herkese açık</span>
                        </label>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn btn-success" onclick="uploadSelectedFiles()">
                            <i class="fas fa-upload"></i> Yükle
                        </button>
                        <button type="button" class="btn btn-secondary" onclick="cancelUpload()">
                            <i class="fas fa-times"></i> İptal
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
}

// Global instance
window.mediaService = new MediaService();

// Upload form handlers
let selectedFiles = [];

function handleFileSelection(event) {
    const files = Array.from(event.target.files);
    selectedFiles = files;
    
    if (files.length > 0) {
        showUploadPreview(files);
        document.getElementById('uploadOptions').classList.remove('hidden');
    }
}

function showUploadPreview(files) {
    const preview = document.getElementById('uploadPreview');
    
    preview.innerHTML = `
        <h4>Seçilen Dosyalar (${files.length})</h4>
        <div class="file-list">
            ${files.map((file, index) => `
                <div class="file-item flex items-center justify-between p-2 border rounded">
                    <div class="file-info">
                        <span class="file-name font-medium">${file.name}</span>
                        <span class="file-size text-sm text-gray-500 ml-2">
                            (${window.mediaService.formatFileSize(file.size)})
                        </span>
                    </div>
                    <button type="button" class="btn btn-sm btn-danger" 
                            onclick="removeFile(${index})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `).join('')}
        </div>
    `;
    
    preview.classList.remove('hidden');
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
    
    if (selectedFiles.length > 0) {
        showUploadPreview(selectedFiles);
    } else {
        cancelUpload();
    }
}

async function uploadSelectedFiles() {
    if (selectedFiles.length === 0) return;
    
    const altText = document.getElementById('mediaAltText').value;
    const caption = document.getElementById('mediaCaption').value;
    const isPublic = document.getElementById('mediaIsPublic').checked;
    
    const options = {
        altText: altText || null,
        caption: caption || null,
        isPublic: isPublic
    };
    
    try {
        // Show loading
        const uploadBtn = document.querySelector('.btn-success');
        uploadBtn.disabled = true;
        uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Yükleniyor...';
        
        let result;
        if (selectedFiles.length === 1) {
            result = await window.mediaService.uploadFile(selectedFiles[0], options);
        } else {
            result = await window.mediaService.uploadMultipleFiles(selectedFiles, options);
        }
        
        if (result.success) {
            alert(`${selectedFiles.length} dosya başarıyla yüklendi!`);
            cancelUpload();
            
            // Reload media if function exists
            if (typeof loadMedia === 'function') {
                loadMedia();
            }
        } else {
            alert(`Yükleme hatası: ${result.error}`);
        }
        
    } catch (error) {
        console.error('Upload error:', error);
        alert('Dosya yüklenirken hata oluştu');
    } finally {
        // Reset button
        const uploadBtn = document.querySelector('.btn-success');
        uploadBtn.disabled = false;
        uploadBtn.innerHTML = '<i class="fas fa-upload"></i> Yükle';
    }
}

function cancelUpload() {
    selectedFiles = [];
    document.getElementById('mediaFileInput').value = '';
    document.getElementById('uploadPreview').classList.add('hidden');
    document.getElementById('uploadOptions').classList.add('hidden');
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // File input change handler
    const fileInput = document.getElementById('mediaFileInput');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelection);
    }
    
    // Drag and drop handlers
    const uploadArea = document.querySelector('.upload-area');
    if (uploadArea) {
        uploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.add('drag-over');
        });
        
        uploadArea.addEventListener('dragleave', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.remove('drag-over');
        });
        
        uploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.remove('drag-over');
            
            const files = Array.from(e.dataTransfer.files);
            selectedFiles = files;
            
            if (files.length > 0) {
                showUploadPreview(files);
                document.getElementById('uploadOptions').classList.remove('hidden');
            }
        });
    }
}); 