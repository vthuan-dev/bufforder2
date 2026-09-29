require('dotenv').config();
const express = require('express');
const cors = require('cors');
const config = require('./config');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const prisma = require('./lib/prisma');
const MessageCleanupService = require('./services/messageCleanup');

// Import routes
const authRoutes = require('./routes/auth');
const vipRoutes = require('./routes/vip');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const chatRoutes = require('./routes/chat');
const productRoutes = require('./routes/products');
const usdtWalletRoutes = require('./routes/usdt-wallets');

const app = express();
const server = http.createServer(app);

// CORS allow-list
const envAllowed = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const STATIC_ALLOWED = new Set([
  'http://localhost:3000',
  'https://localhost:3000',
  'https://ashford.click',
  'https://www.ashford.click',
  'https://ashfordorder.com',
  'https://www.ashfordorder.com',
  'https://ashfsdorder.com',
  'https://www.ashfsdorder.com'
]);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (STATIC_ALLOWED.has(origin)) return true;
  if (/\.vercel\.app$/i.test(origin)) return true;
  if (envAllowed.includes(origin)) return true;
  return false;
};

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) return callback(null, true);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Idempotency-Key']
  }
});

app.set('io', io);
const onlineUsers = new Map();
app.set('onlineUsers', onlineUsers);

// Middleware
const compression = require('compression');
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));

app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Idempotency-Key']
}));
app.options('*', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploads with cache
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads'), {
  maxAge: '1h',
  etag: true
}));

// Disable caching for API responses (except specific endpoints)
app.disable('etag');
app.use((req, res, next) => {
  if (req.method === 'GET' && (req.path.includes('/vip/levels') || req.path.includes('/health'))) {
    res.set('Cache-Control', 'public, max-age=300');
  } else {
    res.set('Cache-Control', 'no-store');
  }
  next();
});

// Test database connection on startup
prisma.$connect()
  .then(() => {
    console.log('✅ Connected to MySQL (Prisma) successfully');
  })
  .catch((error) => {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/vip', vipRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/products', productRoutes);
app.use('/api/usdt-wallets', usdtWalletRoutes);

// Image proxy
app.get('/api/image-proxy', async (req, res) => {
  try {
    const imageUrl = req.query.url;
    if (!imageUrl) {
      return res.status(400).json({ error: 'Missing url parameter' });
    }

    const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80&auto=format&fit=crop';

    // Blacklist dead domains to avoid spam errors
    const deadDomains = ['placeimg.com', 'lorempixel.com', 'via.placeholder.com'];
    const urlObj = new URL(imageUrl);
    if (deadDomains.some(domain => urlObj.hostname.includes(domain))) {
      return res.redirect(DEFAULT_FALLBACK_IMAGE);
    }

    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/*,*/*;q=0.8',
        'Referer': urlObj.origin
      },
      timeout: 5000 // 5s timeout
    });

    if (!response.ok) {
      return res.redirect(DEFAULT_FALLBACK_IMAGE);
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=3600');
    res.set('Access-Control-Allow-Origin', '*');

    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (error) {
    if (!error.message?.includes('placeimg.com') && !error.message?.includes('lorempixel.com')) {
      console.error('Image proxy error:', error.message);
    }
    // Return high quality fallback image on error
    return res.redirect('https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80&auto=format&fit=crop');
  }
});

// Start message cleanup service
const messageCleanupService = new MessageCleanupService();
messageCleanupService.setSocketIO(io);
messageCleanupService.start();

// Socket.IO authentication
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    const adminToken = socket.handshake.auth?.adminToken;

    if (!token && !adminToken) return next(new Error('Unauthorized'));

    if (adminToken) {
      const decoded = jwt.verify(adminToken, config.JWT_SECRET);
      socket.data.role = 'admin';
      socket.data.adminId = decoded.adminId;
      return next();
    }

    const decoded = jwt.verify(token, config.JWT_SECRET);
    socket.data.role = 'user';
    socket.data.userId = decoded.userId;
    next();
  } catch (e) {
    next(new Error('Unauthorized'));
  }
});

