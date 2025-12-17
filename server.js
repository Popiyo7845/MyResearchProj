const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = 'mongodb://localhost:27017/inventory_system';
// For MongoDB Atlas (cloud), replace with: 'mongodb+srv://username:password@cluster.mongodb.net/inventory_system'

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Product Schema
const productSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  quantity: { type: Number, required: true },
  brand: { type: String, required: true },
  expirationDate: { type: Date, required: true },
  manufacturingDate: { type: Date, required: true },
  description: { type: String },
  itemCode: { type: String, unique: true },
  createdAt: { type: Date, default: Date.now }
});

// Auto-generate item code
productSchema.pre('save', async function(next) {
  if (!this.itemCode) {
    const count = await Product.countDocuments();
    this.itemCode = `ITEM${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

const Product = mongoose.model('Product', productSchema);

// ==================== API ROUTES ====================

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single product
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new product
app.post('/api/products', async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update product
app.put('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete product
app.delete('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get dashboard stats
app.get('/api/stats', async (req, res) => {
  try {
    const totalItems = await Product.countDocuments();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const stockInToday = await Product.countDocuments({
      createdAt: { $gte: today }
    });
    
    const lowStockItems = await Product.countDocuments({
      quantity: { $lt: 10 }
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

// Get recent activity
app.get('/api/recent-activity', async (req, res) => {
  try {
    const recentProducts = await Product.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('productName quantity createdAt');
    
    const activity = recentProducts.map(p => ({
      message: `Added ${p.quantity} units of ${p.productName}`,
      time: p.createdAt
    }));
    
    res.json(activity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}/api`);
});