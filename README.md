# 🚗 Bosphorus Fellas - Otomobil Topluluğu Web Sitesi

## 📋 Proje Hakkında

Bosphorus Fellas, otomobil tutkunlarını bir araya getiren premium bir topluluk web sitesidir. Bu proje, modern web teknolojileri kullanılarak geliştirilmiş ve backend API ile entegre edilmiştir.

## 🌟 Özellikler

### 🔐 Kimlik Doğrulama Sistemi
- **Giriş/Çıkış Sistemi**: Güvenli JWT tabanlı kimlik doğrulama
- **Üyelik Başvuru Sistemi**: Detaylı başvuru formu ile üye kaydı
- **Admin Paneli**: Başvuru onay/red işlemleri
- **Profil Yönetimi**: Kullanıcı bilgileri güncelleme

### 👥 Üyelik Yönetimi
- **Başvuru Süreci**: Kapsamlı başvuru formu
- **Admin Onayı**: Başvuruları inceleme ve onaylama
- **Üye Profilleri**: Detaylı üye bilgileri
- **Durum Takibi**: Üyelik durumu kontrolü

### 🎯 Etkinlik Sistemi
- **Etkinlik Görüntüleme**: Aktif etkinlikleri listeleme
- **Katılım Sistemi**: Etkinliklere katılma/ayrılma
- **Katılımcı Takibi**: Etkinlik katılımcı sayısı
- **Etkinlik Yönetimi**: Admin panelinden etkinlik oluşturma

### 📱 İçerik Yönetimi
- **Haberler**: Topluluk haberleri
- **Sponsorlar**: Sponsor içerikleri
- **Medya Yönetimi**: Fotoğraf yükleme sistemi

### 🎨 Kullanıcı Deneyimi
- **Responsive Tasarım**: Mobil uyumlu arayüz
- **Dark/Light Mode**: Tema değiştirme
- **Modern UI**: Glassmorphism tasarım
- **Smooth Animations**: Akıcı geçiş efektleri

## 🛠️ Teknolojiler

### Frontend
- **HTML5**: Modern semantik yapı
- **CSS3**: Flexbox, Grid, Custom Properties
- **JavaScript (ES6+)**: Modern JavaScript özellikleri
- **Font Awesome**: İkon kütüphanesi
- **Google Fonts**: Poppins & Playfair Display

### Backend API
- **Base URL**: `https://w101-production-e26e.up.railway.app`
- **Authentication**: JWT Bearer Token
- **File Upload**: Multipart form data
- **Response Format**: JSON

## 📁 Proje Yapısı

```
bosphorus_fellas/
├── index.html              # Ana sayfa
├── login.html              # Giriş sayfası
├── apply.html              # Başvuru sayfası
├── dashboard.html          # Üye paneli
├── admin.html              # Admin paneli
├── style.css               # Ana stil dosyası
├── script.js               # Ana JavaScript dosyası
├── js/
│   ├── api-service.js      # Backend API servisi
│   └── auth-service.js     # Kimlik doğrulama servisi
├── img/                    # Görseller
├── sql/                    # SQL dosyaları (eski)
└── README.md              # Bu dosya
```

## 🚀 Kurulum ve Çalıştırma

### 1. Proje Dosyalarını İndirin
```bash
git clone <repository-url>
cd bosphorus_fellas
```

### 2. Web Sunucusu Başlatın
```bash
# Python ile
python -m http.server 8000

# Node.js ile
npx http-server

# PHP ile
php -S localhost:8000
```

### 3. Tarayıcıda Açın
```
http://localhost:8000
```

## 🔧 API Entegrasyonu

### Backend API Bilgileri
- **Base URL**: `https://w101-production-e26e.up.railway.app`
- **API Dokümantasyonu**: `for-frontend.txt` dosyasında detaylı bilgi

