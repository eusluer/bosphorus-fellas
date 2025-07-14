// Database Service Layer - Revize Edilmiş Versiyon
class DatabaseService {
    constructor() {
        this.client = window.supabaseClient;
        this.tables = {
            USERS: 'users',
            APPLICATIONS: 'applications',
            EVENTS: 'events',
            EVENT_PARTICIPANTS: 'event_participants',
            CONTENT: 'content',
            MEDIA: 'media',
            EVENT_MEDIA: 'event_media',
            NOTIFICATIONS: 'notifications',
            ADMIN_LOGS: 'admin_logs',
            SETTINGS: 'settings',
            USER_INTERACTIONS: 'user_interactions'
        };
    }

    // User Operations
    async createUser(userData) {
        try {
            const { data, error } = await this.client
                .from(this.tables.USERS)
                .insert([userData])
                .select();
            
            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('User oluşturma hatası:', error);
            return { success: false, error: error.message };
        }
    }

    async getUserByEmail(email) {
        try {
            const { data, error } = await this.client
                .from(this.tables.USERS)
                .select('*')
                .eq('email', email)
                .single();
            
            if (error && error.code !== 'PGRST116') throw error;
            return { success: true, data };
        } catch (error) {
            console.error('User getirme hatası:', error);
            return { success: false, error: error.message };
        }
    }

    async getUserById(userId) {
        try {
            const { data, error } = await this.client
                .from(this.tables.USERS)
                .select('*')
                .eq('id', userId)
                .single();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('User getirme hatası:', error);
            return { success: false, error: error.message };
        }
    }

    async updateUser(userId, updates) {
        try {
            const { data, error } = await this.client
                .from(this.tables.USERS)
                .update(updates)
                .eq('id', userId)
                .select();
            
            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('User güncelleme hatası:', error);
            return { success: false, error: error.message };
        }
    }

    async getAllMembers() {
        try {
            const { data, error } = await this.client
                .from(this.tables.USERS)
                .select('*')
                .eq('membership_status', 'member')
                .order('membership_date', { ascending: false });
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Üyeleri getirme hatası:', error);
            return { success: false, error: error.message };
        }
    }

    async getUsers(status = null) {
        try {
            let query = this.client
                .from(this.tables.USERS)
                .select('*')
                .order('created_at', { ascending: false });
            
            if (status) {
                query = query.eq('membership_status', status);
            }
            
            const { data, error } = await query;
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Kullanıcıları getirme hatası:', error);
            return { success: false, error: error.message };
        }
    }

    // Application Operations
    async createApplication(applicationData) {
        try {
            const { data, error } = await this.client
                .from(this.tables.APPLICATIONS)
                .insert([{
                    ...applicationData,
                    status: 'pending',
                    created_at: new Date().toISOString()
                }])
                .select();
            
            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Başvuru oluşturma hatası:', error);
            return { success: false, error: error.message };
        }
    }

    async getApplications(status = null) {
        try {
            let query = this.client
                .from(this.tables.APPLICATIONS)
                .select('*')
                .order('created_at', { ascending: false });
            
            if (status) {
                query = query.eq('status', status);
            }
            
            const { data, error } = await query;
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Başvuruları getirme hatası:', error);
            return { success: false, error: error.message };
        }
    }

