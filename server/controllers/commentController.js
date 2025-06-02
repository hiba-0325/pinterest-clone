import Comment from '../models/commentModel.js';


export const createComment = async (req, res) => {
  try {
    const { content, pin, parentComment } = req.body;
    const user = req.user._id;

    const newComment = new Comment({
      content,
      pin,
      user,
      parentComment: parentComment || null,
    });

    await newComment.save();

  
    if (parentComment) {
      const parent = await Comment.findById(parentComment);
      if (parent) {
        parent.replies.push(newComment._id);
        await parent.save();
      }
    }

    res.status(201).json(newComment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


export const getCommentsByPin = async (req, res) => {
  try {
    const comments = await Comment.find({ pin: req.params.pinId, parentComment: null })
      .populate('user', 'username email')
      .populate({
        path: 'replies',
        populate: { path: 'user', select: 'username email' }
      });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const updateComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this comment' });
    }

    comment.content = req.body.content || comment.content;
    await comment.save();

    res.json(comment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    // If this comment is a reply, remove its ID from parent replies array
    if (comment.parentComment) {
      const parent = await Comment.findById(comment.parentComment);
      if (parent) {
        parent.replies = parent.replies.filter(
          replyId => replyId.toString() !== comment._id.toString()
        );
        await parent.save();
      }
    }

    await comment.remove();
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const toggleLikeComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const userId = req.user._id.toString();
    if (comment.likes.includes(userId)) {
      comment.likes = comment.likes.filter(id => id.toString() !== userId);
    } else {
      comment.likes.push(userId);
    }
    await comment.save();

    res.json(comment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
