const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// MongoDB Connection
const MONGODB_URI = process.env.db || process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory-system';

console.log('Connecting to MongoDB...');
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Session configuration with MongoStore v4 syntax
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: MONGODB_URI,
    touchAfter: 24 * 3600
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  }
}));

console.log('Session configured with MongoStore');

// ==================== MIDDLEWARE FOR AUTH ====================

// Middleware to check if user is logged in
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }
  next();
}

// ==================== SCHEMAS AND MODELS ====================

// Product Schema - NOW WITH USER ID
const productSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  itemCode: {
    type: String,
    required: false  // Changed to false - will be generated automatically
  },
  productName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  brand: {
    type: String,
    required: true
  },
  expirationDate: {
    type: Date,
    required: true
  },
  manufacturingDate: {
    type: Date,
    required: true
  },
  description: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Generate item code before saving - unique per user
productSchema.pre('save', async function(next) {
  if (!this.itemCode) {
    try {
      // Count products for THIS USER only
      const count = await this.constructor.countDocuments({ userId: this.userId });
      this.itemCode = `ITEM${String(count + 1).padStart(5, '0')}`;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Compound index to ensure itemCode is unique per user
productSchema.index({ userId: 1, itemCode: 1 }, { unique: true });

const Product = mongoose.model('Product', productSchema);

// Activity Schema - NOW WITH USER ID
const activitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: String,
  time: {
    type: Date,
    default: Date.now
  }
});

const Activity = mongoose.model('Activity', activitySchema);

// ==================== API ROUTES (USER-SPECIFIC) ====================

// GET all products for logged-in user
app.get('/api/products', requireAuth, async (req, res) => {
  try {
    const products = await Product.find({ userId: req.session.userId })
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST new product for logged-in user
app.post('/api/products', requireAuth, async (req, res) => {
  try {
    const product = new Product({
      ...req.body,
      userId: req.session.userId  // Add user ID to product
    });
    await product.save();
    
    // Log activity for this user
    await Activity.create({
      userId: req.session.userId,
      message: `Added ${product.quantity} units of ${product.productName}`
    });
    
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT update product (only if it belongs to the user)
app.put('/api/products/:id', requireAuth, async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, userId: req.session.userId },  // Check ownership
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found or unauthorized' });
    }
    
    res.json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE product (only if it belongs to the user)
app.delete('/api/products/:id', requireAuth, async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      userId: req.session.userId  // Check ownership
    });
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found or unauthorized' });
    }
    
    // Log activity for this user
    await Activity.create({
      userId: req.session.userId,
      message: `Removed all units of ${product.productName} from inventory`
    });
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET stats for logged-in user
app.get('/api/stats', requireAuth, async (req, res) => {
  try {
    const totalItems = await Product.countDocuments({ userId: req.session.userId });
    const lowStockItems = await Product.countDocuments({ 
      userId: req.session.userId,
      quantity: { $lt: 10 } 
    });
    
    // Stock in today for this user
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const stockInToday = await Product.countDocuments({
      userId: req.session.userId,
      createdAt: { $gte: today }
    });
    
    res.json({
      totalItems,
      stockInToday,
      lowStockItems
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET recent activity for logged-in user
app.get('/api/recent-activity', requireAuth, async (req, res) => {
  try {
    const activities = await Activity.find({ userId: req.session.userId })
      .sort({ time: -1 })
      .limit(10);
    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== DATABASE CLEANUP ROUTE ====================

// TEMPORARY: Clean up old products without userId
app.get('/api/cleanup-database', async (req, res) => {
  try {
    // Delete all products that don't have a userId
    const result = await Product.deleteMany({ userId: { $exists: false } });
    
    // Delete all activities that don't have a userId
    const activityResult = await Activity.deleteMany({ userId: { $exists: false } });
    
    res.json({ 
      message: 'Database cleaned successfully',
      productsDeleted: result.deletedCount,
      activitiesDeleted: activityResult.deletedCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== AUTH ROUTES ====================

// Import auth routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

console.log('Routes loaded');

// ==================== STATIC FILES & PAGE ROUTES ====================

// Serve static files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/register.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'register.html'));
});

// Admin dashboard route
app.get('/admin.html', (req, res) => {
  if (req.session.role !== 'admin') {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// User dashboard route (examplepg.html)
app.get('/examplepg.html', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, 'examplepg.html'));
});

// Dashboard route - redirects based on role
app.get('/dashboard', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/');
  }
  
  if (req.session.role === 'admin') {
    return res.redirect('/admin.html');
  } else {
    return res.redirect('/examplepg.html');
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
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