### Temel Endpoint'ler
```javascript
// Giriş
POST /api/login
{
  "email": "admin@bosphorusfellas.com",
  "sifre": "admin123"
}

// Üyelik Başvurusu
POST /api/uyelik-basvurusu
{
  "ad": "John",
  "soyad": "Doe",
  "email": "john@example.com",
  // ... diğer alanlar
}

// Etkinlikler
GET /api/etkinlikler
Authorization: Bearer <token>
```

## 👨‍💼 Admin Paneli

### Admin Giriş Bilgileri
- **Email**: admin@bosphorusfellas.com
- **Şifre**: admin123

### Admin Özellikleri
- **Başvuru Yönetimi**: Başvuruları görüntüleme, onaylama, reddetme
- **Üye Yönetimi**: Üye listesi, durum değiştirme
- **Etkinlik Yönetimi**: Etkinlik oluşturma, düzenleme
- **İçerik Yönetimi**: Haber, sponsor içerikleri ekleme

## 📱 Kullanım Senaryoları

### Yeni Üye Başvurusu
1. `apply.html` sayfasını ziyaret edin
2. Detaylı başvuru formunu doldurun
3. Profil fotoğrafı yükleyin (isteğe bağlı)
4. Başvuruyu gönderin
5. Admin onayını bekleyin

### Üye Girişi
1. `login.html` sayfasını ziyaret edin
2. Email ve şifre ile giriş yapın
3. Dashboard'a yönlendirilir
4. Profil bilgilerini güncelleyin
5. Etkinliklere katılın

### Admin İşlemleri
1. Admin hesabı ile giriş yapın
2. Bekleyen başvuruları inceleyin
3. Başvuruları onaylayın/reddedin
4. Yeni etkinlikler oluşturun
5. İçerik yönetimi yapın

## 🎨 Tasarım Özellikleri

### Renk Paleti
- **Primary**: #667eea (Mavi)
- **Secondary**: #764ba2 (Mor)
- **Accent**: #f093fb (Pembe)
- **Success**: #4ade80 (Yeşil)
- **Warning**: #fbbf24 (Sarı)
- **Error**: #f87171 (Kırmızı)

### Tipografi
- **Headings**: Playfair Display
- **Body**: Poppins
- **Weights**: 300, 400, 500, 600, 700

### Responsive Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## 🔒 Güvenlik

### Frontend Güvenlik
- **XSS Koruması**: Input sanitization
- **CSRF Koruması**: Token validation
- **File Upload**: Dosya türü ve boyut kontrolü
- **Form Validation**: Client-side ve server-side doğrulama

### Backend Güvenlik
- **JWT Authentication**: Güvenli token sistemi
- **Rate Limiting**: API çağrı sınırlaması
- **Input Validation**: Veri doğrulama
- **File Security**: Güvenli dosya yükleme

## 📊 Performans

### Optimizasyon
- **Lazy Loading**: Görseller için gecikmiş yükleme
- **Minification**: CSS ve JS dosyaları
- **Caching**: Browser cache kullanımı
- **CDN**: Font ve ikon kütüphaneleri

### Hız Metrikleri
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **Time to Interactive**: < 3.5s

## 🐛 Bilinen Sorunlar

1. **Şifre Güncelleme**: Backend'de henüz endpoint mevcut değil
2. **Bildirim Sistemi**: Gelecek versiyonda eklenecek
3. **Real-time Updates**: WebSocket desteği planlanıyor

## 🚧 Gelecek Özellikler

- [ ] Push Notifications
- [ ] Real-time Chat
- [ ] Event Calendar
- [ ] Payment Integration
- [ ] Mobile App
- [ ] Social Media Integration

## 📞 Destek

Herhangi bir sorun yaşarsanız:
- **Email**: info@bosphorusfellas.com
- **GitHub Issues**: Proje repository'sinde issue açın
- **Documentation**: `for-frontend.txt` dosyasını inceleyin

## 📜 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için `LICENSE` dosyasını inceleyebilirsiniz.

---

**Bosphorus Fellas** - Otomobil tutkunlarının dijital buluşma noktası 🚗✨ 