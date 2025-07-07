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

// Optional: Security middleware (uncomment if needed)
// const cors = require('cors');
// const helmet = require('helmet');
// app.use(cors());
// app.use(helmet());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (includes PDFs)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Routes
const authRoutes = require('./routes/authRoutes');
const messageRoutes = require('./routes/messageRoutes');
const userRoutes = require('./routes/userRoutes');
const newsRoutes = require('./routes/newsRoutes');
const pdfRoutes = require('./routes/pdfRoutes'); // adjust path as needed
const adminRoutes = require('./routes/adminRoutes');
const subscriberRoutes = require('./routes/subscriberRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');


app.use('/api', authRoutes);
app.use('/api/messages', messageRoutes); // ✅ this is essential
app.use('/api', userRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/pdf', pdfRoutes); // ✅ must match this
app.use('/api/admin', adminRoutes);
app.use('/api/subscribe', subscriberRoutes); // ✅ only once
app.use('/api/test', require('./routes/testRoutes'));
app.use('/api/subscribe', subscriptionRoutes);




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
const PORT =  5050;                  
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});      
