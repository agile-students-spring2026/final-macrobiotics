import cron from "node-cron";
import redisClient from "../config/redis.js";
import { normalizeSeatsAeroResults } from "../seatsAero.js";
//TODO: Import mongoose model for search history

const SEATS_AERO_BASE_URL = "https://seats.aero/partnerapi/search?";

const getFormattedDate = (daysToAdd) => {
  const date = new Date();
  date.setDate(date.getDate() + daysToAdd);
  return date.toISOString().split("T")[0];
};

const getTargetAirports = async () => {
  const staticOrigins = ["JFK", "EWR", "LAX", "SFO", "ORD", "ATL"];
  const staticDestinations = ["LHR", "HND", "CDG", "FRA", "IST", "SIN"];

  //TODO: Aggregate most frequently searched nodes from Mongo collection
  let dynamicOrigins = [];
  let dynamicDestinations = [];

  const originsToCache = [...new Set([...staticOrigins, ...dynamicOrigins])];
  const destinationsToCache = [
    ...new Set([...staticDestinations, ...dynamicDestinations]),
  ];

  return { origins: originsToCache, destinations: destinationsToCache };
};

const buildSearchUrl = ({ origin, destination, startDate, endDate }) => {
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

const runPrefetchJob = async () => {
  const jobStartTime = Date.now();
  console.log(new Date().toISOString(), "Running prefetch job...");

  try {
    const apiKey = process.env.SEATS_AERO_API?.trim();
    if (!apiKey) {
      throw new Error("API key not found.");
    }

    let { origins, destinations } = await getTargetAirports();
    origins = origins.join(",");
    destinations = destinations.join(",");

    const startDate = getFormattedDate(0);
    const endDate = getFormattedDate(30);

    const requestUrl = buildSearchUrl({
      origin: origins,
      destination: destinations,
      startDate,
      endDate,
    });

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
    const flightsByKey = {};

    for (const flight of flights) {
      const cacheKey = `search:${flight.depAirport}:${flight.arrAirport}:${flight.travelDate}`;
      if (!flightsByKey[cacheKey]) {
        flightsByKey[cacheKey] = [];
      }
      flightsByKey[cacheKey].push(flight);
    }

    for (const [key, flightsArray] of Object.entries(flightsByKey)) {
      await redisClient.setEx(key, 1200, JSON.stringify(flightsArray));
    }

    const duration = Date.now() - jobStartTime;
    const routeCount = Object.keys(flightsByKey).length;

    console.log(`Cached ${routeCount} unique routes in ${duration}ms.`);
  } catch (error) {
    console.log("Job failed with", error);
  }
};

export const startPrefetchJob = async () => {
  //Run immediately on server start
  runPrefetchJob();

  cron.schedule("*/20 * * * *", runPrefetchJob);
};
