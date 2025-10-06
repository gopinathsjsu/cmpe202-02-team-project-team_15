const mongoose = require('mongoose');
const { User, Session, AuditLog, UserRole } = require('../models');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campus-market');

async function testFullLoginFlow() {
  try {
    // Wait for connection
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('🧪 Testing Full Login Flow...\n');
    
    const email = 'properuser@sjsu.edu';
    const password = 'TestPass123!';
    
    // Step 1: Find user
    console.log('1️⃣ Finding user...');
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    console.log(`✅ User found: ${user.email} (${user.status})`);
    
    // Step 2: Check password
    console.log('\n2️⃣ Checking password...');
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      console.log('❌ Invalid password');
      return;
    }
    console.log('✅ Password valid');
    
    // Step 3: Check user status
    console.log('\n3️⃣ Checking user status...');
    if (user.status !== 'active') {
      console.log('❌ User not active');
      return;
    }
    console.log('✅ User is active');
    
    // Step 4: Get user roles
    console.log('\n4️⃣ Getting user roles...');
    const userRoles = await UserRole.find({ user_id: user._id }).populate('role_id');
    const roles = userRoles.map(ur => ur.role_id.name);
    console.log(`✅ User roles: ${roles.join(', ')}`);
    
    // Step 5: Check existing sessions
    console.log('\n5️⃣ Checking existing sessions...');
    const existingSessions = await Session.find({ user_id: user._id });
    console.log(`📊 Current sessions: ${existingSessions.length}`);
    
    // Step 6: Check audit logs
    console.log('\n6️⃣ Checking recent audit logs...');
    const recentLogs = await AuditLog.find({ user_id: user._id }).sort({ created_at: -1 }).limit(5);
    console.log(`📝 Recent audit logs: ${recentLogs.length}`);
    recentLogs.forEach((log, index) => {
      console.log(`   ${index + 1}. ${log.action} - ${log.created_at}`);
    });
    
    console.log('\n🎉 Login flow test completed successfully!');
    console.log('\n📋 What would happen in a real login:');
    console.log('   • JWT tokens would be generated');
    console.log('   • New session would be created');
    console.log('   • Login would be logged in audit trail');
    console.log('   • User would be redirected to dashboard');
    console.log('   • Tokens would be stored in browser localStorage');
    
  } catch (error) {
    console.error('Error testing login flow:', error);
  } finally {
    mongoose.connection.close();
  }
}

testFullLoginFlow();
