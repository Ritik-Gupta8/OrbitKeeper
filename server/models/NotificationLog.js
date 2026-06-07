import mongoose from 'mongoose';

const notificationLogSchema = new mongoose.Schema({
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
  company: { type: String },
  role: { type: String },
  notificationType: {
    type: String,
    enum: ['24_hour_reminder', '12_hour_reminder', 'custom'],
    required: true,
  },
  channel: { type: String, enum: ['email', 'push', 'sms', 'whatsapp'], default: 'email' },
  sentTo: { type: String },
  sentAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['sent', 'failed'], default: 'sent' },
  errorMessage: { type: String },
}, { timestamps: true });

notificationLogSchema.index({ applicationId: 1, notificationType: 1 });

export default mongoose.model('NotificationLog', notificationLogSchema);
