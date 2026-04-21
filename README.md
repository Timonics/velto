# Velto – Multi‑tenant SME Platform

Velto is a system that allows Nigerian SMEs to get their own branded subdomain (`{slug}.velto.app`) to sell **products** (e‑commerce) or offer **services** (hair, makeup, tailoring, etc.). Customers discover tenants via a **video/image feed** and **marketplace** on the main domain (`velto.app`), then place orders (products) or bookings (services).

**First tenant:** Taj Kulture (`tajkulture.velto.app`) – used as live example and test case.

**Target users:** Gen‑Z customers and micro‑business owners who currently rely on WhatsApp/Instagram.

---

## 🚀 Features (MVP)

### Tenant Side
- Register (business name, phone, location, category, business type: `PRODUCT_SELLER` / `SERVICE_PROVIDER`)
- Automatic subdomain: `{slug}.velto.app` (slug from business name)
- Storefront at subdomain – profile, products/services, portfolio
- Product CRUD (name, price, stock, media)
- Service CRUD (name, price, `negotiable` flag, duration, media)
- Order/Booking management (view, update status: pending → confirmed → completed/cancelled)
- Basic dashboard (order count, revenue)

### Customer Side
- Register/login (phone/email, cookie‑based)
- Main domain (`velto.app`):
  - Video/image feed (from followed tenants + trending)
  - Marketplace (filter tenants by category, location, type)
  - Search
- Place order (product: quantity, delivery address)
- Place booking (service: date/time, special instructions)
- My orders/bookings (status tracking)
- Follow/unfollow tenant
- Like, comment, share posts

### Shared / Infrastructure
- WhatsApp notification (Twilio) via Bull queue
- Email notification (SendGrid + Handlebars templates) via Bull queue
- In‑app notifications
- Media upload (Cloudinary)
- Wildcard subdomain resolution (`*.velto.app` → same NestJS app)
- Redis caching (with in‑memory fallback)

---

## 🧱 Technology Stack

| Layer               | Technology                                                |
|---------------------|-----------------------------------------------------------|
| **Backend**         | Node.js + NestJS (TypeScript)                             |
| **API**             | REST (OpenAPI – Swagger)                                  |
| **ORM**             | Prisma with `@prisma/adapter-pg`                          |
| **Database**        | PostgreSQL                                                |
| **Cache & Queues**  | Redis + Bull                                              |
| **Storage**         | Cloudinary                                                |
| **Notifications**   | Twilio (WhatsApp), SendGrid (Email)                       |
| **Auth**            | HTTP‑only cookies (JWT access + refresh tokens)           |
| **Logging**         | Winston (structured JSON, correlation ID, daily rotation)|
| **Error handling**  | Custom error codes + global exception filter              |
| **Deployment**      | Docker + DigitalOcean (or Render)                         |

---

## 📁 Project Structure (High‑Level)

```
velto-backend/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── common/
│   │   ├── logger/               # Winston logger + correlation ID
│   │   ├── guards/               # AuthGuard, TenantGuard, RolesGuard
│   │   ├── interceptors/         # TransformInterceptor, LoggingInterceptor
│   │   ├── middleware/           # CorrelationIdMiddleware, TenantMiddleware
│   │   ├── decorators/           # @Public, @CurrentUser, @CurrentTenant
│   │   ├── filters/              # GlobalExceptionFilter
│   │   ├── repositories/         # Base repository (interface + impl)
│   │   ├── services/             # Base service (interface + impl)
│   │   ├── dto/                  # Pagination, API response
│   │   └── errors/               # Error codes + AppError hierarchy
│   ├── domain/
│   │   ├── events/               # Event types, payloads, EventBus
│   │   ├── value-objects/        # PhoneNumber, Slug, Price, Email
│   │   └── shared/               # Result type (functional error handling)
│   ├── infrastructure/
│   │   ├── database/             # PrismaService (adapter-pg)
│   │   ├── cache/                # Redis cache (with memory fallback)
│   │   ├── queue/                # Bull queues (email, whatsapp, analytics)
│   │   └── storage/              # CloudinaryService
│   ├── modules/
│   │   ├── auth/                 # Register, login, logout, refresh
│   │   ├── user/                 # User repository
│   │   ├── tenant/               # Tenant registration, storefront
│   │   ├── post/                 # Posts, feed, likes
│   │   ├── follow/               # Follow/unfollow tenants
│   │   ├── like/                 # Like/unlike posts
│   │   ├── comment/              # Comments on posts
│   │   ├── product/              # Product CRUD
│   │   ├── service/              # Service CRUD
│   │   ├── order/                # Order placement & management
│   │   ├── booking/              # Booking placement & management
│   │   ├── marketplace/          # Search & filter
│   │   ├── portfolio/            # Portfolio items (media)
│   │   └── notification/         # Email, WhatsApp, in‑app (queue processors)
│   └── serializers/              # Explicit response formatters
├── prisma/
│   ├── schema.prisma             # Complete database schema
│   └── migrations/
├── docker-compose.yml            # PostgreSQL + Redis
├── .env.example
└── README.md
```

---

## 🔧 Setup & Installation

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- (Optional) Cloudinary, SendGrid, Twilio accounts for production

