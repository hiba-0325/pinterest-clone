import mongoose from "mongoose";

const PinSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters long']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters long']
  },
  imageUrl: {
    type: String,
    required: [true, 'Image URL is required']
  },
  imagePublicId: {
    type: String, // For Cloudinary image management
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  savedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  destinationLink: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

PinSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

PinSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

PinSchema.virtual('saveCount').get(function() {
  return this.savedBy.length;
});

PinSchema.index({ title: 'text', description: 'text', tags: 'text' });

 export default mongoose.model('Pin', PinSchema);