import mongoose from "mongoose";


const CollectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Collections name is required'],
    trim: true,
    maxlength: [50, 'Collection name cannot be more than 50 characters long']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot be more than 200 characters long']
  },
  coverImage: {
    type: String,
    default: '' 
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  pins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pin'
  }],
  isPrivate: {
    type: Boolean,
    default: false
  },
  collaborators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

CollectionSchema.virtual('pinCount').get(function() {
  return this.pins.length;
});

export default mongoose.model('UserCollection', CollectionSchema);