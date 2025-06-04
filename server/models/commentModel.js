import mongoose from "mongoose";

const CommentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    trim: true,
    maxlength: [500, 'Comment cannot be more than 500 characters long']
  },
  pin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pin',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  replies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

CommentSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

CommentSchema.virtual('replyCount').get(function() {
  return this.replies.length;
});

 export default mongoose.model('Comment', CommentSchema);