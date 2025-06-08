import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['like', 'comment', 'save', 'follow', 'mention', 'invite'],
    required: true
  },
  pin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pin'
  },
  collections: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserCollection'
  },
  comment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  },
  message: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

export default mongoose.model('Notification', NotificationSchema);