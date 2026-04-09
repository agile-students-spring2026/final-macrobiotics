import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SEATS_AERO_BASE_URL = "https://seats.aero/partnerapi";
const SEARCH_RESULT_LIMIT = 250;
const AIRPORT_LIST_PATTERN = /^[A-Z]{3}(,[A-Z]{3})*$/u;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;

const CABIN_OPTIONS = [
  { code: "Y", key: "economy", label: "Economy" },
  { code: "W", key: "premium", label: "Premium Economy" },
  { code: "J", key: "business", label: "Business" },
  { code: "F", key: "first", label: "First" },
];

loadRootEnvFile();

function loadRootEnvFile() {
  if (process.env.SEATS_AERO_API) {
    return;
  }

  const currentFile = fileURLToPath(import.meta.url);
  const currentDir = path.dirname(currentFile);
  const rootEnvPath = path.resolve(currentDir, "..", ".env");

  if (!fs.existsSync(rootEnvPath)) {
    return;
  }

  const envFileContents = fs.readFileSync(rootEnvPath, "utf8");

  envFileContents.split(/\r?\n/u).forEach((line) => {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      return;
    }

    const separatorIndex = trimmedLine.indexOf("=");

    if (separatorIndex === -1) {
      return;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    let value = trimmedLine.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  });
}

function readPath(source, pathString) {
  return pathString.split(".").reduce((currentValue, segment) => {
    if (currentValue == null) {
      return undefined;
    }

    return currentValue[segment];
  }, source);
}

function getFirstValue(source, candidatePaths) {
  for (const candidatePath of candidatePaths) {
    const value = readPath(source, candidatePath);

    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return undefined;
}

function asArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  return value == null ? [] : [value];
}

function toNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const normalizedValue = Number(value);
    return Number.isFinite(normalizedValue) ? normalizedValue : undefined;
  }

  return undefined;
}

function toBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    if (value.toLowerCase() === "true") {
      return true;
    }

    if (value.toLowerCase() === "false") {
      return false;
    }
  }

  return undefined;
}

function normalizeAirportCode(value) {
  if (!value || typeof value !== "string") {
    return "";
  }

  return value.trim().toUpperCase();
}

function formatTime(value) {
  if (!value || typeof value !== "string") {
    return "";
  }

  const timeMatch = value.match(/(?:T|\s)(\d{2}:\d{2})/u) ?? value.match(/^(\d{2}:\d{2})/u);
  return timeMatch ? timeMatch[1] : value;
}

function formatDate(value) {
  if (!value || typeof value !== "string") {
    return "";
  }

  const dateMatch = value.match(/^(\d{4}-\d{2}-\d{2})/u);
  return dateMatch ? dateMatch[1] : value;
}

function parseTimestamp(value) {
  if (!value || typeof value !== "string") {
    return undefined;
  }

  const parsedValue = Date.parse(value);
  return Number.isFinite(parsedValue) ? parsedValue : undefined;
}

function minutesBetween(startValue, endValue) {
  const startTimestamp = parseTimestamp(startValue);
  const endTimestamp = parseTimestamp(endValue);

  if (
    !Number.isFinite(startTimestamp) ||
    !Number.isFinite(endTimestamp) ||
    endTimestamp < startTimestamp
  ) {
    return undefined;
  }

  return Math.round((endTimestamp - startTimestamp) / 60000);
}

