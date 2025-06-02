import UserCollection from '../models/collectionModel.js';

export const createCollection = async (req, res) => {
  try {
    const { name, description, coverImage, isPrivate } = req.body;
    const creator = req.user._id;  

    const newCollection = new UserCollection({
      name,
      description,
      coverImage,
      isPrivate,
      creator,
    });

    await newCollection.save();
    res.status(201).json(newCollection);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


export const getCollections = async (req, res) => {
  try {
    const collections = await Collection.find()
      .populate('creator', 'username email')
      .populate('collaborators', 'username email')
      .populate('pins');
    res.json(collections);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCollection = async (req, res) => {
  try {
    const collection = await UserCollection.findById(req.params.id)
      .populate('creator', 'username email')
      .populate('collaborators', 'username email')
      .populate('pins');
    if (!collection) return res.status(404).json({ message: 'Collection not found' });
    res.json(collection);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a collection (only owner or collaborators can update)
export const updateCollection = async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);
    if (!collection) return res.status(404).json({ message: 'Collection not found' });

    // check ownership (optional)
    if (collection.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this collection' });
    }

    const { name, description, coverImage, isPrivate } = req.body;
    if (name) collection.name = name;
    if (description) collection.description = description;
    if (coverImage) collection.coverImage = coverImage;
    if (isPrivate !== undefined) collection.isPrivate = isPrivate;

    await collection.save();
    res.json(collection);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a collection
export const deleteCollection = async (req, res) => {
  try {
    const collection = await UserCollection.findById(req.params.id);
    if (!collection) return res.status(404).json({ message: 'Collection not found' });

    if (collection.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this collection' });
    }

    await collection.remove();
    res.json({ message: 'Collection deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add a pin to collection
export const addPinToCollection = async (req, res) => {
  try {
    const collection = await UserCollection.findById(req.params.id);
    if (!collection) return res.status(404).json({ message: 'Collection not found' });

    const pinId = req.body.pinId;
    if (!collection.pins.includes(pinId)) {
      collection.pins.push(pinId);
      await collection.save();
    }

    res.json(collection);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Remove a pin from collection
export const removePinFromCollection = async (req, res) => {
  try {
    const collection = await UserCollection.findById(req.params.id);
    if (!collection) return res.status(404).json({ message: 'Collection not found' });

    const pinId = req.body.pinId;
    collection.pins = collection.pins.filter(pin => pin.toString() !== pinId);
    await collection.save();

    res.json(collection);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