io.on('connection', (socket) => {
  console.log('[socket] connected', { role: socket.data.role, userId: socket.data.userId, adminId: socket.data.adminId });

  if (socket.data.role === 'user') {
    socket.join(`user:${socket.data.userId}`);
    const uid = String(socket.data.userId);
    const current = onlineUsers.get(uid) || 0;
    onlineUsers.set(uid, current + 1);
    try { io.to('admins').emit('presence:update', { userId: uid, online: true }); } catch { }
  } else if (socket.data.role === 'admin') {
    socket.join('admins');
    console.log('[socket] Admin joined admins room');
  }

  // Handle admin:join event (in case client emits it explicitly)
  socket.on('admin:join', () => {
    if (socket.data.role === 'admin') {
      socket.join('admins');
      console.log('[socket] Admin explicitly joined admins room via admin:join event');
    }
  });

  socket.on('chat:joinThread', (threadId) => {
    if (threadId) socket.join(`thread:${threadId}`);
  });

  socket.on('chat:send', async ({ threadId, text }) => {
    try {
      if (!text) return;

      // Verify user exists first
      if (socket.data.role === 'user') {
        const userExists = await prisma.user.findUnique({
          where: { id: socket.data.userId },
          select: { id: true }
        });
        if (!userExists) {
          socket.emit('chat:error', { message: 'User not found. Please login again.' });
          return;
        }
      }

      let thread = null;
      if (!threadId && socket.data.role === 'user') {
        thread = await prisma.chatThread.findFirst({
          where: { userId: socket.data.userId, status: 'open' }
        });
        if (!thread) {
          thread = await prisma.chatThread.create({
            data: { userId: socket.data.userId }
          });
        }
        threadId = thread.id;
      } else {
        thread = await prisma.chatThread.findUnique({ where: { id: threadId } });
      }
      if (!thread) return;

      // Record IP and update on every message from user
      try {
        if (socket.data.role === 'user') {
          const rawIp = (socket.handshake.headers['x-forwarded-for'] || socket.handshake.address || '').toString();
          const ip = rawIp.split(',')[0].trim();
          if (ip) {
            await prisma.chatThread.update({
              where: { id: thread.id },
              data: { userIp: ip }
            });
          }
        }
      } catch { }

      const senderType = socket.data.role === 'admin' ? 'admin' : 'user';
      const senderId = socket.data.role === 'admin' ? socket.data.adminId : socket.data.userId;

      console.log('[socket] 💾 Saving message from socket send:', { threadId, senderType, text });
      const msg = await prisma.chatMessage.create({
        data: { threadId, senderType, senderId, text }
      });

      // Update thread counters
      const updateData = {
        lastMessageAt: new Date(),
        lastMessageText: text
      };
      if (senderType === 'user') {
        updateData.unreadForAdmin = { increment: 1 };
      } else {
        updateData.unreadForUser = { increment: 1 };
      }
      await prisma.chatThread.update({
        where: { id: threadId },
        data: updateData
      });

      io.to(`thread:${threadId}`).emit('chat:message', {
        _id: msg.id,
        threadId,
        senderType,
        text,
        createdAt: msg.createdAt
      });

      io.to(`thread:${threadId}`).emit('chat:typing', {
        threadId,
        typing: false,
        senderType,
        text: ''
      });

      io.to('admins').emit('chat:threadUpdated', { threadId, lastMessageText: text, lastMessageAt: new Date() });
      io.to(`user:${thread.userId}`).emit('chat:threadUpdated', { threadId, lastMessageText: text, lastMessageAt: new Date() });
    } catch (e) {
      console.error('socket send error', e);
    }
  });

  socket.on('chat:typing', ({ threadId, typing, text }) => {
    try {
      if (!threadId) return;
      const senderType = socket.data.role === 'admin' ? 'admin' : 'user';
      io.to(`thread:${threadId}`).emit('chat:typing', { threadId, typing: !!typing, senderType, text: text || '' });
    } catch { }
  });

  socket.on('disconnect', async () => {
    if (socket.data.role === 'user' && socket.data.userId) {
      const uid = String(socket.data.userId);
      const current = onlineUsers.get(uid) || 0;
      if (current <= 1) {
        onlineUsers.delete(uid);
        try {
          // Check if user exists before updating
          const userExists = await prisma.user.findUnique({
            where: { id: uid },
            select: { id: true }
          });

          if (userExists) {
            await prisma.user.update({
              where: { id: uid },
              data: { lastSeenAt: new Date() }
            });
          }
        } catch (err) {
          // Silently ignore - user might have been deleted
        }
        try { io.to('admins').emit('presence:update', { userId: uid, online: false }); } catch { }
      } else {
        onlineUsers.set(uid, current - 1);
      }
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    message: 'Lỗi server. Vui lòng thử lại sau.'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint không tồn tại'
  });
});

const PORT = config.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📱 Frontend URL: http://localhost:3000`);
  console.log(`🔗 API URL: http://localhost:${PORT}/api`);

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down server...');
    messageCleanupService.stop();
    await prisma.$disconnect();
    process.exit(0);
  });
});