function formatDurationFromMinutes(minutes) {
  if (!Number.isFinite(minutes)) {
    return "";
  }

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  if (remainder === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainder}m`;
}

function titleCase(value) {
  if (!value || typeof value !== "string") {
    return "";
  }

  return value
    .split(/[\s_-]+/u)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function normalizeCabinLabel(value) {
  if (!value || typeof value !== "string") {
    return "";
  }

  const normalizedValue = value.trim().toLowerCase();

  return (
    CABIN_OPTIONS.find(
      ({ key, label, code }) =>
        normalizedValue === key ||
        normalizedValue === label.toLowerCase() ||
        normalizedValue === code.toLowerCase(),
    )?.label ?? titleCase(value)
  );
}

function normalizeCabinOptions(availability) {
  const cabinResults = CABIN_OPTIONS.flatMap((cabinOption) => {
    const mileage = toNumber(
      getFirstValue(availability, [
        `${cabinOption.code}MileageCost`,
        `${cabinOption.code.toLowerCase()}MileageCost`,
        `cabinPricing.${cabinOption.key}.mileageCost`,
        `cabins.${cabinOption.key}.mileageCost`,
        `cabins.${cabinOption.key}.miles`,
      ]),
    );

    const available = toBoolean(
      getFirstValue(availability, [
        `${cabinOption.code}Available`,
        `${cabinOption.code.toLowerCase()}Available`,
        `cabinPricing.${cabinOption.key}.available`,
        `cabins.${cabinOption.key}.available`,
      ]),
    );

    const trips = asArray(
      getFirstValue(availability, [
        `${cabinOption.code}Trips`,
        `${cabinOption.code.toLowerCase()}Trips`,
        `cabinTrips.${cabinOption.key}`,
        `cabins.${cabinOption.key}.trips`,
      ]),
    );

    if (!available && !Number.isFinite(mileage) && trips.length === 0) {
      return [];
    }

    return [
      {
        code: cabinOption.code,
        label: cabinOption.label,
        mileage,
        trips,
      },
    ];
  });

  if (cabinResults.length > 0) {
    return cabinResults;
  }

  const genericTrips = asArray(getFirstValue(availability, ["Trips", "trips"]));
  const genericMileage = toNumber(
    getFirstValue(availability, ["MileageCost", "mileageCost", "Miles", "miles"]),
  );
  const genericCabin = normalizeCabinLabel(
    getFirstValue(availability, ["Cabin", "cabin", "class", "travelClass"]) ??
      "Award",
  );

  if (!Number.isFinite(genericMileage) && genericTrips.length === 0) {
    return [];
  }

  return [
    {
      code: genericCabin.toLowerCase().replace(/\s+/gu, "-"),
      label: genericCabin,
      mileage: genericMileage,
      trips: genericTrips,
    },
  ];
}

function normalizeSegment(segment) {
  const departureAirport = normalizeAirportCode(
    getFirstValue(segment, [
      "depA",
      "DepA",
      "originAirport",
      "OriginAirport",
      "departureAirport",
      "DepartureAirport",
      "origin.code",
      "Origin.Code",
    ]),
  );

  const arrivalAirport = normalizeAirportCode(
    getFirstValue(segment, [
      "arrA",
      "ArrA",
      "destinationAirport",
      "DestinationAirport",
      "arrivalAirport",
      "ArrivalAirport",
      "destination.code",
      "Destination.Code",
    ]),
  );

  const departureTimestamp = getFirstValue(segment, [
    "DepartsAt",
    "departsAt",
    "DepartureTime",
    "departureTime",
    "departure",
    "dep",
  ]);

  const arrivalTimestamp = getFirstValue(segment, [
    "ArrivesAt",
    "arrivesAt",
    "ArrivalTime",
    "arrivalTime",
    "arrival",
    "arr",
  ]);

  const marketingCarrier =
    getFirstValue(segment, [
      "Carrier",
      "carrier",
      "MarketingCarrier",
      "marketingCarrier",
      "Airline",
      "airline",
    ]) ?? "";

  const flightNumberValue = getFirstValue(segment, [
    "FlightNumber",
    "flightNumber",
    "Number",
    "number",
    "flightNo",
  ]);

  const durationMinutes =
    toNumber(
      getFirstValue(segment, [
        "DurationMinutes",
        "durationMinutes",
        "DurationMin",
        "durationMin",
      ]),
    ) ?? minutesBetween(departureTimestamp, arrivalTimestamp);

  const formattedFlightNumber =
    typeof flightNumberValue === "string" &&
    flightNumberValue.toUpperCase().startsWith(marketingCarrier.toUpperCase())
      ? flightNumberValue
      : `${marketingCarrier}${flightNumberValue ?? ""}`.trim();

  return {
    depA: departureAirport,
    dep: formatTime(departureTimestamp),
    arrA: arrivalAirport,
    arr: formatTime(arrivalTimestamp),
    dur:
      getFirstValue(segment, ["dur", "Dur", "duration"]) ??
      formatDurationFromMinutes(durationMinutes),
    layover: undefined,
    airline: marketingCarrier,
    flightNo: formattedFlightNumber,
    departureTimestamp,
    arrivalTimestamp,
    durationMinutes,
  };
}

function normalizeTrip(trip, fallbackValues = {}) {
  const rawSegments = asArray(
    getFirstValue(trip, ["Flights", "flights", "Segments", "segments", "itinerary"]),
  );

  const itinerary = rawSegments
    .map((segment) => normalizeSegment(segment))
    .filter((segment) => segment.depA || segment.arrA || segment.dep || segment.arr);

  for (let index = 0; index < itinerary.length - 1; index += 1) {
    const currentSegment = itinerary[index];
    const nextSegment = itinerary[index + 1];
    const layoverMinutes = minutesBetween(
      getFirstValue(rawSegments[index], [
        "ArrivesAt",
        "arrivesAt",
        "ArrivalTime",
        "arrivalTime",
        "arrival",
        "arr",
      ]),
      getFirstValue(rawSegments[index + 1], [
        "DepartsAt",
        "departsAt",
        "DepartureTime",
        "departureTime",
        "departure",
        "dep",
      ]),
    );

    if (Number.isFinite(layoverMinutes)) {
      currentSegment.layover = `${formatDurationFromMinutes(layoverMinutes)} in ${currentSegment.arrA}`;
    }
  }

  const firstSegment = itinerary[0];
  const lastSegment = itinerary[itinerary.length - 1];

  const departureTimestamp =
    getFirstValue(trip, [
      "DepartsAt",
      "departsAt",
      "DepartureTime",
      "departureTime",
    ]) ??
    getFirstValue(rawSegments[0], [
      "DepartsAt",
      "departsAt",
      "DepartureTime",
      "departureTime",
      "departure",
      "dep",
    ]);

  const arrivalTimestamp =
    getFirstValue(trip, [
      "ArrivesAt",
      "arrivesAt",
      "ArrivalTime",
      "arrivalTime",
    ]) ??
    getFirstValue(rawSegments[rawSegments.length - 1], [
      "ArrivesAt",
      "arrivesAt",
      "ArrivalTime",
      "arrivalTime",
      "arrival",
      "arr",
    ]);

  const durationMinutes =
    toNumber(
      getFirstValue(trip, [
        "DurationMinutes",
        "durationMinutes",
        "DurationMin",
        "durationMin",
        "TotalDurationMinutes",
      ]),
    ) ?? minutesBetween(departureTimestamp, arrivalTimestamp);

  const flightNumbers = itinerary
    .map((segment) => segment.flightNo)
    .filter(Boolean)
    .join(", ");

  return {
    depAirport:
      firstSegment?.depA ?? fallbackValues.depAirport ?? fallbackValues.originAirport ?? "",
    arrAirport:
      lastSegment?.arrA ??
      fallbackValues.arrAirport ??
      fallbackValues.destinationAirport ??
      "",
    dep: firstSegment?.dep ?? formatTime(departureTimestamp),
    arr: lastSegment?.arr ?? formatTime(arrivalTimestamp),
    durationMin: durationMinutes ?? fallbackValues.durationMin ?? 0,
    stops:
      toNumber(getFirstValue(trip, ["Stops", "stops", "StopCount", "stopCount"])) ??
      Math.max(itinerary.length - 1, 0),
    flightNo: flightNumbers || fallbackValues.flightNo || "",
    airline:
      getFirstValue(trip, ["Airline", "airline", "Carrier", "carrier"]) ??
      firstSegment?.airline ??
      fallbackValues.airline ??
      "",
    itinerary: itinerary.map(({ departureTimestamp, arrivalTimestamp, durationMinutes: _minutes, airline: _airline, ...segment }) => segment),
    travelDate:
      formatDate(
        getFirstValue(trip, ["Date", "date", "DepartsAt", "departsAt"]) ??
          fallbackValues.travelDate,
      ) || fallbackValues.travelDate,
  };
}

function extractAvailabilityResults(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  return asArray(
    getFirstValue(payload, [
      "data",
      "results",
      "items",
      "availability",
      "Availability",
    ]),
  );
}

function normalizeAvailability(availability) {
  const availabilityId = String(
    getFirstValue(availability, ["ID", "id", "availabilityId"]) ??
      `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );

  const originAirport = normalizeAirportCode(
    getFirstValue(availability, [
      "Route.OriginAirport",
      "route.originAirport",
      "originAirport",
      "OriginAirport",
    ]),
  );

  const destinationAirport = normalizeAirportCode(
    getFirstValue(availability, [
      "Route.DestinationAirport",
      "route.destinationAirport",
      "destinationAirport",
      "DestinationAirport",
    ]),
  );

  const source = getFirstValue(availability, ["Source", "source"]) ?? "";
  const travelDate = formatDate(
    getFirstValue(availability, ["Date", "date", "DepartureDate", "departureDate"]),
  );
  const cabinOptions = normalizeCabinOptions(availability);

  const fallbackTripValues = {
    originAirport,
    destinationAirport,
    travelDate,
  };

  const genericTrips = asArray(getFirstValue(availability, ["Trips", "trips"]));

  return cabinOptions.flatMap((cabinOption) => {
    const tripsToNormalize =
      cabinOption.trips.length > 0 ? cabinOption.trips : genericTrips;

    const normalizedTrips = (
      tripsToNormalize.length > 0 ? tripsToNormalize : [availability]
    )
      .map((trip) => normalizeTrip(trip, fallbackTripValues))
      .filter(
        (trip) =>
          trip.depAirport ||
          trip.arrAirport ||
          trip.dep ||
          trip.arr ||
          trip.itinerary.length > 0,
      );

    return normalizedTrips.map((trip, tripIndex) => ({
      id: `${availabilityId}:${cabinOption.code}:${tripIndex}`,
      seatAeroAvailabilityId: availabilityId,
      seatAeroSource: source,
      airline: trip.airline || titleCase(source) || "Seats.aero",
      flightNo: trip.flightNo || titleCase(source),
      depAirport: trip.depAirport || originAirport,
      arrAirport: trip.arrAirport || destinationAirport,
      dep: trip.dep,
      arr: trip.arr,
      durationMin: trip.durationMin,
      stops: trip.stops,
      miles: cabinOption.mileage ?? 0,
      logoUrl: "",
      class: cabinOption.label,
      itinerary: trip.itinerary,
      travelDate: trip.travelDate || travelDate,
      source,
    }));
  });
}

