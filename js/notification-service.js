// Notification Service Layer - Bildirim Sistemi
class NotificationService {
    constructor() {
        this.client = window.supabaseClient;
        this.updateInterval = null;
        this.lastCheck = new Date();
        this.unreadCount = 0;
        this.notifications = [];
    }

    // Initialize notification system
    async initialize() {
        try {
            await this.loadNotifications();
            this.startPeriodicCheck();
            this.setupUI();
        } catch (error) {
            console.error('Notification service initialization error:', error);
        }
    }

    // Load user notifications
    async loadNotifications(isRead = null) {
        try {
            const { data: { user } } = await this.client.auth.getUser();
            if (!user) return { success: false, error: 'User not authenticated' };

            const result = await window.dbService.getUserNotifications(user.id, isRead);
            
            if (result.success) {
                this.notifications = result.data;
                this.unreadCount = this.notifications.filter(n => !n.is_read).length;
                this.updateNotificationUI();
            }

            return result;
        } catch (error) {
            console.error('Load notifications error:', error);
            return { success: false, error: error.message };
        }
    }

    // Create notification
    async createNotification(userId, title, message, type, relatedId = null, actionUrl = null) {
        try {
            const result = await window.dbService.createNotification(
                userId, title, message, type, relatedId, actionUrl
            );

            if (result.success) {
                // If it's for current user, add to local notifications
                const { data: { user } } = await this.client.auth.getUser();
                if (user && user.id === userId) {
                    this.notifications.unshift(result.data);
                    this.unreadCount++;
                    this.updateNotificationUI();
                    this.showToast(title, message, type);
                }
            }

            return result;
        } catch (error) {
            console.error('Create notification error:', error);
            return { success: false, error: error.message };
        }
    }

    // Mark notification as read
    async markAsRead(notificationId) {
        try {
            const result = await window.dbService.markNotificationAsRead(notificationId);
            
            if (result.success) {
                // Update local notification
                const notification = this.notifications.find(n => n.id === notificationId);
                if (notification && !notification.is_read) {
                    notification.is_read = true;
                    this.unreadCount = Math.max(0, this.unreadCount - 1);
                    this.updateNotificationUI();
                }
            }

            return result;
        } catch (error) {
            console.error('Mark as read error:', error);
            return { success: false, error: error.message };
        }
    }

    // Mark all notifications as read
    async markAllAsRead() {
        try {
            const unreadNotifications = this.notifications.filter(n => !n.is_read);
            
            for (const notification of unreadNotifications) {
                await this.markAsRead(notification.id);
            }

            return { success: true };
        } catch (error) {
            console.error('Mark all as read error:', error);
            return { success: false, error: error.message };
        }
    }

    // Start periodic check for new notifications
    startPeriodicCheck(interval = 30000) { // 30 seconds
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        this.updateInterval = setInterval(async () => {
            await this.checkForNewNotifications();
        }, interval);
    }

