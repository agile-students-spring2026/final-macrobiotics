import mongoose from "mongoose";
import { bookmarkSchema } from "./Bookmark.js";
import {
  createDefaultPreferences,
  preferenceSchema,
} from "./Preference.js";

export { createDefaultPreferences };

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    preferences: {
      type: [preferenceSchema],
      default: createDefaultPreferences,
    },
    bookmarks: {
      type: [bookmarkSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
