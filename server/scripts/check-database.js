const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campus-market');

async function checkDatabase() {
  try {
    // Wait for connection
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('🔍 Checking Database Entries...\n');
    
    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📁 Available Collections:');
    collections.forEach(col => console.log(`  - ${col.name}`));
    console.log('');
    
    // Check Users collection
    const User = require('../models/User');
    const users = await User.find({});
    console.log(`👥 Users (${users.length} total):`);
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.email}`);
      console.log(`     - Name: ${user.first_name} ${user.last_name}`);
      console.log(`     - Status: ${user.status}`);
      console.log(`     - Created: ${user.created_at}`);
      console.log(`     - Email Verified: ${user.email_verified_at || 'Not verified'}`);
      console.log('');
    });
    
    // Check Roles collection
    const Role = require('../models/Role');
    const roles = await Role.find({});
    console.log(`🎭 Roles (${roles.length} total):`);
    roles.forEach((role, index) => {
      console.log(`  ${index + 1}. ${role.name} - ${role.description}`);
    });
    console.log('');
    
    // Check UserRoles collection
    const UserRole = require('../models/UserRole');
    const userRoles = await UserRole.find({}).populate('user_id role_id');
    console.log(`🔗 User Roles (${userRoles.length} total):`);
    userRoles.forEach((userRole, index) => {
      console.log(`  ${index + 1}. User: ${userRole.user_id?.email} -> Role: ${userRole.role_id?.name}`);
    });
    console.log('');
    
    // Check Sessions collection
    const Session = require('../models/Session');
    const sessions = await Session.find({});
    console.log(`🔐 Active Sessions (${sessions.length} total):`);
    sessions.forEach((session, index) => {
      console.log(`  ${index + 1}. User: ${session.user_id} - IP: ${session.ip_address} - Created: ${session.created_at}`);
    });
    console.log('');
    
    // Check AuditLog collection
    const AuditLog = require('../models/AuditLog');
    const auditLogs = await AuditLog.find({}).sort({ created_at: -1 }).limit(10);
    console.log(`📝 Recent Audit Logs (${auditLogs.length} shown):`);
    auditLogs.forEach((log, index) => {
      console.log(`  ${index + 1}. ${log.action} - User: ${log.user_id} - ${log.created_at}`);
    });
    
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkDatabase();
