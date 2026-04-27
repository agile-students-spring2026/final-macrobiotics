import { isDatabaseConnected } from "../config/database.js";
import SearchHistory from "../models/SearchHistory.js";

const IATA_CODE_PATTERN = /^[A-Z]{3}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const normalizeAirportCode = (value) =>
  String(value ?? "")
    .trim()
    .toUpperCase();

export const logSearchHistory = async ({
  origin,
  destination,
  travelDate,
  searchedAt = new Date(),
}) => {
  if (!isDatabaseConnected()) {
    return null;
  }

  const normalizedOrigin = normalizeAirportCode(origin);
  const normalizedDestination = normalizeAirportCode(destination);

  if (
    !IATA_CODE_PATTERN.test(normalizedOrigin) ||
    !IATA_CODE_PATTERN.test(normalizedDestination) ||
    !DATE_PATTERN.test(String(travelDate ?? "").trim())
  ) {
    return null;
  }

  return SearchHistory.create({
    origin: normalizedOrigin,
    destination: normalizedDestination,
    travelDate: String(travelDate).trim(),
    searchedAt,
  });
};

export const getTopSearchedRoutes = async ({
  limit = 12,
  lookbackDays = 30,
} = {}) => {
  if (!isDatabaseConnected()) {
    return [];
  }

  const parsedLimit = Number(limit);
  const parsedLookbackDays = Number(lookbackDays);
  const safeLimit =
    Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 12;
  const safeLookbackDays =
    Number.isFinite(parsedLookbackDays) && parsedLookbackDays > 0
      ? parsedLookbackDays
      : 30;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - safeLookbackDays);

  const results = await SearchHistory.aggregate([
    { $match: { searchedAt: { $gte: cutoffDate } } },
    {
      $group: {
        _id: {
          origin: "$origin",
          destination: "$destination",
        },
        count: { $sum: 1 },
        lastSearchedAt: { $max: "$searchedAt" },
      },
    },
    { $sort: { count: -1, lastSearchedAt: -1 } },
    { $limit: safeLimit },
  ]);

  return results.map((row) => ({
    origin: row._id.origin,
    destination: row._id.destination,
    count: row.count,
    lastSearchedAt: row.lastSearchedAt,
  }));
};
