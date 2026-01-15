const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Product Schema
const productSchema = new mongoose.Schema({
  itemCode: {
    type: String,
    unique: true,
    required: true
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

// Generate item code before saving
productSchema.pre('save', async function(next) {
  if (!this.itemCode) {
    const count = await this.constructor.countDocuments();
    this.itemCode = `ITEM-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

const Product = mongoose.model('Product', productSchema);

// Activity Schema for tracking changes
const activitySchema = new mongoose.Schema({
  message: String,
  time: {
    type: Date,
    default: Date.now
  }
});

const Activity = mongoose.model('Activity', activitySchema);

// GET all products
router.get('/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST new product
router.post('/products', async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    
    // Log activity
    await Activity.create({
      message: `Added ${product.quantity} units of ${product.productName}`
    });
    
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT update product
router.put('/products/:id', async (req, res) => {
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

// DELETE product
router.delete('/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Log activity
    await Activity.create({
      message: `Removed all units of ${product.productName} from inventory`
    });
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET stats
router.get('/stats', async (req, res) => {
  try {
    const totalItems = await Product.countDocuments();
    const lowStockItems = await Product.countDocuments({ quantity: { $lt: 10 } });
    
    // Stock in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const stockInToday = await Product.countDocuments({
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

// GET recent activity
router.get('/recent-activity', async (req, res) => {
  try {
    const activities = await Activity.find()
      .sort({ time: -1 })
      .limit(10);
    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;