import express from "express";
import { isAuthenticated } from "../middleware/auth.js";
import upload from "../middleware/multer.js";

import {
  createPin,
  getPins,
  getPin,
  updatePin,
  deletePin,
  toggleLike,
  toggleSave,
} from "../controllers/pinController.js";

const router = express
  .Router()

  .post("/", isAuthenticated, upload.single("image"), createPin)

  .get("/", getPins)

  .get("/:id", isAuthenticated, getPin)

  .put("/:id", isAuthenticated, updatePin)

  .delete("/:id", isAuthenticated, deletePin)

  .patch("/:id/like", isAuthenticated, toggleLike)

  .patch("/:id/save", isAuthenticated, toggleSave);

export default router;
