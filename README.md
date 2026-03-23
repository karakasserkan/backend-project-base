# 🚀 Backend Project Base

Production-ready Express.js + MongoDB backend boilerplate. JWT authentication, RBAC, Redis cache, BullMQ queue, SendGrid email, Swagger dokümantasyonu ve CI/CD pipeline ile birlikte gelir.

---

## 📋 İçindekiler

- [🚀 Backend Project Base](#-backend-project-base)
  - [📋 İçindekiler](#-i̇çindekiler)
  - [✨ Özellikler](#-özellikler)
  - [🛠 Teknolojiler](#-teknolojiler)
  - [📦 Gereksinimler](#-gereksinimler)
  - [🚀 Kurulum](#-kurulum)
  - [⚙️ Environment Değişkenleri](#️-environment-değişkenleri)
  - [📁 Proje Yapısı](#-proje-yapısı)
  - [📡 API Endpoints](#-api-endpoints)
    - [🔓 Public Endpoints (Auth gerektirmez)](#-public-endpoints-auth-gerektirmez)
    - [🔐 Protected Endpoints (Bearer Token gerektirir)](#-protected-endpoints-bearer-token-gerektirir)
      - [Users](#users)
      - [Roles](#roles)
      - [Categories](#categories)
      - [AuditLogs](#auditlogs)
      - [Stats](#stats)
      - [Events (SSE)](#events-sse)
  - [🔑 Authentication](#-authentication)
    - [Kayıt ve Giriş](#kayıt-ve-giriş)
    - [Şifre Sıfırlama](#şifre-sıfırlama)
  - [🛡 RBAC - Rol Tabanlı Yetkilendirme](#-rbac---rol-tabanlı-yetkilendirme)
    - [Yeni Rol Oluşturma](#yeni-rol-oluşturma)
    - [Mevcut Yetkiler](#mevcut-yetkiler)
  - [🔴 Redis \& Cache](#-redis--cache)
    - [Cache Kullanımı](#cache-kullanımı)
    - [Token Blacklist](#token-blacklist)
  - [📧 Email Servisi](#-email-servisi)
    - [SendGrid Kurulumu](#sendgrid-kurulumu)
  - [📖 Swagger Dokümantasyonu](#-swagger-dokümantasyonu)
  - [🧪 Testler](#-testler)
  - [🐳 Docker ile Çalıştırma](#-docker-ile-çalıştırma)
    - [Gereksinimler](#gereksinimler)
    - [Çalıştırma](#çalıştırma)
    - [Docker Compose Servisleri](#docker-compose-servisleri)
    - [Ortam Değişkenleri (Docker)](#ortam-değişkenleri-docker)
  - [🔄 CI/CD](#-cicd)
    - [GitHub Actions Workflow](#github-actions-workflow)
  - [🏃 PM2 ile Production](#-pm2-ile-production)
  - [📝 Notlar](#-notlar)
  - [📄 Lisans](#-lisans)

---

## ✨ Özellikler

- **JWT Authentication** — Token tabanlı kimlik doğrulama, blacklist desteği
- **RBAC** — Rol ve yetki tabanlı erişim kontrolü
- **Redis Cache** — API response cache, token blacklist, rate limiting
- **BullMQ Queue** — Arka planda email gönderimi
- **SendGrid** — Şifre sıfırlama ve email doğrulama
- **Swagger UI** — Otomatik API dokümantasyonu
- **Winston Logger** — Konsol + dosya + MongoDB log kaydı
- **MongoDB Transaction** — Atomik veritabanı işlemleri (Replica Set gerektirir)
- **Joi Validation** — Environment ve request validasyonu
- **Pagination** — Tüm list endpoint'lerinde sayfalama
- **Docker** — MongoDB Replica Set ile tam container desteği
- **CI/CD** — GitHub Actions ile otomatik lint ve test
- **PM2** — Production process yönetimi

---

## 🛠 Teknolojiler

| Kategori | Teknoloji |
|---|---|
| Runtime | Node.js 20 |
| Framework | Express.js |
| Veritabanı | MongoDB + Mongoose |
| Cache | Redis (Upstash) |
| Queue | BullMQ |
| Auth | JWT + Passport.js |
| Email | SendGrid |
| Validation | Joi |
| Logging | Winston |
| Dokümantasyon | Swagger / OpenAPI 3.0 |
| Test | Jest + Supertest |
| CI/CD | GitHub Actions |
| Container | Docker + Docker Compose |

---

## 📦 Gereksinimler

- Node.js 20+
- MongoDB 7+
- Redis (veya [Upstash](https://upstash.com) ücretsiz cloud Redis)
- SendGrid hesabı (email için)

---

## 🚀 Kurulum

**1. Repoyu klonla:**
```bash
git clone https://github.com/karakasserkan/backend-project-base.git
cd backend-project-base/api
```

**2. Bağımlılıkları yükle:**
```bash
npm install
```

**3. Environment dosyasını oluştur:**
```bash
cp .env.example .env
```

**4. `.env` dosyasını düzenle** (aşağıdaki [Environment Değişkenleri](#-environment-değişkenleri) bölümüne bak)

**5. Uygulamayı başlat:**
```bash
# Development
npm run dev

# Production
npm start

# PM2 ile production
npm run pm2:start
```

---

## ⚙️ Environment Değişkenleri

`.env.example` dosyasını kopyalayıp aşağıdaki değerleri doldur:

```dotenv
NODE_ENV=development
PORT=3000

# MongoDB
CONNECTION_STRING=mongodb://127.0.0.1:27017/your-db-name

# JWT
JWT_SECRET=your-super-secret-key-min-32-characters
TOKEN_EXPIRE_TIME=86400

# Dosya yükleme
FILE_UPLOAD_PATH=/path/to/upload/folder

# Dil
DEFAULT_LANG=EN

# CORS
ALLOWED_ORIGINS=http://localhost:3000

# SendGrid
SENDGRID_API_KEY=SG.your-api-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# Uygulama URL (email linkleri için)
APP_URL=http://localhost:3000

# Upstash Redis REST API
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# Redis (BullMQ için)
REDIS_URL=rediss://default:password@your-redis.upstash.io:6379

# Versiyon (opsiyonel)
APP_VERSION=1.0.0
```

> ⚠️ `.env` dosyasını asla Git'e commit etme. `.gitignore`'da zaten tanımlı.

---

## 📁 Proje Yapısı

```
api/
├── bin/
│   └── www                     # Sunucu başlatma
├── config/
│   ├── cors.js                 # CORS yapılandırması
│   ├── helmet.js               # HTTP güvenlik başlıkları
│   ├── Enum.js                 # Sabitler (HTTP kodları, vb.)
│   ├── env.js                  # Joi ile environment validasyonu
│   ├── index.js                # Merkezi config
│   ├── role_privileges.js      # Rol yetkileri tanımları
│   └── swagger.js              # Swagger yapılandırması
├── db/
│   ├── Database.js             # MongoDB bağlantısı
│   └── models/
│       ├── AuditLogs.js
│       ├── Categories.js
│       ├── RolePrivileges.js
│       ├── Roles.js
│       ├── UserRoles.js
│       └── Users.js
├── lib/
│   ├── asyncHandler.js         # Async hata yakalayıcı
│   ├── auth.js                 # JWT + Passport stratejisi
│   ├── cache.js                # Redis cache işlemleri
│   ├── email.js                # SendGrid email servisi
│   ├── Error.js                # Custom hata sınıfı
│   ├── errorHandler.js         # Global hata handler
│   ├── Emitter.js              # Event emitter (SSE)
│   ├── Export.js               # Excel export
│   ├── i18n.js                 # Çoklu dil desteği
│   ├── Import.js               # Excel import
│   ├── paginate.js             # Pagination yardımcısı
│   ├── queue.js                # BullMQ email queue
│   ├── Response.js             # Standart API response
│   ├── logger/
│   │   ├── logger.js           # Winston logger
│   │   └── LoggerClass.js      # Logger singleton
│   └── validators/
│       ├── validate.js         # Joi middleware
│       ├── auditlogs.validator.js
│       ├── categories.validator.js
│       ├── roles.validator.js
│       ├── stats.validator.js
│       └── users.validator.js
├── routes/
│   ├── index.js                # Route yükleyici
│   ├── auditlogs.js
│   ├── categories.js
│   ├── events.js               # SSE (Server-Sent Events)
│   ├── health.js               # Health check
│   ├── roles.js
│   ├── stats.js
│   └── users.js
├── __tests__/
│   ├── auth.test.js
│   ├── categories.test.js
│   └── health.test.js
├── app.js                      # Express uygulaması
├── ecosystem.config.js         # PM2 yapılandırması
├── Dockerfile
└── docker-compose.yml
```

---

## 📡 API Endpoints

Tüm endpoint'ler `/api` prefix'i ile başlar.

### 🔓 Public Endpoints (Auth gerektirmez)

| Method | Endpoint | Açıklama |
|---|---|---|
| GET | `/health` | Sistem ve DB durumu |
| POST | `/users/register` | İlk admin kaydı (tek seferlik) |
| POST | `/users/auth` | Giriş yap, JWT token al |
| POST | `/users/logout` | Çıkış yap, token blacklist'e ekle |
| POST | `/users/forgot-password` | Şifre sıfırlama maili gönder |
| POST | `/users/reset-password` | Yeni şifre belirle |
| POST | `/users/verify-email` | Email doğrula |
| POST | `/users/resend-verification` | Doğrulama mailini tekrar gönder |

### 🔐 Protected Endpoints (Bearer Token gerektirir)

#### Users
| Method | Endpoint | Yetki | Açıklama |
|---|---|---|---|
| GET | `/users` | `user_view` | Kullanıcı listesi |
| POST | `/users/add` | `user_add` | Kullanıcı ekle |
| POST | `/users/update` | `user_update` | Kullanıcı güncelle |
| DELETE | `/users/delete` | `user_delete` | Kullanıcı sil |

#### Roles
| Method | Endpoint | Yetki | Açıklama |
|---|---|---|---|
| GET | `/roles` | `role_view` | Rol listesi |
| POST | `/roles/add` | `role_add` | Rol ekle |
| POST | `/roles/update` | `role_update` | Rol güncelle |
| DELETE | `/roles/delete` | `role_delete` | Rol sil |
| GET | `/roles/role_privileges` | `role_view` | Tüm yetkiler |

#### Categories
| Method | Endpoint | Yetki | Açıklama |
|---|---|---|---|
| GET | `/categories` | `category_view` | Kategori listesi |
| POST | `/categories/add` | `category_add` | Kategori ekle |
| POST | `/categories/update` | `category_update` | Kategori güncelle |
| DELETE | `/categories/delete` | `category_delete` | Kategori sil |
| GET | `/categories/export` | `category_export` | Excel indir |
| POST | `/categories/import` | `category_import` | Excel'den içe aktar |

#### AuditLogs
| Method | Endpoint | Yetki | Açıklama |
|---|---|---|---|
| POST | `/auditlogs` | `auditlogs_view` | Log kayıtlarını filtrele |

#### Stats
| Method | Endpoint | Yetki | Açıklama |
|---|---|---|---|
| GET | `/stats/auditlogs` | `auditlogs_view` | İşlem istatistikleri |
| GET | `/stats/categories/unique` | `category_view` | Tekil kategori sayısı |
| GET | `/stats/users/count` | `user_view` | Kullanıcı sayısı |

#### Events (SSE)
| Method | Endpoint | Açıklama |
|---|---|---|
| GET | `/events` | Gerçek zamanlı bildirim stream'i |

---

## 🔑 Authentication

### Kayıt ve Giriş

**1. İlk admin kaydı** (sistem kurulumunda bir kez):
```bash
POST /api/users/register
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "Sifre1234",
  "first_name": "Admin",
  "last_name": "User"
}
```

**2. Giriş:**
```bash
POST /api/users/auth
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "Sifre1234"
}
```

Yanıtta dönen `token` değerini sonraki isteklerde kullan:
```
Authorization: Bearer <token>
```

**3. Çıkış:**
```bash
POST /api/users/logout
Authorization: Bearer <token>
```

### Şifre Sıfırlama

```bash
# 1. Reset maili gönder
POST /api/users/forgot-password
{ "email": "admin@example.com" }

# 2. Maildeki token ile şifre sıfırla
POST /api/users/reset-password
{ "token": "...", "password": "YeniSifre1234" }
```

---

## 🛡 RBAC - Rol Tabanlı Yetkilendirme

İlk kayıt sırasında otomatik olarak `SUPER_ADMIN` rolü oluşturulur ve tüm yetkiler atanır.

### Yeni Rol Oluşturma

```bash
POST /api/roles/add
Authorization: Bearer <token>

{
  "role_name": "EDITOR",
  "permissions": ["category_view", "category_add", "category_update"]
}
```

### Mevcut Yetkiler

`GET /api/roles/role_privileges` endpoint'i tüm yetki listesini döner.

Örnek yetkiler: `user_view`, `user_add`, `user_update`, `user_delete`, `role_view`, `role_add`, `category_view`, `category_add`, `auditlogs_view`, ...

---

## 🔴 Redis & Cache

### Cache Kullanımı

Categories list endpoint'i otomatik olarak cache kullanır:

```
GET /api/categories?page=1&limit=20
# İlk istek: DB'den gelir, cache'e yazılır
# Sonraki istekler: Cache'den gelir (5 dakika TTL)
```

Cache, `add`, `update`, `delete` işlemlerinde otomatik temizlenir.

### Token Blacklist

Logout işleminde token Redis'e blacklist olarak eklenir. Token süresi dolana kadar geçersiz sayılır.

---

## 📧 Email Servisi

Email gönderimi BullMQ queue üzerinden arka planda çalışır, kullanıcı beklemez.

### SendGrid Kurulumu

1. [SendGrid](https://sendgrid.com) hesabı oluştur
2. API key al
3. **Single Sender Verification** ile bir email adresi doğrula
4. `.env` dosyasını güncelle:
   ```
   SENDGRID_API_KEY=SG.your-key
   SENDGRID_FROM_EMAIL=verified@email.com
   ```

---

## 📖 Swagger Dokümantasyonu

Uygulama çalışırken şu adresten API dokümantasyonuna erişebilirsin:

```
http://localhost:3000/api/docs
```

Swagger UI üzerinden endpoint'leri test etmek için:
1. `/api/users/auth` ile giriş yap, token al
2. Sağ üstteki **Authorize** butonuna tıkla
3. `Bearer <token>` formatında token gir
4. Artık tüm protected endpoint'leri test edebilirsin

---

## 🧪 Testler

```bash
# Tüm testleri çalıştır
npm test

# Lint kontrolü
npm run lint
```

Test dosyaları `__tests__/` klasöründe:
- `health.test.js` — Health check endpoint testi
- `auth.test.js` — Register, login, logout testleri
- `categories.test.js` — CRUD işlem testleri

> ⚠️ Testler çalışmadan önce MongoDB bağlantısının hazır olması gerekir.

---

## 🐳 Docker ile Çalıştırma

Docker, MongoDB Replica Set (transaction desteği için gerekli) ile birlikte çalıştırır.

### Gereksinimler
- Docker Desktop
- BIOS'ta sanallaştırma (Virtualization) aktif olmalı

### Çalıştırma

```bash
# Container'ları başlat
docker-compose up -d

# Logları izle
docker-compose logs -f app

# Durdur
docker-compose down
```

### Docker Compose Servisleri

| Servis | Açıklama |
|---|---|
| `app` | Node.js uygulaması (port 3000) |
| `mongo1` | MongoDB Replica Set primary |
| `mongo2` | MongoDB Replica Set secondary |
| `mongo3` | MongoDB Replica Set secondary |
| `mongo-init` | Replica Set başlatıcı |

> **Not:** Docker ile çalıştırırken MongoDB transaction'ları aktif olur. `users.js`'deki `TODO` yorumlarını kaldırarak transaction'ları aktif edebilirsin.

### Ortam Değişkenleri (Docker)

`docker-compose.yml` dosyasındaki `admin:password` değerlerini production'da değiştir. Hassas değerleri `.env` üzerinden geç:

```yaml
environment:
  JWT_SECRET: ${JWT_SECRET}
```

---

## 🔄 CI/CD

Her `push` ve `pull_request` işleminde otomatik olarak çalışır:

1. **Lint** — ESLint ile kod kalitesi kontrolü
2. **Test** — Jest ile otomatik testler (MongoDB + Redis servisleri ile)
3. **Docker Build** — Image build testi

### GitHub Actions Workflow

`.github/workflows/ci.yml` dosyasında tanımlı. Branch'ler:
- `main` — Production branch
- `develop` — Geliştirme branch'i

---

## 🏃 PM2 ile Production

```bash
# Uygulamayı başlat
npm run pm2:start

# Durdur
npm run pm2:stop

# Yeniden başlat
npm run pm2:restart

# Logları izle
npm run pm2:logs
```

---

## 📝 Notlar

- **İlk Kayıt:** Sistem tamamen boşken yalnızca bir kez `register` endpoint'i çalışır. Sonraki kullanıcılar admin tarafından `/users/add` ile eklenir.
- **Dil Desteği:** `Accept-Language: TR` veya `EN` header'ı ile dil seçimi yapılır. Default: `EN`.
- **Pagination:** Tüm list endpoint'leri `?page=1&limit=20` query parametrelerini destekler.
- **MongoDB Transaction:** Docker + Replica Set kurulumu gerektirir. Development'ta transaction'lar yorum satırında bırakılmıştır.

---

## 📄 Lisans

MIT