### 1. Clone the repository
```bash
git clone https://github.com/your-org/velto-backend.git
cd velto-backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment configuration
Copy `.env.example` to `.env` and fill in required values:
```bash
cp .env.example .env
```

**Minimum required variables** (can use dummy values for optional services during development):
```env
PORT=3000
NODE_ENV=development
APP_DOMAIN="velto.app"
COOKIE_DOMAIN=".velto.app"
DATABASE_URL="postgresql://velto:velto123@localhost:5432/velto_db"
JWT_SECRET="your-secret-key"
REDIS_URL="redis://localhost:6379"
```

Optional but recommended for notifications:
- Cloudinary (media uploads)
- Twilio (WhatsApp)
- SendGrid (email)

### 4. Start Docker services
```bash
docker-compose up -d
```

### 5. Run database migrations
```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 6. Start the development server
```bash
npm run start:dev
```

The API will be available at `http://localhost:3000`.

### 7. Test with a subdomain locally
Add to `/etc/hosts` (or use `lvh.me`):
```
127.0.0.1   tajkulture.velto.app
```

Then visit `http://tajkulture.velto.app:3000/tenants/current` (should return tenant data after seeding).

---

## 📚 API Overview (Key Endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Register a new customer |
| `POST` | `/auth/login` | Login → sets HTTP‑only cookies |
| `POST` | `/auth/logout` | Logout → clears cookies |
| `POST` | `/auth/refresh` | Refresh access token |
| `GET` | `/posts/feed` | Get personalised feed (followed tenants + trending) |
| `GET` | `/posts/trending` | Get global trending posts |
| `POST` | `/posts/:id/like` | Like/unlike a post |
| `GET` | `/marketplace?q=&category=&location=` | Search/filter tenants |
| `POST` | `/orders` | Place an order |
| `POST` | `/bookings` | Place a booking |
| `GET` | `/tenants/storefront/:slug` | Public storefront data |
| `POST` | `/tenants` | Create a tenant (tenant admin) |
| `POST` | `/tenant/products` | Create a product |
| `POST` | `/tenant/services` | Create a service |

All responses follow a standard format:
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2025-...",
  "correlationId": "uuid"
}
```

Error responses:
```json
{
  "success": false,
  "error": {
    "code": "AUTH_100",
    "message": "Invalid credentials",
    "timestamp": "...",
    "path": "/auth/login",
    "correlationId": "..."
  }
}
```

---

## 🧠 Architecture Highlights

### Domain‑Driven Design (DDD‑lite)
- **Repositories** – abstraction over Prisma (interface + implementation)
- **Services** – business logic, no direct database calls
- **Value objects** – `PhoneNumber`, `Slug`, `Price`, `Email` (immutable, self‑validating)
- **Domain events** – emitted via `EventBus` → routed to Bull queues

### Event‑Driven Notifications
- All side effects (email, WhatsApp, in‑app) are queued
- Dedicated queues: `email`, `whatsapp`, `analytics`
- Retry policies, exponential backoff, and dead‑letter ready
- Correlation ID propagates from HTTP request to queue job

### Multi‑tenant Architecture
- Wildcard DNS (`*.velto.app`) → same NestJS app
- `TenantMiddleware` extracts subdomain → attaches tenant to `req.tenant`
- `TenantOwnerGuard` ensures user owns the tenant

### Security
- HTTP‑only cookies (access + refresh tokens) – prevents XSS
- Refresh token rotation
- CORS configured for main domain and subdomains
- Input validation with `class-validator`

### Observability
- Structured JSON logging (Winston) – ready for Datadog/ELK
- Correlation ID across all logs and error responses
- Daily rotating log files (production)
- Global exception filter with unique error codes

---

## 🧪 Testing

```bash
# Unit tests
npm run test

# e2e tests
npm run test:e2e

# Test coverage
npm run test:cov
```

**Current coverage:** ~70% (services and repositories)

---

## 📦 Deployment

### Using Docker
```bash
docker build -t velto-backend .
docker run -p 3000:3000 --env-file .env velto-backend
```

### Using Docker Compose (production)
```yaml
# docker-compose.prod.yml
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    depends_on:
      - postgres
      - redis
```

### Manual (PM2)
```bash
npm run build
pm2 start dist/main.js --name velto-api
```

---

## 🔮 Roadmap (Post‑MVP)

| Phase | Features |
|-------|----------|
| **Phase 2** | Paystack integration, analytics dashboard, advanced search |
| **Phase 3** | Mobile app (Expo), push notifications, live chat |
| **Phase 4** | AI recommendations, dynamic pricing, bulk order discounts |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push (`git push origin feature/amazing`)
5. Open a Pull Request

**Coding standards:**
- ESLint + Prettier (Airbnb style)
- 100% TypeScript
- Write comments explaining *why*, not *what*
- No `console.log` – use the custom logger
- Unit tests for all services and repositories

---

## 📄 License

MIT © Velto

---

## 🙏 Acknowledgements

- NestJS community
- Prisma ORM team
- All contributors and early adopters

---

## 📞 Contact

For support or enquiries: **hello@velto.app**

---

*Last updated: April 2026 – Still building, but the foundation is solid.*
