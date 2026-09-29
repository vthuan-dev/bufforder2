# 🎯 Greeting Message Platform

> Full-stack e-commerce platform với VIP system và commission-based rewards

[![MySQL](https://img.shields.io/badge/MySQL-8.0-blue.svg)](https://www.mysql.com/)
[![Prisma](https://img.shields.io/badge/Prisma-7.2.0-2D3748.svg)](https://www.prisma.io/)
[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)

## 📋 Tổng Quan

**Greeting Message Platform** là một nền tảng thương mại điện tử cho phép users:
- 📦 Nhận và xử lý orders hàng ngày
- 💰 Kiếm commission dựa trên VIP level
- 🎖️ Nâng cấp VIP qua việc nạp tiền
- 💬 Chat support real-time với admin
- 📊 Theo dõi earnings và transactions

## ✨ Features

### 👥 User Features
- ✅ Authentication với invite code
- ✅ VIP system (10 levels: VIP 0 → Royal VIP)
- ✅ Order management với commission tracking
- ✅ Wallet system (deposit/withdrawal)
- ✅ Bank card management
- ✅ Shipping address management
- ✅ Real-time chat support
- ✅ Transaction history
- ✅ Sound notifications

### 🎛️ Admin Features
- ✅ Dashboard với statistics
- ✅ User management
- ✅ Order management
- ✅ Deposit/Withdrawal approval
- ✅ Chat support management
- ✅ Real-time notifications
- ✅ User presence tracking

## 🚀 Tech Stack

### Backend
- **Runtime**: Node.js + Express.js
- **Database**: MySQL 8.0
- **ORM**: Prisma 7.2.0
- **Auth**: JWT + bcryptjs
- **Real-time**: Socket.IO
- **File Upload**: Multer

### Frontend
- **Framework**: React 18 + TypeScript
- **Build**: Vite 6.3.5
- **Styling**: Tailwind CSS
- **UI**: Radix UI
- **Charts**: Recharts
- **Real-time**: Socket.IO Client

## 📦 Quick Start

### Prerequisites
- Node.js 16+
- MySQL 8.0+
- npm or yarn

### Installation

```bash
# Clone repository
git clone <repository-url>
cd greeting-message

# Install dependencies
npm install
cd backend && npm install
cd ../frontend && npm install

# Setup database
mysql -u root -p
CREATE DATABASE greeting_message;

# Configure backend
cd backend
cp .env.example .env
# Edit .env and update DATABASE_URL

# Run migrations
npx prisma generate
npx prisma migrate dev

# Create admin account
node create-admin.js

# Start backend
npm run dev

# Start frontend (in another terminal)
cd frontend
npm run dev
```

Xem chi tiết trong [QUICK_START.md](QUICK_START.md)

## 🔧 Configuration

### Backend (.env)
```env
DATABASE_URL="mysql://user:password@localhost:3306/greeting_message"
JWT_SECRET="your_jwt_secret_key"
PORT=5000
FRONTEND_URL="http://localhost:3000"
```

### Default Credentials

**Admin:**
- Username: `admin`
- Password: `admin123`

**Invite Codes:**
- Main: `OVERSTOCK2026`
- Others: `570318`, `942615`, `803247`, etc.

## 📚 Documentation

- 📖 [Quick Start Guide](QUICK_START.md) - Setup và chạy dự án
- 🔄 [Migration Guide](MIGRATION_TO_MYSQL.md) - Chi tiết migration từ MongoDB
- 📊 [Project Summary](PROJECT_SUMMARY.md) - Tổng quan dự án
- 🎯 [Admin API Structure](ADMIN_API_STRUCTURE.md) - API documentation
- 📝 [Changelog](CHANGELOG.md) - Lịch sử thay đổi
- 🔧 [Backend README](backend/README.md) - Backend documentation

## 🗄️ Database Schema

Dự án sử dụng **MySQL với Prisma ORM**. Schema được định nghĩa trong `backend/prisma/schema.prisma`.

**Main Tables:**
- `User` - User accounts & wallet
- `Order` - Orders & commission
- `Admin` - Admin accounts
- `ChatThread` - Chat conversations
- `ChatMessage` - Chat messages
- `DepositRequest` - Deposit requests
- `WithdrawalRequest` - Withdrawal requests
- `Address` - Shipping addresses
- `BankCard` - Bank cards

### Prisma Commands

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Open Prisma Studio (GUI)
npx prisma studio

# Reset database
npx prisma migrate reset
```

## 🧪 Testing

```bash
# Verify MySQL setup
node verify-mysql-only.js

# Test admin endpoints
node test-all-admin-endpoints.js

# Test dashboard APIs
node test-dashboard-apis.js

# Test orders integration
node test-orders-integration.js
```

## 📡 API Endpoints

### User APIs
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `GET /api/orders/stats` - Order statistics
- `POST /api/orders/take` - Take new order
- `POST /api/vip/deposit` - Request deposit
- `POST /api/vip/withdrawal` - Request withdrawal

### Admin APIs
- `POST /api/admin/login` - Admin login
- `GET /api/admin/dashboard/stats` - Dashboard stats
- `GET /api/admin/users` - List users
- `GET /api/admin/orders` - List orders
- `GET /api/admin/deposit-requests` - List deposits
- `GET /api/admin/withdrawal-requests` - List withdrawals

Xem chi tiết trong [ADMIN_API_STRUCTURE.md](ADMIN_API_STRUCTURE.md)

## 🎯 VIP Levels

| Level | Deposit | Commission/Order | Daily Target |
|-------|---------|------------------|--------------|
| VIP 0 | $0 | $5 | $50 |
| VIP 1 | $100 | $8 | $80 |
| VIP 2 | $500 | $12 | $120 |
| VIP 3 | $1,000 | $18 | $180 |
| VIP 4 | $3,000 | $25 | $250 |
| VIP 5 | $5,000 | $35 | $350 |
| VIP 6 | $10,000 | $50 | $500 |
| VIP 7 | $20,000 | $70 | $700 |
| SVIP | $50,000 | $100 | $1,000 |
| Royal VIP | $100,000 | $150 | $1,500 |

## 🔐 Security

- ✅ JWT authentication
- ✅ Password hashing (bcrypt)
- ✅ CORS protection
- ✅ SQL injection protection (Prisma)
- ✅ XSS protection
- ✅ Input validation
- ✅ Idempotency keys

## 🚀 Deployment

### Backend (Render/Railway)
```bash
# Build
npm install
npx prisma generate
npx prisma migrate deploy

# Start
npm start
```

### Frontend (Vercel/Netlify)
```bash
# Build
npm run build

# Output: dist/
```

## 🐛 Troubleshooting

### Backend không start
```bash
# Check MySQL
mysql -u root -p

# Regenerate Prisma Client
cd backend
npx prisma generate
```

### Database connection error
```bash
# Check DATABASE_URL
cat backend/.env

# Test connection
cd backend
npx prisma db pull
```

### Migration errors
```bash
# Reset database (⚠️ deletes all data)
cd backend
npx prisma migrate reset
```

Xem thêm trong [QUICK_START.md](QUICK_START.md)

## 📊 Project Structure

```
greeting-message/
├── backend/              # Express API server
│   ├── config/          # Configuration
│   ├── lib/             # Utilities
│   ├── middleware/      # Express middlewares
│   ├── prisma/          # Prisma schema & migrations
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   └── server.js        # Main server
│
├── frontend/            # React app
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── services/    # API services
│   │   └── types/       # TypeScript types
│   └── vite.config.ts
│
└── docs/                # Documentation
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is private and proprietary.

## 👥 Team

- **Backend**: Node.js + Express + Prisma
- **Frontend**: React + TypeScript + Vite
- **Database**: MySQL + Prisma ORM

## 📞 Support

Nếu gặp vấn đề:
1. Check [QUICK_START.md](QUICK_START.md)
2. Run `node verify-mysql-only.js`
3. Check console logs
4. Check browser DevTools

## 🎉 Acknowledgments

- [Prisma](https://www.prisma.io/) - Amazing ORM
- [Radix UI](https://www.radix-ui.com/) - Accessible components
- [Socket.IO](https://socket.io/) - Real-time engine
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS

---

**Version**: 2.0.0  
**Status**: ✅ Production Ready  
**Database**: MySQL (Prisma)  
**Last Updated**: January 12, 2026

Made with ❤️ by the Greeting Message Team
