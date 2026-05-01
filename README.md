# 🎓 Rohit Academy — Production v3

## 🛠 Tech Stack
- **Frontend:** React (Vite) + Tailwind CSS → Deploy on Vercel
- **Backend:** Node.js + Express.js → Deploy on Render / Railway
- **Database:** MongoDB Atlas
- **Auth:** Firebase (Google + Phone OTP) + Email/Password (JWT)
- **Payment:** Razorpay (HMAC verified — real payment)
- **Storage:** Cloudinary (PDFs — signed URLs, 1hr expiry)
- **Email:** Nodemailer (SMTP — password reset + purchase confirmation)

---

## 🚀 Setup

### Server (`/server`)

```bash
cd server
npm install
cp .env.example .env
# Fill in your .env values
npm start
```

### Client (`/client`)

```bash
cd client
npm install
cp .env.example .env
# Fill in your .env values
npm run build
```

---

## ⚙️ Environment Variables

### Server `.env`
| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | ✅ | MongoDB Atlas connection string |
| `JWT_SECRET` | ✅ | Min 32 chars, random string |
| `FIREBASE_SERVICE_ACCOUNT` | ✅ | Stringified service account JSON |
| `RAZORPAY_KEY_ID` | ✅ | Razorpay Key ID |
| `RAZORPAY_KEY_SECRET` | ✅ | Razorpay Key Secret |
| `RAZORPAY_WEBHOOK_SECRET` | ✅ | Set in Razorpay Dashboard → Webhooks |
| `CLOUDINARY_CLOUD_NAME` | ✅ | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | ✅ | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | ✅ | Cloudinary API secret |
| `FRONTEND_URL` | ✅ | Your frontend URL (for password reset email links) |
| `SMTP_HOST` | ✅ | SMTP host (e.g. smtp.gmail.com) |
| `SMTP_PORT` | ✅ | 587 (TLS) or 465 (SSL) |
| `SMTP_SECURE` | ✅ | false for port 587, true for 465 |
| `SMTP_USER` | ✅ | Your email address |
| `SMTP_PASS` | ✅ | Gmail App Password (not your login password) |
| `SMTP_FROM` | ✅ | Sender email |
| `SMTP_FROM_NAME` | ⬜ | Sender name (default: Rohit Academy) |

### Client `.env`
| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | ✅ | Backend URL (e.g. https://your-app.onrender.com/api) |
| `VITE_RAZORPAY_KEY` | ✅ | Razorpay Key ID (public) |
| `VITE_FIREBASE_*` | ✅ | All Firebase web config values |

---

## 📧 Gmail SMTP Setup
1. Google Account → Security → Enable 2-Step Verification
2. Search "App Passwords" → Generate one for "Mail"
3. Use that 16-char password as `SMTP_PASS`

---

## 💳 Razorpay Webhook Setup
1. Razorpay Dashboard → Settings → Webhooks → Add New
2. URL: `https://your-backend.onrender.com/api/payment/webhook`
3. Events: `payment.captured`
4. Copy the Webhook Secret → paste in `RAZORPAY_WEBHOOK_SECRET`

---

## 🔐 Security Fixes in v3
- ✅ Real email sent on password reset (nodemailer)
- ✅ Purchase confirmation email sent after payment
- ✅ Razorpay webhook properly registered before JSON parser (was intercepted by dummy handler in v2)
- ✅ Webhook requires `RAZORPAY_WEBHOOK_SECRET` — logs error if missing
- ✅ Cloudinary PDF URLs are signed (1-hour expiry) — direct URL access blocked
- ✅ Auth rate limiter applied to `/login`, `/register`, `/firebase-login`, `/forgot-password`
