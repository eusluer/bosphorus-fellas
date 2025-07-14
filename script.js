// Global variables
let users = JSON.parse(localStorage.getItem('bf_users')) || [];
let applications = JSON.parse(localStorage.getItem('bf_applications')) || [];
let news = JSON.parse(localStorage.getItem('bf_news')) || [
    {
        id: 1,
        title: 'Kış Buluşması Yaklaşıyor',
        content: '25 Aralık tarihinde Maslak\'ta gerçekleşecek kış buluşmamız için hazırlanıyoruz.',
        date: '2024-12-20',
        author: 'Admin'
    },
    {
        id: 2,
        title: 'Yeni Sponsor Anlaşması',
        content: 'Premium Motor Yağları ile yeni bir sponsorluk anlaşması imzaladık.',
        date: '2024-12-18',
        author: 'Admin'
    }
];
let events = JSON.parse(localStorage.getItem('bf_events')) || [
    {
        id: 1,
        title: 'Kış Buluşması',
        date: '2024-12-25',
        time: '14:00',
        location: 'Maslak - İstanbul',
        description: 'Kış ayının geleneksel buluşması'
    },
    {
        id: 2,
        title: 'Track Day',
        date: '2025-01-05',
        time: '09:00',
        location: 'Istanbul Park',
        description: 'Pist gününde adrenalin dolu anlar'
    }
];
let opportunities = JSON.parse(localStorage.getItem('bf_opportunities')) || [
    {
        id: 1,
        title: 'Motor Yağı %30 İndirim',
        description: 'Premium motor yağlarında özel indirim',
        company: 'Premium Motor Yağları',
        discount: '30%'
    },
    {
        id: 2,
        title: 'Servis İndirimi',
        description: 'Tüm bakım işlemlerinde indirim',
        company: 'Oto Servis',
        discount: '20%'
    }
];

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    
    console.log('initTheme called, savedTheme:', savedTheme);
    console.log('themeToggle found:', !!themeToggle);
    console.log('themeIcon found:', !!themeIcon);
    
    // Set initial theme
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme, themeIcon);
    
    // Theme toggle event - remove existing listeners first
    if (themeToggle) {
        // Remove any existing listeners
        themeToggle.replaceWith(themeToggle.cloneNode(true));
        const newThemeToggle = document.getElementById('themeToggle');
        const newThemeIcon = document.getElementById('themeIcon');
        
        newThemeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            console.log('Theme toggle clicked, switching from', currentTheme, 'to', newTheme);
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeIcon(newTheme, newThemeIcon);
        });
    }
}

function updateThemeIcon(theme, iconElement) {
    if (iconElement) {
        if (theme === 'dark') {
            iconElement.className = 'fas fa-sun';
        } else {
            iconElement.className = 'fas fa-moon';
        }
        console.log('Icon updated for theme:', theme, 'new class:', iconElement.className);
    }
}

// Make initTheme globally available
window.initTheme = initTheme;
window.updateThemeIcon = updateThemeIcon;

// BosphorusFellas namespace
const BosphorusFellas = {
    // Theme Management
    initTheme: initTheme,
    toggleTheme: function() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        const themeIcon = document.getElementById('themeIcon');
        updateThemeIcon(newTheme, themeIcon);
    },
    
    // Authentication
    login: login,
    logout: logout,
    register: register,
    getCurrentUser: function() {
        const token = localStorage.getItem('bf_token');
        if (token) {
            try {
                return JSON.parse(atob(token));
            } catch (error) {
                localStorage.removeItem('bf_token');
                return null;
            }
        }
        return null;
    },
    
    // Application Management
    submitApplication: submitApplication,
    approveApplication: approveApplication,
    rejectApplication: rejectApplication,
    getApplications: function() { return applications; },
    
    // Data Management
    addNews: addNews,
    addEvent: addEvent,
    addOpportunity: addOpportunity,
    getNews: function() { return news; },
    getEvents: function() { return events; },
    getOpportunities: function() { return opportunities; },
    getUsers: function() { return users; },
    
    // Utilities
    formatDate: formatDate,
    showNotification: showNotification
};

// Make it globally available
window.BosphorusFellas = BosphorusFellas;

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    // API servislerini başlat - sadece bir kez
    if (typeof ApiService !== 'undefined' && !window.apiService) {
        window.apiService = new ApiService();
    }
    if (typeof AuthService !== 'undefined' && !window.authService) {
        window.authService = new AuthService();
    }
    
    initTheme();
    initializeApp();
    setupEventListeners();
    checkAuthStatus();
    
    // Etkinlikleri yükle (sadece index.html sayfasında)
    if (window.location.pathname === '/index.html' || window.location.pathname === '/' || window.location.pathname.endsWith('index.html')) {
        // API servisleri hazır olduktan sonra etkinlikleri yükle
        setTimeout(() => {
            loadLandingPageEvents();
        }, 100);
    }
});

