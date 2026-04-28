import mongoose from "mongoose";

const searchHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    origin: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 3,
    },
    destination: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 3,
    },
    travelDate: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    searchedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  },
);

searchHistorySchema.index({ searchedAt: -1 });
searchHistorySchema.index(
  { searchedAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 30 },
);
searchHistorySchema.index({
  origin: 1,
  destination: 1,
  travelDate: 1,
  searchedAt: -1,
});

const SearchHistory =
  mongoose.models.SearchHistory ||
  mongoose.model("SearchHistory", searchHistorySchema, "searchHistory");

export default SearchHistory;
