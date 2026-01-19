const mongoose = require('mongoose');
const User = require('./model/user');
require('dotenv').config();

// Try multiple possible environment variable names
const MONGODB_URI = process.env.MONGODB_URI || 
                    process.env.db || 
                    'mongodb+srv://popiyo7845:popiyo7845@cluster0.3mlpgbe.mongodb.net/inventory-system';

async function createAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    console.log('Using URI:', MONGODB_URI.replace(/\/\/.*:.*@/, '//***:***@')); // Hide password in logs
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully!');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@robodispense.com' });
    
    if (existingAdmin) {
      console.log('\n⚠️  Admin account already exists!');
      console.log('Email:', existingAdmin.email);
      console.log('Role:', existingAdmin.role);
      console.log('Status:', existingAdmin.status);
      
      // Update to ensure it's an admin with approved status
      existingAdmin.role = 'admin';
      existingAdmin.status = 'approved';
      existingAdmin.isVerified = true;
      await existingAdmin.save();
      console.log('✅ Admin account updated successfully!');
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
      console.log('\n✅ Admin account created successfully!');
      console.log('─────────────────────────────────');
      console.log('📧 Email: admin@robodispense.com');
      console.log('🔑 Password: Admin@123');
      console.log('─────────────────────────────────');
      console.log('You can now log in with these credentials!');
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    console.log('✅ Script completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error occurred:');
    console.error(error.message);
    if (error.stack) {
      console.error('\nFull error:', error);
    }
    process.exit(1);
  }
}

// Run the script
console.log('🚀 Starting admin creation script...\n');
createAdmin();