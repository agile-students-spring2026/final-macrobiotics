import mongoose from "mongoose";

export const DEFAULT_PREFERENCES = Object.freeze([
  { id: "airport", label: "Default Airport", value: "JFK" },
  { id: "airline", label: "Default Airline", value: "Delta" },
  { id: "card", label: "Default Credit Card", value: "Chase Sapphire Preferred" },
]);

export const createDefaultPreferences = () =>
  DEFAULT_PREFERENCES.map((preference) => ({ ...preference }));

export const preferenceSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    value: { type: String, default: "" },
  },
  { _id: false },
);

export default mongoose.models.Preference ||
  mongoose.model("Preference", preferenceSchema);
