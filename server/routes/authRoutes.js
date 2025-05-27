import express from 'express';
import {
  register,
  login,
  getCurrentUser,
  updateProfile,
  updatePassword
} from '../controllers/authController.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router()

// Public routes
.post('/register', register)
.post('/login', login)

// Protected routes
.get('/me', isAuthenticated, getCurrentUser)
.put('/update-profile', isAuthenticated, updateProfile)
.put('/update-password', isAuthenticated, updatePassword)

export default router;
