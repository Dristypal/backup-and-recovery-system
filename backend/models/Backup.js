const mongoose = require('mongoose');

const backupSchema = new mongoose.Schema({
  backupType: {
    type: String,
    enum: ['file', 'database'],
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    default: null
  },
  fileName: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  s3Key: {
    type: String,
    required: true
  },
  s3Url: {
    type: String,
    required: true
  },
  s3VersionId: {
    type: String,
    default: null
  },
  versionNumber: {
    type: Number,
    default: 1
  },
  fileSize: {
    type: Number,
    default: 0
  },
  mimeType: {
    type: String,
    default: 'application/octet-stream'
  },
  category: {
    type: String,
    enum: ['image', 'document', 'database', 'other'],
    default: 'other'
  },
  isLatest: {
    type: Boolean,
    default: false
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

backupSchema.index({ backupType: 1, createdAt: -1 });
backupSchema.index({ fileId: 1, versionNumber: -1 });

module.exports = mongoose.model('Backup', backupSchema);