export function normalizeSeatsAeroResults(payload) {
  return extractAvailabilityResults(payload)
    .flatMap((availability) => normalizeAvailability(availability))
    .filter(
      (flight) =>
        flight.depAirport &&
        flight.arrAirport &&
        Number.isFinite(flight.miles) &&
        flight.miles >= 0,
    );
}

export function buildSeatsAeroSearchParams({ origin, destination, date }) {
  const queryParams = new URLSearchParams({
    origin_airport: normalizeAirportCode(origin),
    destination_airport: normalizeAirportCode(destination),
    start_date: date,
    end_date: date,
    take: String(SEARCH_RESULT_LIMIT),
    order_by: "lowest_mileage",
    include_trips: "true",
    include_filtered: "false",
  });

  return queryParams;
}

export async function searchSeatsAeroFlights(
  { origin, destination, date },
  fetchImplementation = fetch,
) {
  const apiKey = process.env.SEATS_AERO_API?.trim();

  if (!apiKey) {
    const configurationError = new Error(
      "SEATS_AERO_API is not configured on the backend.",
    );
    configurationError.statusCode = 500;
    throw configurationError;
  }

  const normalizedOrigin = normalizeAirportCode(origin);
  const normalizedDestination = normalizeAirportCode(destination);

  if (!normalizedOrigin || !normalizedDestination || !date) {
    const validationError = new Error(
      "origin, destination, and date are required query parameters.",
    );
    validationError.statusCode = 400;
    throw validationError;
  }

  if (
    !AIRPORT_LIST_PATTERN.test(normalizedOrigin) ||
    !AIRPORT_LIST_PATTERN.test(normalizedDestination)
  ) {
    const validationError = new Error(
      "origin and destination must be IATA airport codes such as JFK or LHR.",
    );
    validationError.statusCode = 400;
    throw validationError;
  }

  if (!DATE_PATTERN.test(date)) {
    const validationError = new Error(
      "date must use YYYY-MM-DD format.",
    );
    validationError.statusCode = 400;
    throw validationError;
  }

  const endpoint = `${SEATS_AERO_BASE_URL}/search?${buildSeatsAeroSearchParams({
    origin: normalizedOrigin,
    destination: normalizedDestination,
    date,
  }).toString()}`;

  const response = await fetchImplementation(endpoint, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Partner-Authorization": apiKey,
    },
  });

  let responseBody = null;

  try {
    responseBody = await response.json();
  } catch {
    responseBody = null;
  }

  if (!response.ok) {
    const upstreamError = new Error(
      responseBody?.message ?? "Seats.aero search request failed.",
    );
    upstreamError.statusCode = response.status >= 400 && response.status < 500 ? 400 : 502;
    throw upstreamError;
  }

  return normalizeSeatsAeroResults(responseBody);
}