    // Stop periodic check
    stopPeriodicCheck() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    // Check for new notifications
    async checkForNewNotifications() {
        try {
            const { data: { user } } = await this.client.auth.getUser();
            if (!user) return;

            // Get notifications newer than last check
            const { data, error } = await this.client
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .gte('created_at', this.lastCheck.toISOString())
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data && data.length > 0) {
                // Add new notifications to the beginning
                const newNotifications = data.filter(newNotif => 
                    !this.notifications.some(existing => existing.id === newNotif.id)
                );

                if (newNotifications.length > 0) {
                    this.notifications = [...newNotifications, ...this.notifications];
                    this.unreadCount += newNotifications.filter(n => !n.is_read).length;
                    this.updateNotificationUI();

                    // Show toast for new notifications
                    newNotifications.forEach(notification => {
                        this.showToast(notification.title, notification.message, notification.notification_type);
                    });
                }
            }

            this.lastCheck = new Date();

        } catch (error) {
            console.error('Check new notifications error:', error);
        }
    }

    // Setup notification UI
    setupUI() {
        this.createNotificationBell();
        this.createNotificationPanel();
        this.createToastContainer();
    }

    // Create notification bell icon
    createNotificationBell() {
        let bellContainer = document.getElementById('notificationBell');
        
        if (!bellContainer) {
            // Find a suitable place to add the bell (navbar, header, etc.)
            const navbar = document.querySelector('.nav-buttons, .navbar .nav-menu');
            if (navbar) {
                bellContainer = document.createElement('div');
                bellContainer.id = 'notificationBell';
                bellContainer.className = 'notification-bell-container';
                navbar.appendChild(bellContainer);
            }
        }

        if (bellContainer) {
            bellContainer.innerHTML = `
                <button class="notification-bell" onclick="toggleNotificationPanel()">
                    <i class="fas fa-bell"></i>
                    <span class="notification-badge" id="notificationBadge">0</span>
                </button>
            `;
        }
    }

    // Create notification panel
    createNotificationPanel() {
        let panel = document.getElementById('notificationPanel');
        
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'notificationPanel';
            panel.className = 'notification-panel hidden';
            document.body.appendChild(panel);
        }

        panel.innerHTML = `
            <div class="notification-header">
                <h3><i class="fas fa-bell"></i> Bildirimler</h3>
                <div class="notification-actions">
                    <button class="btn btn-sm btn-primary" onclick="markAllNotificationsAsRead()">
                        <i class="fas fa-check-double"></i> Tümünü Okundu İşaretle
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="closeNotificationPanel()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="notification-list" id="notificationList">
                <!-- Notifications will be populated here -->
            </div>
        `;
    }

    // Create toast container
    createToastContainer() {
        let container = document.getElementById('toastContainer');
        
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
    }

    // Update notification UI
    updateNotificationUI() {
        // Update badge
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            badge.textContent = this.unreadCount;
            badge.style.display = this.unreadCount > 0 ? 'inline' : 'none';
        }

        // Update notification list
        this.updateNotificationList();
    }

    // Update notification list
    updateNotificationList() {
        const list = document.getElementById('notificationList');
        if (!list) return;

        if (this.notifications.length === 0) {
            list.innerHTML = '<div class="empty-notifications">Henüz bildirim yok</div>';
            return;
        }

        list.innerHTML = this.notifications.map(notification => `
            <div class="notification-item ${notification.is_read ? 'read' : 'unread'}" 
                 data-notification-id="${notification.id}"
                 onclick="handleNotificationClick('${notification.id}')">
                
                <div class="notification-icon">
                    <i class="fas fa-${this.getNotificationIcon(notification.notification_type)}"></i>
                </div>
                
                <div class="notification-content">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-time">${this.formatNotificationTime(notification.created_at)}</div>
                </div>
                
                ${!notification.is_read ? '<div class="unread-indicator"></div>' : ''}
            </div>
        `).join('');
    }

    // Show toast notification
    showToast(title, message, type = 'info', duration = 5000) {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        container.appendChild(toast);

        // Auto remove after duration
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, duration);

        // Add slide-in animation
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
    }

    // Get notification icon based on type
    getNotificationIcon(type) {
        const iconMap = {
            'event': 'calendar',
            'application': 'user-plus',
            'system': 'cog',
            'announcement': 'bullhorn',
            'message': 'envelope',
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return iconMap[type] || 'bell';
    }

    // Format notification time
    formatNotificationTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Şimdi';
        if (diffMins < 60) return `${diffMins} dakika önce`;
        if (diffHours < 24) return `${diffHours} saat önce`;
        if (diffDays < 7) return `${diffDays} gün önce`;
        
        return date.toLocaleDateString('tr-TR');
    }

    // Send bulk notification to multiple users
    async sendBulkNotification(userIds, title, message, type, relatedId = null) {
        const results = [];
        
        for (const userId of userIds) {
            const result = await this.createNotification(userId, title, message, type, relatedId);
            results.push({ userId, ...result });
        }

        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        return {
            success: failed === 0,
            total: userIds.length,
            successful,
            failed,
            results
        };
    }

    // Send notification to all members
    async sendToAllMembers(title, message, type, relatedId = null) {
        try {
            const membersResult = await window.dbService.getAllMembers();
            if (!membersResult.success) {
                return { success: false, error: 'Failed to get members list' };
            }

            const userIds = membersResult.data.map(member => member.id);
            return await this.sendBulkNotification(userIds, title, message, type, relatedId);

        } catch (error) {
            console.error('Send to all members error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get all notifications for admin (with enhanced bulk notification support)
    async getNotifications() {
        try {
            const { data, error } = await this.client
                .from('notifications')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);
                
            if (error) throw error;
            
            return { success: true, data };
        } catch (error) {
            console.error('Get notifications error:', error);
            return { success: false, error: error.message };
        }
    }

    // Enhanced bulk notification for admin panel
    async sendBulkNotificationAdmin(notificationData) {
        try {
            const { recipient_type, title, content, notification_type, send_email } = notificationData;
            
            // Get recipient users based on type
            let recipients = [];
            
            switch (recipient_type) {
                case 'all_members':
                    const allMembersResult = await window.dbService.getUsers('member');
                    if (allMembersResult.success) {
                        recipients = allMembersResult.data;
                    }
                    break;
                    
                case 'active_members':
                    const activeMembersResult = await window.dbService.getUsers('member');
                    if (activeMembersResult.success) {
                        // Filter for members who logged in within last 30 days
                        const thirtyDaysAgo = new Date();
                        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                        recipients = activeMembersResult.data.filter(user => 
                            user.last_login_at && new Date(user.last_login_at) > thirtyDaysAgo
                        );
                    }
                    break;
                    
                case 'event_participants':
                    // For now, send to all members - can be enhanced to filter by specific event
                    const eventMembersResult = await window.dbService.getUsers('member');
                    if (eventMembersResult.success) {
                        recipients = eventMembersResult.data;
                    }
                    break;
                    
                default:
                    const defaultResult = await window.dbService.getUsers('member');
                    if (defaultResult.success) {
                        recipients = defaultResult.data;
                    }
            }
            
            if (recipients.length === 0) {
                return { success: false, error: 'No recipients found' };
            }
            
            // Create notifications for all recipients
            const notifications = recipients.map(user => ({
                user_id: user.id,
                title,
                message: content,
                notification_type,
                created_at: new Date().toISOString()
            }));
            
            // Bulk insert notifications
            const { data, error } = await this.client
                .from('notifications')
                .insert(notifications);
                
            if (error) throw error;
            
            // If email sending is enabled, you can add email logic here
            if (send_email) {
                console.log('Email sending would be implemented here');
                // TODO: Implement email sending logic
            }
            
            return { 
                success: true, 
                data: { 
                    sent_count: recipients.length,
                    recipient_type,
                    email_sent: send_email
                }
            };
            
        } catch (error) {
            console.error('Send bulk notification admin error:', error);
            return { success: false, error: error.message };
        }
    }

    // Cleanup
    destroy() {
        this.stopPeriodicCheck();
        
        // Remove UI elements
        const bell = document.getElementById('notificationBell');
        const panel = document.getElementById('notificationPanel');
        const toastContainer = document.getElementById('toastContainer');
        
        if (bell) bell.remove();
        if (panel) panel.remove();
        if (toastContainer) toastContainer.remove();
    }
}

// Global instance
window.notificationService = new NotificationService();

// Global functions for UI interaction
function toggleNotificationPanel() {
    const panel = document.getElementById('notificationPanel');
    if (panel) {
        panel.classList.toggle('hidden');
        
        // Mark notifications as read when panel is opened
        if (!panel.classList.contains('hidden')) {
            const unreadNotifications = window.notificationService.notifications.filter(n => !n.is_read);
            unreadNotifications.forEach(notification => {
                window.notificationService.markAsRead(notification.id);
            });
        }
    }
}

function closeNotificationPanel() {
    const panel = document.getElementById('notificationPanel');
    if (panel) {
        panel.classList.add('hidden');
    }
}

async function markAllNotificationsAsRead() {
    await window.notificationService.markAllAsRead();
}

async function handleNotificationClick(notificationId) {
    const notification = window.notificationService.notifications.find(n => n.id === notificationId);
    if (!notification) return;

    // Mark as read if not already
    if (!notification.is_read) {
        await window.notificationService.markAsRead(notificationId);
    }

    // Navigate to action URL if available
    if (notification.action_url) {
        window.location.href = notification.action_url;
    }
}

// Initialize notification service when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is authenticated before initializing
    window.supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
            window.notificationService.initialize();
        } else if (event === 'SIGNED_OUT') {
            window.notificationService.destroy();
        }
    });
});

// Close notification panel when clicking outside
document.addEventListener('click', function(event) {
    const panel = document.getElementById('notificationPanel');
    const bell = document.getElementById('notificationBell');
    
    if (panel && !panel.classList.contains('hidden') && 
        !panel.contains(event.target) && 
        !bell.contains(event.target)) {
        closeNotificationPanel();
    }
}); 