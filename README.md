# 🎓 Rohit Academy — Production EdTech PDF Platform

A full-stack, production-ready PDF selling platform with batch-wise purchasing, Razorpay payments, Firebase auth, and a comprehensive admin panel.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Tailwind CSS, Vite |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose) |
| Auth | Firebase Auth + JWT |
| Payments | Razorpay |
| Storage | Cloudinary |
| Deployment | Vercel (client) + Render (server) |

---

## 📁 Project Structure

```
rohit-academy/
├── client/          # React frontend (Vite)
│   ├── src/
│   │   ├── admin/       # Admin panel pages
│   │   ├── components/  # Reusable components
│   │   ├── context/     # Auth, Cart contexts
│   │   ├── pages/       # User-facing pages
│   │   ├── routes/      # AppRoutes.jsx
│   │   └── services/    # API client (axios)
│   └── .env.example
└── server/          # Express backend
    ├── config/      # DB, Cloudinary, Firebase, Razorpay
    ├── controllers/ # Business logic
    ├── middleware/  # Auth, Admin, Rate-limit
    ├── models/      # Mongoose schemas
    ├── routes/      # API routes
    └── .env.example
```

---

## ⚙️ Setup

### 1. Server
```bash
cd server
cp .env.example .env      # Fill in your values
npm install
npm run dev               # Development
npm start                 # Production
```

### 2. Client
```bash
cd client
cp .env.example .env      # Fill in your values
npm install
npm run dev               # Development
npm run build             # Production build
```

---

## 🔑 Environment Variables

### Server (`server/.env`)
| Variable | Description |
|----------|-------------|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for JWT tokens (min 32 chars) |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase Admin SDK JSON (stringified) |
| `RAZORPAY_KEY_ID` | Razorpay live/test key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay key secret |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook secret |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `FRONTEND_URL` | Your frontend URL (for password reset links) |

### Client (`client/.env`)
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API URL |
| `VITE_RAZORPAY_KEY` | Razorpay public key |
| `VITE_FIREBASE_*` | Firebase web app config |

---

## 👤 Create Admin User

Connect to MongoDB and run:
```js
db.users.insertOne({
  name: "Admin",
  email: "admin@rohitacademy.net",
  password: "<bcrypt hash of your password>",
  role: "admin",
  authProvider: "email",
  isVerified: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```
Or use the admin login with `ADMIN_EMAIL`/`ADMIN_PASSWORD` env vars (legacy fallback).

---

## 📦 Key Features

- **Batch-wise selling** — Buy Class 11 PCM → Unlock Physics, Chemistry, Maths PDFs
- **Stream filtering** — Class 11/12 support PCM, PCB (Bio), Arts
- **Razorpay payments** — Secure order creation + signature verification + webhook
- **Firebase Auth** — Google login + Email/Password + Forgot/Reset password
- **Cloudinary** — PDF and image storage
- **Admin panel** — Full CRUD for Classes, Streams, Subjects, Batches, Materials, Users, Orders
- **Mobile responsive** — Bottom tab navigation on mobile
- **SEO ready** — Meta tags, Open Graph, canonical URLs

---

## 🌐 Deployment

### Client → Vercel
1. Push `client/` to a GitHub repo
2. Import to Vercel, set root to `client/`
3. Add env vars in Vercel dashboard

### Server → Render
1. Push `server/` to a GitHub repo
2. New Web Service on Render
3. Build: `npm install`, Start: `npm start`
4. Add all env vars in Render dashboard

---

## 🔐 Security

- JWT authentication on all protected routes
- Admin role middleware on all admin routes  
- Razorpay HMAC signature verification on payments
- Rate limiting (200 req/15min global, 50 req/15min admin)
- Helmet.js security headers
- CORS whitelist

---

## 📞 Support

For issues with setup, contact support@rohitacademy.net
