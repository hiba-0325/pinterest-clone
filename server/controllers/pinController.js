import Pin from '../models/pinModel.js';
import User from '../models/userModel.js';
import Collection from '../models/collectionModel.js';
import Notification from '../models/notificationModel.js';
import cloudinary from '../utils/cloudinary.js';

export const createPin = async (req, res, next) => {
  try {
    const { title, description, tags, destinationLink } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image'
      });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'pinterest-clone/pins',
      resource_type: 'image'
    });

    const pin = await Pin.create({
      title,
      description,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      imageUrl: result.secure_url,
      imagePublicId: result.public_id,
      creator: req.user._id,
      destinationLink
    });

    await pin.populate('creator', 'username profileImage');

    res.status(201).json({
      success: true,
      pin
    });
  } catch (error) {
    next(error);
  }
};


export const getPins = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, sort = 'recent', search, tags } = req.query;
    const query = {};

    if (search) {
      query.$text = { $search: search };
    }

    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query.tags = { $in: tagArray };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    let sortOption = {};

    switch (sort) {
      case 'popular':
        sortOption = { likeCount: -1 };
        break;
      case 'saved':
        sortOption = { savedBy: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'recent':
      default:
        sortOption = { createdAt: -1 };
    }

    const pins = await Pin.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('creator', 'username profileImage')
      .lean();

    const total = await Pin.countDocuments(query);

    if (req.user) {
      pins.forEach(pin => {
        pin.isLiked = pin.likes.some(like => like.toString() === req.user._id.toString());
        pin.isSaved = pin.savedBy.some(save => save.toString() === req.user._id.toString());
      });
    }

    res.status(200).json({
      success: true,
      pins,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get single pin by ID
export const getPin = async (req, res, next) => {
  try {
    const pin = await Pin.findById(req.params.id)
      .populate('creator', 'username profileImage bio')
      .populate({
        path: 'comments',
        populate: {
          path: 'user',
          select: 'username profileImage'
        },
        options: { sort: { createdAt: -1 } }
      });

    if (!pin) {
      return res.status(404).json({
        success: false,
        message: 'Pin not found'
      });
    }

    if (req.user) {
      pin._doc.isLiked = pin.likes.some(like => like.toString() === req.user._id.toString());
      pin._doc.isSaved = pin.savedBy.some(save => save.toString() === req.user._id.toString());

      const collections = await Collection.find({ creator: req.user._id })
        .select('name _id pinCount coverImage')
        .sort('name')
        .lean();

      pin._doc.userCollections = collections;
    }

    res.status(200).json({
      success: true,
      pin
    });
  } catch (error) {
    next(error);
  }
};

// Update pin
export const updatePin = async (req, res, next) => {
  try {
    const { title, description, tags, destinationLink } = req.body;
    let pin = await Pin.findById(req.params.id);

    if (!pin) {
      return res.status(404).json({
        success: false,
        message: 'Pin not found'
      });
    }

    if (pin.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this pin'
      });
    }

    pin.title = title || pin.title;
    pin.description = description || pin.description;
    pin.tags = tags ? tags.split(',').map(tag => tag.trim()) : pin.tags;
    pin.destinationLink = destinationLink || pin.destinationLink;

    await pin.save();
    await pin.populate('creator', 'username profileImage');

    res.status(200).json({
      success: true,
      pin
    });
  } catch (error) {
    next(error);
  }
};

// Delete pin
export const deletePin = async (req, res, next) => {
  try {
    const pin = await Pin.findById(req.params.id);

    if (!pin) {
      return res.status(404).json({
        success: false,
        message: 'Pin not found'
      });
    }

    if (pin.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this pin'
      });
    }

    if (pin.imagePublicId) {
      await cloudinary.uploader.destroy(pin.imagePublicId);
    }

    await Collection.updateMany(
      { pins: pin._id },
      { $pull: { pins: pin._id } }
    );

    await User.updateMany(
      { savedPins: pin._id },
      { $pull: { savedPins: pin._id } }
    );

    await Notification.deleteMany({ pin: pin._id });
    await pin.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Pin deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};


export const toggleLike = async (req, res, next) => {
  try {
    const pin = await Pin.findById(req.params.id);

    if (!pin) {
      return res.status(404).json({
        success: false,
        message: 'Pin not found'
      });
    }

    const isLiked = pin.likes.includes(req.user._id);

    if (isLiked) {
      pin.likes = pin.likes.filter(like => like.toString() !== req.user._id.toString());
      await pin.save();

      res.status(200).json({
        success: true,
        message: 'Pin unliked successfully',
        isLiked: false,
        likeCount: pin.likes.length
      });
    } else {
      pin.likes.push(req.user._id);
      await pin.save();

      if (pin.creator.toString() !== req.user._id.toString()) {
        await Notification.create({
          recipient: pin.creator,
          sender: req.user._id,
          type: 'like',
          pin: pin._id,
          message: `${req.user.username} liked your pin`
        });
      }

      res.status(200).json({
        success: true,
        message: 'Pin liked successfully',
        isLiked: true,
        likeCount: pin.likes.length
      });
    }
  } catch (error) {
    next(error);
  }
};

// Save/unsave pin
export const toggleSave = async (req, res, next) => {
  try {
    const { collectionId } = req.body;
    const pin = await Pin.findById(req.params.id);

    if (!pin) {
      return res.status(404).json({
        success: false,
        message: 'Pin not found'
      });
    }

    const isSaved = pin.savedBy.includes(req.user._id);

    if (isSaved) {
      pin.savedBy = pin.savedBy.filter(save => save.toString() !== req.user._id.toString());
      req.user.savedPins = req.user.savedPins.filter(pinId => pinId.toString() !== pin._id.toString());

      if (collectionId) {
        await Collection.findOneAndUpdate(
          { _id: collectionId, creator: req.user._id },
          { $pull: { pins: pin._id } }
        );
      }

      await Promise.all([pin.save(), req.user.save()]);

      res.status(200).json({
        success: true,
        message: 'Pin removed from saved pins',
        isSaved: false,
        saveCount: pin.savedBy.length
      });
    } else {
      pin.savedBy.push(req.user._id);
      req.user.savedPins.push(pin._id);

      if (collectionId) {
        const collection = await Collection.findOne({ 
          _id: collectionId, 
          creator: req.user._id 
        });

        if (collection && !collection.pins.includes(pin._id)) {
          collection.pins.push(pin._id);
          await collection.save();
        }
      }

      await Promise.all([pin.save(), req.user.save()]);

      res.status(200).json({
        success: true,
        message: 'Pin saved successfully',
        isSaved: true,
        saveCount: pin.savedBy.length
      });
    }
  } catch (error) {
    next(error);
  }
};
