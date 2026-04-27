import mongoose from "mongoose";
import { bookmarkSchema } from "./Bookmark.js";

export const DEFAULT_PREFERENCES = Object.freeze([
  { id: "airport", label: "Default Airport", value: "JFK" },
  { id: "airline", label: "Default Airline", value: "Delta" },
  {
    id: "card",
    label: "Default Credit Card",
    value: "Chase Sapphire Preferred",
  },
]);

export const createDefaultPreferences = () =>
  DEFAULT_PREFERENCES.map((preference) => ({ ...preference }));

const preferenceSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    value: { type: String, default: "" },
  },
  { _id: false },
);

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
