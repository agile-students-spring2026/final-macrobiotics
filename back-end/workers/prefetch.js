import cron from "node-cron";
import { ensureRedisConnection } from "../config/redis.js";
import { normalizeSeatsAeroResults } from "../seatsAero.js";
import { getTopSearchedRoutes } from "../repositories/searchRepository.js";

const SEATS_AERO_BASE_URL = "https://seats.aero/partnerapi/search?";
const isTestRun =
  process.env.NODE_ENV === "test" || process.env.npm_lifecycle_event === "test";
const log = (...args) => {
  if (!isTestRun) {
    console.log(...args);
  }
};

const getFormattedDate = (daysToAdd) => {
  const date = new Date();
  date.setDate(date.getDate() + daysToAdd);
  return date.toISOString().split("T")[0];
};

const getFallbackSearchTargets = () => {
  const staticOrigins = ["JFK", "EWR", "LAX", "SFO", "ORD", "ATL"];
  const staticDestinations = ["LHR", "HND", "CDG", "FRA", "IST", "SIN"];

  return [
    {
      origin: staticOrigins.join(","),
      destination: staticDestinations.join(","),
      startDate: getFormattedDate(0),
      endDate: getFormattedDate(30),
    },
  ];
};

export const getPrefetchTargets = async () => {
  try {
    const topRoutes = await getTopSearchedRoutes({
      limit: 12,
      lookbackDays: 30,
    });

    if (topRoutes.length > 0) {
      return topRoutes.map((route) => ({
        origin: route.origin,
        destination: route.destination,
        startDate: getFormattedDate(0),
        endDate: getFormattedDate(30),
      }));
    }
  } catch (_error) {}

  return getFallbackSearchTargets();
};

export const buildSearchUrl = ({ origin, destination, startDate, endDate }) => {
  const queryParams = new URLSearchParams({
    origin_airport: origin,
    destination_airport: destination,
    start_date: startDate,
    end_date: endDate,
    take: 500,
    order_by: "lowest_mileage",
    include_trips: "true",
    include_filtered: "false",
  });

  return SEATS_AERO_BASE_URL + queryParams.toString();
};

export const runPrefetchJob = async () => {
  const jobStartTime = Date.now();
  log(new Date().toISOString(), "Running prefetch job...");

  try {
    const apiKey = process.env.SEATS_AERO_API?.trim();
    if (!apiKey) {
      throw new Error("API key not found.");
    }

    const flightsByKey = {};
    const cacheClient = await ensureRedisConnection();
    const prefetchTargets = await getPrefetchTargets();

    if (!cacheClient) {
      throw new Error("REDIS_URL is not configured on the backend.");
    }

    for (const prefetchTarget of prefetchTargets) {
      const requestUrl = buildSearchUrl(prefetchTarget);
      const response = await fetch(requestUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Partner-Authorization": apiKey,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`API request failed: ${data.message}`);
      }

      const flights = normalizeSeatsAeroResults(data);

      for (const flight of flights) {
        const cacheKey = `search:${flight.depAirport}:${flight.arrAirport}:${flight.travelDate}`;
        if (!flightsByKey[cacheKey]) {
          flightsByKey[cacheKey] = [];
        }
        flightsByKey[cacheKey].push(flight);
      }
    }

    for (const [key, flightsArray] of Object.entries(flightsByKey)) {
      await cacheClient.setEx(key, 1200, JSON.stringify(flightsArray));
    }

    const duration = Date.now() - jobStartTime;
    const routeCount = Object.keys(flightsByKey).length;

    log(`Cached ${routeCount} unique routes in ${duration}ms.`);
  } catch (error) {
    log("Job failed with", error);
  }
};

export const startPrefetchJob = async () => {
  if (process.argv.includes("--prefetch")) {
    log("flag --prefetch: Populating cache...");
    runPrefetchJob();
    cron.schedule("*/20 * * * *", runPrefetchJob);
  }
};