// Initialize application
function initializeApp() {
    // Create default admin user if not exists
    if (!users.find(user => user.email === 'admin@bosphorusfellas.com')) {
        users.push({
            id: 'admin_001',
            email: 'admin@bosphorusfellas.com',
            password: 'admin123',
            firstName: 'Admin',
            lastName: 'User',
            role: 'admin',
            status: 'approved',
            joinDate: new Date().toISOString()
        });
        saveData('bf_users', users);
    }
}

// Setup event listeners
function setupEventListeners() {
    // Mobile menu toggle
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            hamburger.classList.toggle('active');
        });
    }
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Navbar background on scroll (only for index.html)
    if (window.location.pathname === '/index.html' || window.location.pathname === '/' || window.location.pathname.endsWith('index.html')) {
        window.addEventListener('scroll', function() {
            const header = document.querySelector('.header');
            if (header && window.scrollY > 100) {
                header.style.background = 'rgba(255, 255, 255, 0.98)';
                header.style.boxShadow = '0 8px 40px rgba(0, 0, 0, 0.08)';
            } else if (header) {
                header.style.background = 'rgba(255, 255, 255, 0.95)';
                header.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.05)';
            }
        });
    }
}

// Check authentication status
function checkAuthStatus() {
    const token = localStorage.getItem('bf_token');
    if (token) {
        try {
            // JWT token'ı decode etmeye çalışma, sadece varlığını kontrol et
            window.currentUser = { hasToken: true };
            updateNavigation();
        } catch (error) {
            // Token varsa silme, sadece log'la
            console.log('Token decode error (expected for JWT):', error);
        }
    }
}

// Update navigation based on auth status
function updateNavigation() {
    const loginBtn = document.querySelector('.login-btn');
    const applyBtn = document.querySelector('.apply-btn');
    
    if (window.currentUser && window.currentUser.hasToken && loginBtn && applyBtn) {
        const navMenu = loginBtn.closest('.nav-menu');
        
        // Remove login and apply buttons
        loginBtn.parentElement.remove();
        applyBtn.parentElement.remove();
        
        // Add user menu
        const userMenu = document.createElement('li');
        userMenu.innerHTML = `
            <div class="user-menu">
                <span class="user-name">Kullanıcı</span>
                <div class="dropdown">
                    <a href="dashboard.html">Panel</a>
                    <a href="#" onclick="logout()">Çıkış</a>
                </div>
            </div>
        `;
        navMenu.appendChild(userMenu);
    }
}

// Authentication functions
function login(email, password) {
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
        throw new Error('Geçersiz email veya şifre');
    }
    
    if (user.status !== 'approved') {
        throw new Error('Üyeliğiniz henüz onaylanmamış');
    }
    
    const token = btoa(JSON.stringify({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
    }));
    
    localStorage.setItem('bf_token', token);
    window.currentUser = user;
    
    return user;
}

function logout() {
    localStorage.removeItem('bf_token');
    window.currentUser = null;
    window.location.href = 'login.html';
}

function register(userData) {
    // Check if email already exists
    if (users.find(u => u.email === userData.email)) {
        throw new Error('Bu email adresi zaten kullanılmaktadır');
    }
    
    const newUser = {
        id: 'user_' + Date.now(),
        ...userData,
        role: 'member',
        status: 'pending',
        joinDate: new Date().toISOString()
    };
    
    users.push(newUser);
    saveData('bf_users', users);
    
    return newUser;
}

// Application functions
function submitApplication(applicationData) {
    const newApplication = {
        id: 'app_' + Date.now(),
        ...applicationData,
        status: 'pending',
        submitDate: new Date().toISOString()
    };
    
    applications.push(newApplication);
    saveData('bf_applications', applications);
    
    return newApplication;
}

function approveApplication(applicationId) {
    const application = applications.find(app => app.id === applicationId);
    if (application) {
        application.status = 'approved';
        
        // Create user account
        const newUser = {
            id: 'user_' + Date.now(),
            email: application.email,
            password: 'temp123', // Temporary password
            firstName: application.firstName,
            lastName: application.lastName,
            phone: application.phone,
            carBrand: application.carBrand,
            carModel: application.carModel,
            carYear: application.carYear,
            role: 'member',
            status: 'approved',
            joinDate: new Date().toISOString()
        };
        
        users.push(newUser);
        saveData('bf_users', users);
        saveData('bf_applications', applications);
        
        return newUser;
    }
    throw new Error('Başvuru bulunamadı');
}

function rejectApplication(applicationId) {
    const application = applications.find(app => app.id === applicationId);
    if (application) {
        application.status = 'rejected';
        saveData('bf_applications', applications);
        return application;
    }
    throw new Error('Başvuru bulunamadı');
}

// Content management functions
function addNews(newsData) {
    const newNews = {
        id: Date.now(),
        ...newsData,
        date: new Date().toISOString(),
        author: window.currentUser ? window.currentUser.firstName + ' ' + window.currentUser.lastName : 'Admin'
    };
    
    news.unshift(newNews);
    saveData('bf_news', news);
    
    return newNews;
}

