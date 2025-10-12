import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // Can be null for system actions
  },
  action: {
    type: String,
    required: true,
    enum: [
      'SIGN_UP',
      'VERIFY_EMAIL', 
      'LOGIN',
      'LOGOUT',
      'REFRESH',
      'ENABLE_MFA',
      'DISABLE_MFA',
      'RESET_PASSWORD',
      'CHANGE_PASSWORD',
      'ASSIGN_ROLE',
      'REVOKE_ROLE',
      'SUSPEND_USER',
      'REACTIVATE_USER'
    ]
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

// Index for querying audit logs
auditLogSchema.index({ user_id: 1, created_at: -1 });
auditLogSchema.index({ action: 1, created_at: -1 });

export default mongoose.model('AuditLog', auditLogSchema);

