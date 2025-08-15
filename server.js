const express = require('express');
const http = require('http');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const socketIo = require('socket.io');

// Load environment variables
dotenv.config();

// Initialize Express and HTTP server
const app = express();
const server = http.createServer(app);
const io = socketIo(server); // Attach socket.io

// MongoDB models
const User = require('./models/User');
const Message = require('./models/Message');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

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

app.use('/api', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api', userRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/test', testRoutes);
app.use('/api/upcoming-events', upcomingEventRoutes);
app.use('/api/financials', financialRoutes);
app.use('/api/company-structure', companyStructureRoutes); // ✅ Unified Capital & Ownership
app.use('/uploads', express.static('public/uploads'));


// ✅ Mount only this to handle subscriptions via Mailchimp
app.use('/api/subscribe', subscriptionRoutes);

// ❌ Removed conflicting line that was overriding Mailchimp logic:
// app.use('/api/subscribe', subscriberRoutes);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ Connected to MongoDB');
}).catch((err) => {
  console.error('❌ MongoDB connection error:', err);
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
