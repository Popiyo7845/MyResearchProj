// ... (all your existing code above stays the same)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// DEBUG: Check database connection and users
app.get('/api/debug/check', async (req, res) => {
  try {
    const User = require('./model/user');
    
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    const totalUsers = await User.countDocuments();
    const admins = await User.countDocuments({ role: 'admin' });
    const pendingUsers = await User.countDocuments({ status: 'pending' });
    const approvedUsers = await User.countDocuments({ status: 'approved' });
    
    // Check specific user
    const testUser = await User.findOne({ email: 'jhonmichelaliman@gmail.com' });
    
    res.json({
      mongoStatus,
      environmentVars: {
        hasDB: !!process.env.db,
        hasMONGODB_URI: !!process.env.MONGODB_URI,
        hasSESSION_SECRET: !!process.env.SESSION_SECRET,
        NODE_ENV: process.env.NODE_ENV
      },
      stats: {
        totalUsers,
        admins,
        pendingUsers,
        approvedUsers
      },
      yourAccount: testUser ? {
        email: testUser.email,
        status: testUser.status,
        role: testUser.role,
        createdAt: testUser.createdAt
      } : 'Not found - you need to register first'
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      mongoStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!' 
  });
});

// Start server
app.listen(PORT, () => {
  console.log('Server is running on http://localhost:' + PORT);
  console.log('Ready to accept connections!');
});