    async updateApplicationStatus(applicationId, status, adminNotes = '', rejectionReason = '') {
        try {
            const { data, error } = await this.client
                .from(this.tables.APPLICATIONS)
                .update({ 
                    status, 
                    admin_notes: adminNotes,
                    rejection_reason: rejectionReason,
                    reviewed_by: (await this.client.auth.getUser()).data.user?.id,
                    reviewed_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', applicationId)
                .select();
            
            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Başvuru güncelleme hatası:', error);
            return { success: false, error: error.message };
        }
    }

    async approveApplication(applicationId, adminUserId) {
        try {
            const { data, error } = await this.client.rpc('approve_application', {
                application_id: applicationId,
                admin_user_id: adminUserId
            });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Başvuru onaylama hatası:', error);
            return { success: false, error: error.message };
        }
    }

    // Event Operations
    async getEvents(status = 'published') {
        try {
            let query = this.client
                .from(this.tables.EVENTS)
                .select(`
                    *,
                    organizer:organizer_id(first_name, last_name),
                    event_media(
                        media(file_url, alt_text)
                    )
                `)
                .order('event_date', { ascending: true });
            
            if (status) {
                query = query.eq('status', status);
            }
            
            const { data, error } = await query;
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Etkinlikler getirme hatası:', error);
            return { success: false, error: error.message };
        }
    }

    async getEventById(eventId) {
        try {
            const { data, error } = await this.client
                .from(this.tables.EVENTS)
                .select(`
                    *,
                    organizer:organizer_id(first_name, last_name, email, phone),
                    event_media(
                        media(file_url, alt_text, caption),
                        is_cover_image,
                        display_order
                    )
                `)
                .eq('id', eventId)
                .single();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Etkinlik getirme hatası:', error);
            return { success: false, error: error.message };
        }
    }

    async createEvent(eventData) {
        try {
            const { data, error } = await this.client
                .from(this.tables.EVENTS)
                .insert([{
                    ...eventData,
                    organizer_id: (await this.client.auth.getUser()).data.user?.id
                }])
                .select();
            
            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Etkinlik oluşturma hatası:', error);
            return { success: false, error: error.message };
        }
    }

    async updateEvent(eventId, eventData) {
        try {
            const { data, error } = await this.client
                .from(this.tables.EVENTS)
                .update(eventData)
                .eq('id', eventId)
                .select();
            
            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Etkinlik güncelleme hatası:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteEvent(eventId) {
        try {
            const { error } = await this.client
                .from(this.tables.EVENTS)
                .delete()
                .eq('id', eventId);
            
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Etkinlik silme hatası:', error);
            return { success: false, error: error.message };
        }
    }

    // Event Participation Operations
    async joinEvent(eventId, userId, participationStatus = 'interested', notes = '') {
        try {
            const { data, error } = await this.client
                .from(this.tables.EVENT_PARTICIPANTS)
                .insert([{
                    event_id: eventId,
                    user_id: userId,
                    participation_status: participationStatus,
                    registration_notes: notes,
                    registration_date: new Date().toISOString()
                }])
                .select();
            
            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Etkinliğe katılma hatası:', error);
            return { success: false, error: error.message };
        }
    }

    async updateParticipationStatus(eventId, userId, status, notes = '') {
        try {
            const { data, error } = await this.client
                .from(this.tables.EVENT_PARTICIPANTS)
                .update({
                    participation_status: status,
                    registration_notes: notes
                })
                .eq('event_id', eventId)
                .eq('user_id', userId)
                .select();
            
            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Katılım durumu güncelleme hatası:', error);
            return { success: false, error: error.message };
        }
    }

    async getEventParticipants(eventId) {
        try {
            const { data, error } = await this.client
                .from(this.tables.EVENT_PARTICIPANTS)
                .select(`
                    *,
                    user:user_id(
                        id,
                        first_name,
                        last_name,
                        email,
                        phone,
                        car_brand,
                        car_model,
                        car_year,
                        license_plate,
                        emergency_contact_name,
                        emergency_contact_phone
                    )
                `)
                .eq('event_id', eventId)
                .order('registration_date', { ascending: false });
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Etkinlik katılımcıları getirme hatası:', error);
            return { success: false, error: error.message };
        }
    }

    async getUserEventParticipation(eventId, userId) {
        try {
            const { data, error } = await this.client
                .from(this.tables.EVENT_PARTICIPANTS)
                .select('*')
                .eq('event_id', eventId)
                .eq('user_id', userId)
                .single();
            
            if (error && error.code !== 'PGRST116') throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Kullanıcı katılım durumu getirme hatası:', error);
            return { success: false, error: error.message };
        }
    }

    // Content Operations (News & Opportunities)
    async getContent(contentType = null, isMemberOnly = false) {
        try {
            let query = this.client
                .from(this.tables.CONTENT)
                .select('*')
                .eq('is_published', true)
                .order('created_at', { ascending: false });
            
            if (contentType) {
                query = query.eq('content_type', contentType);
            }
            
            if (!isMemberOnly) {
                query = query.eq('is_member_only', false);
            }
            
            const { data, error } = await query;
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('İçerik getirme hatası:', error);
            return { success: false, error: error.message };
        }
    }

    async getContentById(contentId) {
        try {
            const { data, error } = await this.client
                .from(this.tables.CONTENT)
                .select(`
                    *,
                    author:author_id(first_name, last_name)
                `)
                .eq('id', contentId)
                .single();
            
            if (error) throw error;
            
            // İçerik görüntüleme sayısını artır
            await this.client
                .from(this.tables.CONTENT)
                .update({ view_count: data.view_count + 1 })
                .eq('id', contentId);
            
            return { success: true, data };
        } catch (error) {
            console.error('İçerik getirme hatası:', error);
            return { success: false, error: error.message };
        }
    }

    async createContent(contentData) {
        try {
            const { data, error } = await this.client
                .from(this.tables.CONTENT)
                .insert([{
                    ...contentData,
                    author_id: (await this.client.auth.getUser()).data.user?.id
                }])
                .select();
            
            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('İçerik oluşturma hatası:', error);
            return { success: false, error: error.message };
        }
    }

    // Media Operations
    async uploadMedia(file, relatedEventId = null, relatedContentId = null) {
        try {
            const fileName = `${Date.now()}_${file.name}`;
            const { data: uploadData, error: uploadError } = await this.client.storage
                .from('media')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: urlData } = this.client.storage
                .from('media')
                .getPublicUrl(fileName);

            const mediaData = {
                filename: fileName,
                original_filename: file.name,
                file_url: urlData.publicUrl,
                file_size: file.size,
                mime_type: file.type,
                media_type: file.type.startsWith('image/') ? 'image' : 
                           file.type.startsWith('video/') ? 'video' : 'document',
                uploaded_by: (await this.client.auth.getUser()).data.user?.id,
                related_event_id: relatedEventId,
                related_content_id: relatedContentId
            };

            const { data, error } = await this.client
                .from(this.tables.MEDIA)
                .insert([mediaData])
                .select();

            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Medya yükleme hatası:', error);
            return { success: false, error: error.message };
        }
    }

    async linkMediaToEvent(eventId, mediaId, isCoverImage = false, displayOrder = 0) {
        try {
            const { data, error } = await this.client
                .from(this.tables.EVENT_MEDIA)
                .insert([{
                    event_id: eventId,
                    media_id: mediaId,
                    is_cover_image: isCoverImage,
                    display_order: displayOrder
                }])
                .select();
            
            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Medya bağlama hatası:', error);
            return { success: false, error: error.message };
        }
    }

    // Notification Operations
    async getUserNotifications(userId, isRead = null) {
        try {
            let query = this.client
                .from(this.tables.NOTIFICATIONS)
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
            
            if (isRead !== null) {
                query = query.eq('is_read', isRead);
            }
            
            const { data, error } = await query;
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Bildirimler getirme hatası:', error);
            return { success: false, error: error.message };
        }
    }

    async createNotification(userId, title, message, notificationType, relatedId = null, actionUrl = null) {
        try {
            const { data, error } = await this.client
                .from(this.tables.NOTIFICATIONS)
                .insert([{
                    user_id: userId,
                    title,
                    message,
                    notification_type: notificationType,
                    related_id: relatedId,
                    action_url: actionUrl
                }])
                .select();
            
            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Bildirim oluşturma hatası:', error);
            return { success: false, error: error.message };
        }
    }

    async markNotificationAsRead(notificationId) {
        try {
            const { data, error } = await this.client
                .from(this.tables.NOTIFICATIONS)
                .update({ is_read: true })
                .eq('id', notificationId)
                .select();
            
            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Bildirim okundu işaretleme hatası:', error);
            return { success: false, error: error.message };
        }
    }

    // Settings Operations
    async getSettings(isPublic = true) {
        try {
            const { data, error } = await this.client
                .from(this.tables.SETTINGS)
                .select('*')
                .eq('is_public', isPublic);
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Ayarlar getirme hatası:', error);
            return { success: false, error: error.message };
        }
    }

    async updateSetting(settingKey, settingValue, description = null) {
        try {
            const { data, error } = await this.client
                .from(this.tables.SETTINGS)
                .upsert({
                    setting_key: settingKey,
                    setting_value: settingValue,
                    description,
                    updated_by: (await this.client.auth.getUser()).data.user?.id,
                    updated_at: new Date().toISOString()
                })
                .select();
            
            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Ayar güncelleme hatası:', error);
            return { success: false, error: error.message };
        }
    }

    // Statistics Operations
    async getStatistics() {
        try {
            const [
                usersResult,
                applicationsResult,
                eventsResult,
                pendingApplicationsResult,
                activeEventsResult
            ] = await Promise.all([
                this.client.from(this.tables.USERS).select('id', { count: 'exact' }).eq('membership_status', 'member'),
                this.client.from(this.tables.APPLICATIONS).select('id', { count: 'exact' }),
                this.client.from(this.tables.EVENTS).select('id', { count: 'exact' }),
                this.client.from(this.tables.APPLICATIONS).select('id', { count: 'exact' }).eq('status', 'pending'),
                this.client.from(this.tables.EVENTS).select('id', { count: 'exact' }).eq('status', 'published')
            ]);

            return {
                success: true,
                data: {
                    totalMembers: usersResult.count || 0,
                    totalApplications: applicationsResult.count || 0,
                    totalEvents: eventsResult.count || 0,
                    pendingApplications: pendingApplicationsResult.count || 0,
                    activeEvents: activeEventsResult.count || 0
                }
            };
        } catch (error) {
            console.error('İstatistik getirme hatası:', error);
            return { success: false, error: error.message };
        }
    }

    // Admin Log Operations
    async createAdminLog(action, targetTable, targetId, oldValues, newValues) {
        try {
            const { data, error } = await this.client
                .from(this.tables.ADMIN_LOGS)
                .insert([{
                    admin_id: (await this.client.auth.getUser()).data.user?.id,
                    action,
                    target_table: targetTable,
                    target_id: targetId,
                    old_values: oldValues,
                    new_values: newValues
                }])
                .select();
            
            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Admin log oluşturma hatası:', error);
            return { success: false, error: error.message };
        }
    }

    // User Interaction Operations
    async toggleInteraction(targetType, targetId, interactionType, commentText = null) {
        try {
            const userId = (await this.client.auth.getUser()).data.user?.id;
            
            // Check if interaction exists
            const { data: existing } = await this.client
                .from(this.tables.USER_INTERACTIONS)
                .select('id')
                .eq('user_id', userId)
                .eq('target_type', targetType)
                .eq('target_id', targetId)
                .eq('interaction_type', interactionType)
                .single();

            if (existing) {
                // Remove interaction
                const { error } = await this.client
                    .from(this.tables.USER_INTERACTIONS)
                    .delete()
                    .eq('id', existing.id);
                
                if (error) throw error;
                return { success: true, action: 'removed' };
            } else {
                // Add interaction
                const { data, error } = await this.client
                    .from(this.tables.USER_INTERACTIONS)
                    .insert([{
                        user_id: userId,
                        target_type: targetType,
                        target_id: targetId,
                        interaction_type: interactionType,
                        comment_text: commentText
                    }])
                    .select();
                
                if (error) throw error;
                return { success: true, action: 'added', data: data[0] };
            }
        } catch (error) {
            console.error('Etkileşim toggle hatası:', error);
            return { success: false, error: error.message };
        }
    }
}

// Global instance
window.dbService = new DatabaseService(); 