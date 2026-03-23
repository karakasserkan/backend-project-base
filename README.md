# 🚀 Backend Project Base

![CI](https://github.com/karakasserkan/backend-project-base/actions/workflows/ci.yml/badge.svg)
![Node](https://img.shields.io/badge/node-20-green)
![License](https://img.shields.io/badge/license-MIT-blue)

**Version:** v1.0.0

Production-ready Express.js + MongoDB backend boilerplate. JWT authentication, RBAC, Redis cache, BullMQ queue, SendGrid email, Swagger dokümantasyonu ve CI/CD pipeline ile birlikte gelir.

---

## ⚡ Quick Start

```bash
git clone https://github.com/karakasserkan/backend-project-base.git
cd backend-project-base/api

cp .env.example .env

npm install
npm run dev
```

➡️ API Docs: http://localhost:3000/api/docs

---

## 🎯 Why this boilerplate?

This project provides a production-ready backend architecture with:

* Clean and scalable folder structure
* Built-in authentication & authorization
* Async job processing (BullMQ)
* Redis-based caching layer
* Dockerized environment
* CI/CD pipeline

👉 Focus on building features instead of reinventing the backend.

---

## 🏗 Architecture

```
Client → API → Redis → MongoDB
                ↓
              BullMQ → Worker → Email
```

---

## 📋 İçindekiler

- [🚀 Backend Project Base](#-backend-project-base)
  - [⚡ Quick Start](#-quick-start)
  - [🎯 Why this boilerplate?](#-why-this-boilerplate)
  - [🏗 Architecture](#-architecture)
  - [📋 İçindekiler](#-i̇çindekiler)
  - [✨ Özellikler](#-özellikler)
  - [🛠 Teknolojiler](#-teknolojiler)
  - [📦 Gereksinimler](#-gereksinimler)
  - [🚀 Kurulum](#-kurulum)
  - [⚙️ Environment Değişkenleri](#️-environment-değişkenleri)
  - [📁 Proje Yapısı](#-proje-yapısı)
  - [📡 API Endpoints](#-api-endpoints)
  - [🔑 Authentication](#-authentication)
  - [🛡 RBAC - Rol Tabanlı Yetkilendirme](#-rbac---rol-tabanlı-yetkilendirme)
  - [🔴 Redis \& Cache](#-redis--cache)
  - [📧 Email Servisi](#-email-servisi)
  - [📖 Swagger Dokümantasyonu](#-swagger-dokümantasyonu)
  - [🧪 Testler](#-testler)
  - [🐳 Docker ile Çalıştırma](#-docker-ile-çalıştırma)
  - [🔄 CI/CD](#-cicd)
  - [🏃 PM2 ile Production](#-pm2-ile-production)
  - [🤝 Contributing](#-contributing)
  - [⭐ Support](#-support)
  - [📄 Lisans](#-lisans)

---

## ✨ Özellikler

* JWT Authentication (blacklist destekli)
* RBAC (rol & yetki sistemi)
* Redis cache (API cache, token blacklist, rate limiting)
* BullMQ queue (email işlemleri)
* SendGrid email servisi
* Swagger API dokümantasyonu
* Winston logging (console + file + DB)
* MongoDB transaction (Replica Set)
* Joi validation (env + request)
* Pagination
* Docker + MongoDB Replica Set
* CI/CD (GitHub Actions)
* PM2 process yönetimi

---

## 🛠 Teknolojiler

| Kategori   | Teknoloji          |
| ---------- | ------------------ |
| Runtime    | Node.js 20         |
| Framework  | Express.js         |
| DB         | MongoDB + Mongoose |
| Cache      | Redis (Upstash)    |
| Queue      | BullMQ             |
| Auth       | JWT + Passport     |
| Email      | SendGrid           |
| Validation | Joi                |
| Logging    | Winston            |
| Docs       | Swagger            |
| Test       | Jest + Supertest   |
| CI/CD      | GitHub Actions     |
| Container  | Docker             |

---

## 📦 Gereksinimler

* Node.js 20+
* MongoDB 7+
* Redis / Upstash
* SendGrid hesabı

---

## 🚀 Kurulum

```bash
git clone https://github.com/karakasserkan/backend-project-base.git
cd backend-project-base/api

npm install
cp .env.example .env
npm run dev
```

---

## ⚙️ Environment Değişkenleri

```env
NODE_ENV=development
PORT=3000

CONNECTION_STRING=mongodb://127.0.0.1:27017/your-db

JWT_SECRET=your-secret-key
TOKEN_EXPIRE_TIME=86400

FILE_UPLOAD_PATH=./uploads

DEFAULT_LANG=EN
ALLOWED_ORIGINS=http://localhost:3000

SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=

APP_URL=http://localhost:3000

UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

REDIS_URL=redis://localhost:6379

APP_VERSION=1.0.0
```

---

## 📁 Proje Yapısı

```
api/
├── config/          # Env, CORS, Helmet, Swagger, Enum
├── db/              # MongoDB bağlantısı ve modeller
├── lib/             # Auth, cache, queue, logger, validators
├── routes/          # API endpoint'leri
├── __tests__/       # Jest testleri
├── app.js
├── ecosystem.config.js
├── Dockerfile
└── docker-compose.yml
```

---

## 📡 API Endpoints

➡️ Detaylı kullanım için Swagger kullan:

```
http://localhost:3000/api/docs
```

---

## 🔑 Authentication

* Register (ilk admin)
* Login → JWT
* Logout → blacklist
* Password reset
* Email verification

---

## 🛡 RBAC - Rol Tabanlı Yetkilendirme

* SUPER_ADMIN otomatik oluşur
* Rol bazlı permission sistemi
* Dinamik yetki yönetimi

---

## 🔴 Redis & Cache

* API response cache
* Token blacklist
* Rate limiting

---

## 📧 Email Servisi

* SendGrid ile çalışır
* BullMQ queue üzerinden async gönderim

---

## 📖 Swagger Dokümantasyonu

```
http://localhost:3000/api/docs
```

---

## 🧪 Testler

```bash
npm test
npm run lint
```

> ⚠️ MongoDB ve Redis servisleri çalışıyor olmalıdır.

---

## 🐳 Docker ile Çalıştırma

```bash
docker-compose up -d
```

```bash
docker-compose logs -f app
```

```bash
docker-compose down
```

> ⚠️ Production ortamında:
>
> * MongoDB credentials değiştirilmeli
> * JWT_SECRET güçlü olmalı
> * .env korunmalı

---

## 🔄 CI/CD

* Lint
* Test (Mongo + Redis ile)
* Docker build

GitHub Actions ile otomatik çalışır.

---

## 🏃 PM2 ile Production

```bash
npm run pm2:start
npm run pm2:stop
npm run pm2:restart
npm run pm2:logs
```

---

## 🤝 Contributing

Pull request'ler açıktır. Büyük değişiklikler için önce issue açılması önerilir.

---

## ⭐ Support

Projeyi beğendiysen ⭐ vermeyi unutma!

---

## 📄 Lisans

MIT
