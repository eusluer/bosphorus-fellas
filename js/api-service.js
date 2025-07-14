// Backend API Service - Bosphorus Fellas
class ApiService {
    constructor() {
        this.baseURL = 'https://w101-production-e26e.up.railway.app';
    }

    // Set authorization token
    setToken(token) {
        localStorage.setItem('bf_token', token);
        console.log('setToken called, token saved to localStorage');
    }

    // Remove authorization token
    removeToken() {
        localStorage.removeItem('bf_token');
    }

    // Get authorization headers
    getAuthHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        const currentToken = localStorage.getItem('bf_token');
        if (currentToken) {
            headers['Authorization'] = `Bearer ${currentToken}`;
        }
        
        return headers;
    }

    // Generic API request method
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            ...options,
            headers: {
                ...this.getAuthHeaders(),
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, config);
            
            const contentType = response.headers.get('content-type');
            let data = null;
            
            if (contentType && contentType.includes('application/json')) {
                const text = await response.text();
                if (text.trim()) {
                    data = JSON.parse(text);
                }
            } else {
                data = await response.text();
            }

            if (!response.ok) {
                const errorMessage = (data && data.message) || data || `HTTP error! status: ${response.status}`;
                throw new Error(errorMessage);
            }

            return { success: true, data, status: response.status };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // GET request
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    // POST request
    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
    }

    // PUT request
    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
    }

    // DELETE request
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    // Authentication endpoints
    async login(email, sifre) {
        return this.post('/api/login', { email, sifre });
    }

    async getProfile() {
        return this.get('/api/profile');
    }

    // Content endpoints (for authenticated users)
    async getSponsors() {
        return this.get('/api/sponsorlar');
    }

    async getNews() {
        return this.get('/api/haberler');
    }

    async getEvents() {
        return this.get('/api/etkinlikler');
    }

    // Landing page events (public endpoint)
    async getLandingPageEvents() {
        return this.get('/api/landing-page-etkinlikler');
    }

    // Event participation endpoints (for members)
    async joinEvent(etkinlikId) {
        return this.post('/api/etkinlik/katil', { etkinlikId });
    }

    async leaveEvent(etkinlikId) {
        return this.delete(`/api/etkinlik/${etkinlikId}/ayril`);
    }

    // Admin endpoints
    async getApplications() {
        return this.get('/api/admin/basvurular');
    }

    async getMembers() {
        return this.get('/api/admin/uyeler');
    }

    async addSponsor(sponsorData) {
        return this.post('/api/admin/sponsor', sponsorData);
    }

    async addNews(newsData) {
        return this.post('/api/admin/haber', newsData);
    }

    async addEvent(eventData) {
        return this.post('/api/admin/etkinlik', eventData);
    }

    async getStatistics() {
        return this.get('/api/admin/statistics');
    }

    // Etkinlik güncelleme
    async updateEvent(eventId, eventData) {
        return this.put(`/api/admin/etkinlik/${eventId}`, eventData);
    }

    // Etkinlik silme
    async deleteEvent(id) {
        return this.delete(`/api/admin/etkinlik/${id}`);
    }
    // Haber silme
    async deleteNews(id) {
        return this.delete(`/api/admin/haber/${id}`);
    }
    // Sponsor silme
    async deleteSponsor(id) {
        return this.delete(`/api/admin/sponsor/${id}`);
    }

    // Tekil içerik ve detay endpointleri
    async getNewsById(id) {
        return this.get(`/api/admin/haber/${id}`);
    }
    async getSponsorById(id) {
        return this.get(`/api/admin/sponsor/${id}`);
    }
    async getEventById(id) {
        return this.get(`/api/admin/etkinlik/${id}`);
    }
    async getUserById(id) {
        return this.get(`/api/admin/uye/${id}`);
    }

    // Üye durumu değiştirme (aktif/pasif)
    async toggleMemberStatus(memberId, status) {
        return this.post('/api/admin/uye-status', {
            uyeId: memberId,
            status: status
        });
    }

    // Dosya yükleme (ör: profil fotoğrafı)
    async uploadFile(file, folder = 'uploads') {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);
        try {
            const response = await fetch(`${this.baseURL}/api/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': this.getAuthHeaders()['Authorization']
                },
                body: formData
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Dosya yüklenemedi');
            }
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Başvuru detaylarını getirme
    async getApplicationById(applicationId) {
        return this.get(`/api/admin/basvuru/${applicationId}`);
    }

    // Başvuru onaylama
    async approveApplication(applicationId) {
        return this.post('/api/admin/basvuru-karar', { 
            basvuruId: applicationId, 
            karar: 'onayla',
            reddetmeNedeni: ''
        });
    }

    // Başvuru reddetme
    async rejectApplication(applicationId, reason) {
        return this.post('/api/admin/basvuru-karar', { 
            basvuruId: applicationId, 
            karar: 'reddet',
            reddetmeNedeni: reason
        });
    }

    // İçerik türüne göre ilgili endpointi çağırır
    getContent(type) {
        if (type === 'news') {
            return this.getNews();
        } else if (type === 'sponsors') {
            return this.getSponsors();
        } else {
            return Promise.resolve({ success: false, error: 'Desteklenmeyen içerik türü' });
        }
    }
}

// Global instance
window.apiService = new ApiService(); 