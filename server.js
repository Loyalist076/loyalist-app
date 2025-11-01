const express = require('express');
const http = require('http');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const socketIo = require('socket.io');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'MAILCHIMP_API_KEY',
  'MAILCHIMP_SERVER_PREFIX',
  'MAILCHIMP_AUDIENCE_ID',
  'SENDGRID_API_KEY',
  'GMAIL_USER',
  'GMAIL_APP_PASSWORD',
  'BASE_URL'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}

// Initialize Express and HTTP server
const app = express();
const server = http.createServer(app);
const io = socketIo(server); // Attach socket.io

// MongoDB models
const User = require('./models/User');
const Message = require('./models/Message');

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for now to allow inline scripts
  crossOriginEmbedderPolicy: false
}));

// CORS Configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // 10 requests per 15 minutes
  message: 'Too many authentication attempts, please try again later.'
});

// Body Parser Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
// Serve annual meeting documents from root uploads directory
app.use('/uploads/annual-meeting-documents', express.static(path.join(__dirname, 'uploads/annual-meeting-documents')));

// Routes
const authRoutes = require('./routes/authRoutes');
const messageRoutes = require('./routes/messageRoutes');
const userRoutes = require('./routes/userRoutes');
const newsRoutes = require('./routes/newsRoutes');
const pdfRoutes = require('./routes/pdfRoutes');
const adminRoutes = require('./routes/adminRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes'); // ✅ Mailchimp
const financialRoutes = require('./routes/financialRoutes');
const companyStructureRoutes = require('./routes/companyStructure'); // ✅ New unified MVC


const testRoutes = require('./routes/testRoutes');
const upcomingEventRoutes = require('./routes/upcomingEventRoutes');
const annualMeetingRoutes = require('./routes/annualMeetingRoutes');

// Apply auth rate limiter to auth routes
app.use('/api', authLimiter, authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api', userRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/test', testRoutes);
app.use('/api/upcoming-events', upcomingEventRoutes);
app.use('/api/financials', financialRoutes);
app.use('/api/company-structure', companyStructureRoutes); // ✅ Unified Capital & Ownership
app.use('/api/annual-meeting-documents', annualMeetingRoutes); // ✅ Annual Meeting Documents


// ✅ Mount only this to handle subscriptions via Mailchimp
app.use('/api/subscribe', subscriptionRoutes);

// ❌ Removed conflicting line that was overriding Mailchimp logic:
// app.use('/api/subscribe', subscriberRoutes);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI).then(() => {
  console.log('✅ Connected to MongoDB');
}).catch((err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Socket.IO: Admin dashboard stats
io.on('connection', async (socket) => {
  console.log('📡 New admin connected to dashboard');

  try {
    const totalUsers = await User.countDocuments();
    const totalMessages = await Message.countDocuments();

    socket.emit('dashboardStats', {
      totalUsers,
      totalMessages
    });
  } catch (err) {
    console.error('❌ Error fetching dashboard stats:', err);
  }
});

// Fallback route for homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 5050;       
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
