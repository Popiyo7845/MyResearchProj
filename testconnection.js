const mongoose = require('mongoose');
require('dotenv').config();

console.log('🔍 Testing MongoDB Atlas connection...\n');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ SUCCESS! Connected to MongoDB Atlas');
    console.log('📊 Database:', mongoose.connection.db.databaseName);
    console.log('🌐 Host:', mongoose.connection.host);
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ CONNECTION FAILED!');
    console.error('Error:', err.message);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Check your MongoDB Atlas cluster is running');
    console.log('2. Verify your IP address is whitelisted (0.0.0.0/0 for all)');
    console.log('3. Check username/password are correct');
    console.log('4. Make sure database user has read/write permissions');
    process.exit(1);
  });