// Authentication Service - Backend API Integration
class AuthService {
    constructor() {
        this.apiService = window.apiService;
        this.currentUser = null;
    }

    // Giriş yap
    async signIn(email, password) {
        try {
            const result = await this.apiService.login(email, password);

            if (result.success && result.data.token) {
                // Token'ı sakla
                this.apiService.setToken(result.data.token);
                
                // Token kontrolü
                const savedToken = localStorage.getItem('bf_token');
                console.log('Token saved in signIn:', savedToken ? 'exists' : 'not found');
                
                // Kullanıcı bilgilerini sakla
                this.currentUser = {
                    userId: result.data.userId,
                    userType: result.data.userType,
                    ad: result.data.ad,
                    soyad: result.data.soyad,
                    email: result.data.email
                };

                return { 
                    success: true, 
                    data: result.data,
                    message: 'Giriş başarılı!' 
                };
            } else {
                return {
                    success: false,
                    error: result.error || 'Giriş başarısız'
                };
            }
        } catch (error) {
            return { 
                success: false, 
                error: 'Giriş yapılırken bir hata oluştu.'
            };
        }
    }

    // Çıkış yap
    async signOut() {
        this.apiService.removeToken();
        this.currentUser = null;
        return { success: true, message: 'Çıkış yapıldı.' };
    }

    // Mevcut kullanıcıyı al
    async getCurrentUser() {
        try {
            const token = localStorage.getItem('bf_token');
            
            if (!token) {
                return { success: false, error: 'Kullanıcı giriş yapmamış' };
            }
            
            // Eğer currentUser yoksa, token'dan yeniden yükle
            if (!this.currentUser) {
                const result = await this.apiService.getProfile();
                
                if (result.success) {
                    this.currentUser = result.data;
                    return { success: true, data: result.data };
                } else {
                    // Token geçersiz, temizle
                    this.apiService.removeToken();
                    return { success: false, error: 'Oturum süresi dolmuş' };
                }
            }
            
            return { success: true, data: this.currentUser };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Kullanıcı giriş yapmış mı?
    async isAuthenticated() {
        const result = await this.getCurrentUser();
        return result.success;
    }

    // Admin kontrolü
    async isAdmin() {
        if (!this.currentUser) return false;
        return this.currentUser.userType === 'admin';
    }

    // Kullanıcı profilini güncelle
    async updateProfile(updates) {
        try {
            const result = await this.apiService.put('/api/profile', updates);
            if (result.success) {
                // Profil güncellendiyse currentUser bilgisini de güncelle
                this.currentUser = { ...this.currentUser, ...updates };
            }
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Şifre değiştir (normal kullanıcı)
    async changePassword(currentPassword, newPassword, newPasswordConfirm) {
        try {
            // Validasyon
            if (!currentPassword || !newPassword || !newPasswordConfirm) {
                return { success: false, error: 'Tüm alanları doldurun' };
            }

            if (newPassword !== newPasswordConfirm) {
                return { success: false, error: 'Yeni şifreler eşleşmiyor' };
            }

            if (newPassword.length < 6) {
                return { success: false, error: 'Yeni şifre en az 6 karakter olmalıdır' };
            }

            if (currentPassword === newPassword) {
                return { success: false, error: 'Yeni şifre mevcut şifreden farklı olmalıdır' };
            }

            const data = {
                mevcutSifre: currentPassword,
                yeniSifre: newPassword,
                yeniSifreTekrar: newPasswordConfirm
            };

            const result = await this.apiService.put('/api/uye/sifre-degistir', data);
            
            if (result.success) {
                return { 
                    success: true, 
                    message: 'Şifreniz başarıyla değiştirildi!' 
                };
            } else {
                return { 
                    success: false, 
                    error: result.error || 'Şifre değiştirme başarısız' 
                };
            }
        } catch (error) {
            return { 
                success: false, 
                error: 'Şifre değiştirme sırasında bir hata oluştu' 
            };
        }
    }

    // Admin şifre değiştir
    async changeAdminPassword(currentPassword, newPassword, newPasswordConfirm) {
        try {
            // Validasyon
            if (!currentPassword || !newPassword || !newPasswordConfirm) {
                return { success: false, error: 'Tüm alanları doldurun' };
            }

            if (newPassword !== newPasswordConfirm) {
                return { success: false, error: 'Yeni şifreler eşleşmiyor' };
            }

            if (newPassword.length < 6) {
                return { success: false, error: 'Yeni şifre en az 6 karakter olmalıdır' };
            }

            if (currentPassword === newPassword) {
                return { success: false, error: 'Yeni şifre mevcut şifreden farklı olmalıdır' };
            }

            const data = {
                mevcutSifre: currentPassword,
                yeniSifre: newPassword,
                yeniSifreTekrar: newPasswordConfirm
            };

            const result = await this.apiService.put('/api/admin/sifre-degistir', data);
            
            if (result.success) {
                return { 
                    success: true, 
                    message: 'Admin şifreniz başarıyla değiştirildi!' 
                };
            } else {
                return { 
                    success: false, 
                    error: result.error || 'Admin şifre değiştirme başarısız' 
                };
            }
        } catch (error) {
            return { 
                success: false, 
                error: 'Admin şifre değiştirme sırasında bir hata oluştu' 
            };
        }
    }

    // Sayfa yönlendirmeleri
    async redirectToDashboard() {
        const isUserAdmin = await this.isAdmin();
        
        if (isUserAdmin) {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'dashboard.html';
        }
    }

    redirectToLogin() {
        window.location.href = 'login.html';
    }
}

// Global instance
window.authService = new AuthService();

// Utility functions
window.showAuthMessage = function(message, type = 'success') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `auth-message ${type}`;
    messageDiv.textContent = message;
    
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        max-width: 400px;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transform: translateX(400px);
        transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        messageDiv.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 300);
    }, 4000);
}; 