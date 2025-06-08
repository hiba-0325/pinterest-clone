import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

 
// Store connected users
const connectedUsers = new Map();

const InstanceSocket = (io) => {
  // Authentication middleware for Socket.io
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: Token not provided'));
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
      
      // Attach user to socket
      socket.user = {
        id: user._id,
        username: user.username
      };
      
      next();
    } catch (error) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.username} (${socket.user.id})`);
    
    // Add user to connected users map
    connectedUsers.set(socket.user.id.toString(), socket.id);
    
    // Join user to their personal room for private messages
    socket.join(`user:${socket.user.id}`);
    
    // Handle pin like
    socket.on('pin:like', (data) => {
      const { pinId, pinCreatorId } = data;
      
      // Emit to pin creator if they're online
      if (pinCreatorId && connectedUsers.has(pinCreatorId.toString())) {
        io.to(`user:${pinCreatorId}`).emit('notification:new', {
          type: 'like',
          pinId,
          sender: {
            id: socket.user.id,
            username: socket.user.username
          },
          message: `${socket.user.username} liked your pin`
        });
      }
      
      // Broadcast to users viewing the pin
      socket.to(`pin:${pinId}`).emit('pin:liked', {
        pinId,
        userId: socket.user.id,
        username: socket.user.username
      });
    });
    
    // Handle pin comment
    socket.on('pin:comment', (data) => {
      const { pinId, pinCreatorId, comment } = data;
      
      // Emit to pin creator if they're online
      if (pinCreatorId && connectedUsers.has(pinCreatorId.toString())) {
        io.to(`user:${pinCreatorId}`).emit('notification:new', {
          type: 'comment',
          pinId,
          sender: {
            id: socket.user.id,
            username: socket.user.username
          },
          message: `${socket.user.username} commented on your pin: "${comment.substring(0, 30)}${comment.length > 30 ? '...' : ''}"`
        });
      }
      
      // Broadcast to users viewing the pin
      socket.to(`pin:${pinId}`).emit('pin:commented', {
        pinId,
        comment,
        userId: socket.user.id,
        username: socket.user.username
      });
    });
    
    // Handle pin save
    socket.on('pin:save', (data) => {
      const { pinId, pinCreatorId, collectionId, collectionName } = data;
      
      // Emit to pin creator if they're online
      if (pinCreatorId && connectedUsers.has(pinCreatorId.toString())) {
        io.to(`user:${pinCreatorId}`).emit('notification:new', {
          type: 'save',
          pinId,
          sender: {
            id: socket.user.id,
            username: socket.user.username
          },
          message: collectionName 
            ? `${socket.user.username} saved your pin to "${collectionName}"`
            : `${socket.user.username} saved your pin`
        });
      }
    });
    
    // Handle user following another user
    socket.on('user:follow', (data) => {
      const { followedUserId } = data;
      
      // Emit to followed user if they're online
      if (followedUserId && connectedUsers.has(followedUserId.toString())) {
        io.to(`user:${followedUserId}`).emit('notification:new', {
          type: 'follow',
          sender: {
            id: socket.user.id,
            username: socket.user.username
          },
          message: `${socket.user.username} started following you`
        });
      }
    });
    
    // Join pin room when viewing a pin
    socket.on('pin:view', (pinId) => {
      socket.join(`pin:${pinId}`);
    });
    
    // Leave pin room when no longer viewing a pin
    socket.on('pin:leave', (pinId) => {
      socket.leave(`pin:${pinId}`);
    });
    
    // Handle private messages (chat)
    socket.on('chat:message', (data) => {
      const { recipientId, message } = data;
      
      if (recipientId && connectedUsers.has(recipientId.toString())) {
        io.to(`user:${recipientId}`).emit('chat:message', {
          senderId: socket.user.id,
          senderUsername: socket.user.username,
          message,
          timestamp: new Date()
        });
      }
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.username} (${socket.user.id})`);
      
      // Remove user from connected users map
      connectedUsers.delete(socket.user.id.toString());
    });
  });
};

export default InstanceSocket;