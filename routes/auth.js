const express = require('express');
const router = express.Router();
const User = require('../model/user');

// Registration endpoint
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, company, password } = req.body;

    // Validation
    if (!fullName || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'All required fields must be filled' 
      });
    }

    // Password strength validation (minimum 6 characters for your form)
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        error: 'Password must be at least 6 characters' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email already registered' 
      });
    }

    // Create new user
    const newUser = new User({
      fullName,
      email,
      company: company || '',
      password,
      role: 'user',
      status: 'pending'
    });

    await newUser.save();

    res.status(201).json({ 
      success: true, 
      message: 'Registration successful! Please wait for admin approval before logging in.' 
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error during registration. Please try again.' 
    });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Check if account is approved (only for regular users, not admin)
    if (user.role === 'user' && user.status !== 'approved') {
      return res.status(403).json({ 
        success: false, 
        message: 'Your account is pending admin approval. Please wait for approval before logging in.' 
      });
    }

    // Create session
    req.session.userId = user._id;
    req.session.role = user.role;
    req.session.email = user.email;

    // Return success with role for frontend routing
    res.json({ 
      success: true, 
      message: 'Login successful',
      role: user.role,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login' 
    });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: 'Logout failed' 
      });
    }
    res.json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
  });
});

// Check session endpoint
router.get('/check-session', (req, res) => {
  if (req.session.userId) {
    res.json({ 
      authenticated: true, 
      role: req.session.role 
    });
  } else {
    res.json({ 
      authenticated: false 
    });
  }
});

// ===== ADMIN ROUTES =====

// Admin: Get pending users
router.get('/admin/pending-users', async (req, res) => {
  try {
    // Check if user is admin
    if (!req.session.userId || req.session.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied. Admin only.' 
      });
    }

    const pendingUsers = await User.find({ status: 'pending' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({ 
      success: true, 
      users: pendingUsers 
    });

  } catch (error) {
    console.error('Error fetching pending users:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error' 
    });
  }
});

// Admin: Get all users
router.get('/admin/all-users', async (req, res) => {
  try {
    // Check if user is admin
    if (!req.session.userId || req.session.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied. Admin only.' 
      });
    }

    const allUsers = await User.find({ role: 'user' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({ 
      success: true, 
      users: allUsers 
    });

  } catch (error) {
    console.error('Error fetching all users:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error' 
    });
  }
});

// Admin: Approve user
router.post('/admin/approve-user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { adminEmail } = req.body;

    // Check if user is admin
    if (!req.session.userId || req.session.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied. Admin only.' 
      });
    }

    const user = await User.findByIdAndUpdate(
      userId, 
      { 
        status: 'approved',
        approvedBy: adminEmail,
        approvedAt: new Date()
      }, 
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    res.json({ 
      success: true, 
      message: `User ${user.fullName} approved successfully` 
    });

  } catch (error) {
    console.error('Error approving user:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error' 
    });
  }
});

// Admin: Reject user
router.post('/admin/reject-user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user is admin
    if (!req.session.userId || req.session.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied. Admin only.' 
      });
    }

    const user = await User.findByIdAndUpdate(
      userId, 
      { status: 'rejected' }, 
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    res.json({ 
      success: true, 
      message: `User ${user.fullName} rejected successfully` 
    });

  } catch (error) {
    console.error('Error rejecting user:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error' 
    });
  }
});

// Admin: Old endpoints for backward compatibility
router.get('/pending-users', async (req, res) => {
  try {
    if (!req.session.userId || req.session.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    const pendingUsers = await User.find({ status: 'pending' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({ 
      success: true, 
      users: pendingUsers 
    });

  } catch (error) {
    console.error('Error fetching pending users:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

router.post('/update-user-status', async (req, res) => {
  try {
    const { userId, status } = req.body;

    if (!req.session.userId || req.session.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status' 
      });
    }

    const user = await User.findByIdAndUpdate(
      userId, 
      { status }, 
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({ 
      success: true, 
      message: `User ${status} successfully` 
    });

  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

module.exports = router;