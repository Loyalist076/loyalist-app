const express = require('express');
const http = require('http');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const socketIo = require('socket.io');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Load environment variables FIRST
dotenv.config();

// Import centralized config and logger
const { config, validateEnv } = require('./src/config');
const logger = require('./src/utils/logger');
const { errorHandler, notFoundHandler } = require('./src/middleware/errorHandler');

// Validate required environment variables
const missingEnvVars = validateEnv();
if (missingEnvVars.length > 0) {
  logger.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
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
  origin: config.allowedOrigins,
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Compression middleware for all responses
app.use(compression());

// HTTP request logging with Morgan
app.use(morgan('combined', { stream: logger.stream }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // 10 requests per 15 minutes
  message: 'Too many authentication attempts, please try again later.'
});

// Body Parser Middleware — allow large payloads for big PDF uploads
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ extended: true, limit: '200mb' }));

// Cache control middleware for static files
app.use((req, res, next) => {
  // Set cache control headers based on file type
  if (req.url.match(/\.(css|js)$/)) {
    // CSS and JS files: short cache with must-revalidate
    res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate'); // 5 minutes
  } else if (req.url.match(/\.(jpg|jpeg|png|gif|ico|svg|webp)$/)) {
    // Images: longer cache
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours
  } else if (req.url.match(/\.html$/)) {
    // HTML files: no cache
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
// Serve annual meeting documents from root uploads directory
app.use('/uploads/annual-meeting-documents', express.static(path.join(__dirname, 'uploads/annual-meeting-documents')));
// Serve press release PDFs from uploads directory
app.use('/uploads/press-releases', express.static(path.join(__dirname, 'public/uploads/press-releases')));

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
const corporatePresentationRoutes = require('./routes/corporatePresentationRoutes');
const technicalReportRoutes = require('./routes/technicalReportRoutes');

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
app.use('/api/corporate-presentation', corporatePresentationRoutes); // ✅ Corporate Presentation Management
app.use('/api/technical-reports', technicalReportRoutes); // ✅ Technical Reports Management


// ✅ Mount only this to handle subscriptions via Mailchimp
app.use('/api/subscribe', subscriptionRoutes);

// ❌ Removed conflicting line that was overriding Mailchimp logic:
// app.use('/api/subscribe', subscriberRoutes);

// MongoDB Connection
mongoose.connect(config.mongodbUri).then(() => {
  logger.info('Connected to MongoDB');
}).catch((err) => {
  logger.error('MongoDB connection error:', err);
  process.exit(1);
});

// Socket.IO: Admin dashboard stats
io.on('connection', async (socket) => {
  logger.info('New admin connected to dashboard');

  try {
    const totalUsers = await User.countDocuments();
    const totalMessages = await Message.countDocuments();

    socket.emit('dashboardStats', {
      totalUsers,
      totalMessages
    });
  } catch (err) {
    logger.error('Error fetching dashboard stats:', err);
  }
});

// Redirect routes for pages that should be in /page/ directory
const pageRedirects = [
  'presentations.html',
  'press-release.html',
  'technical-reports.html',
  'company.html',
  'our-team.html',
  'tully-project.html',
  'desantis-project.html',
  'loveland-project.html',
  'gold-rush.html',
  'corporate-structure.html',
  'financial-statements.html',
  'annual-meeting-documents.html',
  'contact.html',
  'disclaimers.html',
  'projects.html',
  'all-news.html',
  'investors.html'
];

pageRedirects.forEach(page => {
  app.get(`/${page}`, (req, res) => {
    res.redirect(301, `/page/${page}`);
  });
});

// Fallback route for homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 handler - must be after all routes
app.use(notFoundHandler);

// Global error handler - must be last middleware
app.use(errorHandler);

// Start server
server.listen(config.port, () => {
  logger.info(`Server running at http://localhost:${config.port}`);
});