function addEvent(eventData) {
    const newEvent = {
        id: Date.now(),
        ...eventData
    };
    
    events.push(newEvent);
    saveData('bf_events', events);
    
    return newEvent;
}

function addOpportunity(opportunityData) {
    const newOpportunity = {
        id: Date.now(),
        ...opportunityData
    };
    
    opportunities.push(newOpportunity);
    saveData('bf_opportunities', opportunities);
    
    return newOpportunity;
}

// Utility functions
function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;
    
    // Add notification styles if not exists
    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 1rem 2rem;
                border-radius: 8px;
                color: white;
                font-weight: 600;
                z-index: 10000;
                display: flex;
                align-items: center;
                gap: 1rem;
                animation: slideIn 0.3s ease-out;
            }
            .notification-success { background: #28a745; }
            .notification-error { background: #dc3545; }
            .notification-warning { background: #ffc107; color: #212529; }
            .notification button {
                background: none;
                border: none;
                color: inherit;
                font-size: 1.2rem;
                cursor: pointer;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Landing page etkinliklerini yükle
async function loadLandingPageEvents() {
    const eventsContainer = document.getElementById('eventsContainer');
    if (!eventsContainer) return;

    // API servisi kontrolü
    if (!window.apiService) {
        showEventsError('API servisi yüklenemedi. Lütfen sayfayı yenileyin.');
        return;
    }

    try {
        // API'den etkinlikleri al
        const result = await window.apiService.getLandingPageEvents();
        
        if (result.success && result.data) {
            displayEvents(result.data);
        } else {
            showEventsError('Etkinlikler yüklenirken bir hata oluştu.');
        }
    } catch (error) {
        console.error('Etkinlik yükleme hatası:', error);
        showEventsError('Etkinlikler yüklenirken bir hata oluştu.');
    }
}

// Etkinlikleri görüntüle
function displayEvents(events) {
    const eventsContainer = document.getElementById('eventsContainer');
    if (!eventsContainer) return;

    if (!events || events.length === 0) {
        eventsContainer.innerHTML = `
            <div class="no-events">
                <i class="fas fa-calendar-times"></i>
                <p>Şu anda aktif etkinlik bulunmuyor.</p>
            </div>
        `;
        return;
    }

    const eventsHTML = events.map((event, index) => {
        const isFeatured = index === 0; // İlk etkinlik öne çıkan olsun
        return createEventCard(event, isFeatured);
    }).join('');

    eventsContainer.innerHTML = eventsHTML;
}

// Etkinlik kartı oluştur
function createEventCard(event, isFeatured = false) {
    const isAuthenticated = window.authService && window.authService.isAuthenticated();
    
    return `
        <div class="event-card ${isFeatured ? 'featured' : ''}">
            <div class="event-image">
                <div class="event-badge">${isFeatured ? 'Öne Çıkan' : 'Etkinlik'}</div>
            </div>
            <div class="event-content">
                <h3>${event.baslik || 'Etkinlik'}</h3>
                <p>Bu etkinliğe katılmak için üye olmanız gerekmektedir.</p>
                <div class="event-meta">
                    <span><i class="fas fa-map-marker-alt"></i> ${event.adres || 'Adres belirtilmemiş'}</span>
                </div>
                <button class="event-btn" onclick="handleEventParticipation(${event.id})">
                    ${isAuthenticated ? 'Katıl' : 'Üye Ol'}
                    <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        </div>
    `;
}

// Etkinlik katılım işlemi
function handleEventParticipation(eventId) {
    window.location.href = 'apply.html';
}

// Etkinliğe katıl
async function joinEvent(eventId) {
    if (!window.apiService) {
        showNotification('API servisi yüklenemedi.', 'error');
        return;
    }

    try {
        const result = await window.apiService.joinEvent(eventId);
        
        if (result.success) {
            showNotification('Etkinliğe başarıyla katıldınız!', 'success');
        } else {
            showNotification(result.error || 'Etkinliğe katılırken bir hata oluştu.', 'error');
        }
    } catch (error) {
        console.error('Etkinlik katılım hatası:', error);
        showNotification('Etkinliğe katılırken bir hata oluştu.', 'error');
    }
}

// Etkinlik yükleme hatası göster
function showEventsError(message) {
    const eventsContainer = document.getElementById('eventsContainer');
    if (eventsContainer) {
        eventsContainer.innerHTML = `
            <div class="events-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
                <button onclick="loadLandingPageEvents()" class="retry-btn">
                    <i class="fas fa-redo"></i>
                    Tekrar Dene
                </button>
            </div>
        `;
    }
}

// Export functions for use in other pages
window.BosphorusFellas = {
    login,
    logout,
    register,
    submitApplication,
    approveApplication,
    rejectApplication,
    addNews,
    addEvent,
    addOpportunity,
    formatDate,
    showNotification,
    loadLandingPageEvents,
    handleEventParticipation,
    joinEvent,
    getCurrentUser: () => window.currentUser,
    getUsers: () => users,
    getApplications: () => applications,
    getNews: () => news,
    getEvents: () => events,
    getOpportunities: () => opportunities
}; 