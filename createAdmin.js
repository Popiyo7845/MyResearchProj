const mongoose = require('mongoose');
const User = require('./model/user');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory-system';

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@robodispense.com' });
    
    if (existingAdmin) {
      console.log('Admin account already exists!');
      console.log('Email:', existingAdmin.email);
      console.log('Role:', existingAdmin.role);
      console.log('Status:', existingAdmin.status);
      
      // Update to ensure it's an admin with approved status
      existingAdmin.role = 'admin';
      existingAdmin.status = 'approved';
      await existingAdmin.save();
      console.log('Admin account updated successfully!');
    } else {
      // Create new admin user
      const admin = new User({
        fullName: 'System Administrator',
        email: 'admin@robodispense.com',
        password: 'Admin@123',
        company: 'RoboDispense',
        role: 'admin',
        status: 'approved',
        isVerified: true
      });

      await admin.save();
      console.log('Admin account created successfully!');
      console.log('Email: admin@robodispense.com');
      console.log('Password: Admin@123');
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createAdmin();