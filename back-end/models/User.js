import mongoose from "mongoose";
import { bookmarkSchema } from "./Bookmark.js";
import { createDefaultPreferences, preferenceSchema } from "./Preference.js";

export { createDefaultPreferences };

const recentSearchSchema = new mongoose.Schema(
  {
    origin: { type: String, required: true, uppercase: true, trim: true },
    destination: { type: String, required: true, uppercase: true, trim: true },
    travelDate: { type: String, required: true },
    tripType: { type: String, default: "One-way" },
    cabin: { type: String, default: "Any Cabin" },
    preferredAirline: { type: String, default: "Any Airline" },
    travelers: { type: Number, default: 1 },
    milesRange: { type: String, default: "Any" },
    searchedAt: { type: String, required: true },
  },
  { _id: false, versionKey: false },
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
    recentSearches: {
      type: [recentSearchSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
