import { expect } from "chai";
import request from "supertest";
import { app } from "../server.js";

function createJsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() {
      return body;
    },
  };
}

describe("Search API", () => {
  const originalFetch = global.fetch;
  const originalApiKey = process.env.SEATS_AERO_API;

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.SEATS_AERO_API = originalApiKey;
  });

  it("returns 400 when required query parameters are missing", async () => {
    process.env.SEATS_AERO_API = "test-key";

    const response = await request(app).get("/api/search/flights");

    expect(response.status).to.equal(400);
    expect(response.body.message).to.equal(
      "origin, destination, and date are required query parameters.",
    );
  });

  it("returns 500 when the Seats.aero API key is not configured", async () => {
    delete process.env.SEATS_AERO_API;

    const response = await request(app)
      .get("/api/search/flights")
      .query({ origin: "JFK", destination: "LHR", date: "2026-06-01" });

    expect(response.status).to.equal(500);
    expect(response.body.message).to.equal(
      "SEATS_AERO_API is not configured on the backend.",
    );
  });

  it("returns 400 for malformed airport codes or dates", async () => {
    process.env.SEATS_AERO_API = "test-key";

    const badAirportResponse = await request(app)
      .get("/api/search/flights")
      .query({ origin: "NEW YORK", destination: "LHR", date: "2026-06-01" });

    expect(badAirportResponse.status).to.equal(400);
    expect(badAirportResponse.body.message).to.equal(
      "origin and destination must be IATA airport codes such as JFK or LHR.",
    );

    const badDateResponse = await request(app)
      .get("/api/search/flights")
      .query({ origin: "JFK", destination: "LHR", date: "06/01/2026" });

    expect(badDateResponse.status).to.equal(400);
    expect(badDateResponse.body.message).to.equal(
      "date must use YYYY-MM-DD format.",
    );
  });

  it("normalizes Seats.aero search results into the frontend flight shape", async () => {
    process.env.SEATS_AERO_API = "test-key";
    global.fetch = async () =>
      createJsonResponse({
        data: [
          {
            ID: "avail-1",
            Source: "aeroplan",
            Date: "2026-06-01",
            Route: {
              OriginAirport: "JFK",
              DestinationAirport: "LHR",
            },
            YAvailable: true,
            YMileageCost: 45000,
            JAvailable: true,
            JMileageCost: 70000,
            Trips: [
              {
                Flights: [
                  {
                    Carrier: "AC",
                    FlightNumber: "861",
                    OriginAirport: "JFK",
                    DestinationAirport: "YYZ",
                    DepartsAt: "2026-06-01T08:30:00",
                    ArrivesAt: "2026-06-01T10:00:00",
                    DurationMinutes: 90,
                  },
                  {
                    Carrier: "AC",
                    FlightNumber: "856",
                    OriginAirport: "YYZ",
                    DestinationAirport: "LHR",
                    DepartsAt: "2026-06-01T11:30:00",
                    ArrivesAt: "2026-06-01T22:00:00",
                    DurationMinutes: 450,
                  },
                ],
              },
            ],
          },
        ],
      });

    const response = await request(app)
      .get("/api/search/flights")
      .query({ origin: "jfk", destination: "lhr", date: "2026-06-01" });

    expect(response.status).to.equal(200);
    expect(response.body.message).to.equal("Flights retrieved successfully");
    expect(response.body.data).to.have.length(2);

    const [economyResult, businessResult] = response.body.data;

    expect(economyResult).to.include({
      id: "avail-1:Y:0",
      depAirport: "JFK",
      arrAirport: "LHR",
      dep: "08:30",
      arr: "22:00",
      stops: 1,
      miles: 45000,
      class: "Economy",
      airline: "AC",
      flightNo: "AC861, AC856",
      seatAeroAvailabilityId: "avail-1",
      seatAeroSource: "aeroplan",
    });
    expect(economyResult.itinerary).to.have.length(2);
    expect(economyResult.itinerary[0].layover).to.equal("1h 30m in YYZ");

    expect(businessResult.id).to.equal("avail-1:J:0");
    expect(businessResult.class).to.equal("Business");
    expect(businessResult.miles).to.equal(70000);
  });

  it("prefers AvailabilityTrips mileage and duration from the real Seats.aero cached-search shape", async () => {
    process.env.SEATS_AERO_API = "test-key";
    global.fetch = async () =>
      createJsonResponse({
        data: [
          {
            ID: "avail-real-1",
            Source: "american",
            Date: "2026-05-15",
            Route: {
              OriginAirport: "JFK",
              DestinationAirport: "SFO",
            },
            YMileageCost: "19000",
            YAvailable: true,
            AvailabilityTrips: [
              {
                ID: "trip-1",
                MileageCost: 19000,
                TotalDuration: 574,
                Stops: 1,
                Carriers: "AA, AA",
                FlightNumbers: "AA1849, AA2907",
                OriginAirport: "JFK",
                DestinationAirport: "SFO",
                Connections: ["DFW"],
                DepartsAt: "2026-05-15T17:20:00Z",
                ArrivesAt: "2026-05-15T23:54:00Z",
                Cabin: "economy",
                Source: "american",
              },
              {
                ID: "trip-2",
                MileageCost: 95000,
                TotalDuration: 401,
                Stops: 0,
                Carriers: "AS",
                FlightNumbers: "AS29",
                OriginAirport: "JFK",
                DestinationAirport: "SFO",
                DepartsAt: "2026-05-15T18:35:00Z",
                ArrivesAt: "2026-05-15T22:16:00Z",
                Cabin: "business",
                Source: "american",
              },
            ],
          },
        ],
      });

    const response = await request(app)
      .get("/api/search/flights")
      .query({ origin: "JFK", destination: "SFO", date: "2026-05-15" });

    expect(response.status).to.equal(200);
    expect(response.body.data).to.have.length(2);

    expect(response.body.data[0]).to.include({
      id: "trip-1",
      depAirport: "JFK",
      arrAirport: "SFO",
      dep: "17:20",
      arr: "23:54",
      durationMin: 574,
      stops: 1,
      miles: 19000,
      class: "Economy",
      flightNo: "AA1849, AA2907",
      airline: "AA, AA",
      source: "american",
    });
    expect(response.body.data[0].connections).to.deep.equal(["DFW"]);
    expect(response.body.data[0].itinerary[0]).to.include({
      depA: "JFK",
      arrA: "SFO",
      dep: "17:20",
      arr: "23:54",
      dur: "9h 34m",
    });

    expect(response.body.data[1]).to.include({
      id: "trip-2",
      durationMin: 401,
      miles: 95000,
      class: "Business",
      flightNo: "AS29",
      airline: "AS",
      stops: 0,
    });
  });

  it("returns 502 when Seats.aero rejects the upstream request", async () => {
    process.env.SEATS_AERO_API = "test-key";
    global.fetch = async () =>
      createJsonResponse({ message: "upstream exploded" }, 503);

    const response = await request(app)
      .get("/api/search/flights")
      .query({ origin: "JFK", destination: "LHR", date: "2026-06-01" });

    expect(response.status).to.equal(502);
    expect(response.body.message).to.equal("upstream exploded");
  });
});
