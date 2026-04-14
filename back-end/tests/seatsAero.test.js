import { expect } from "chai";
import {
  buildSeatsAeroSearchParams,
  getSeatsAeroTripDetail,
  normalizeAirportCode,
  normalizeSeatsAeroResults,
  searchSeatsAeroFlights,
  validateSearchParams,
} from "../seatsAero.js";

function createJsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() {
      return body;
    },
  };
}

describe("seatsAero.js", () => {
  const originalApiKey = process.env.SEATS_AERO_API;
  const originalConsoleError = console.error;

  afterEach(() => {
    process.env.SEATS_AERO_API = originalApiKey;
    console.error = originalConsoleError;
  });

  describe("normalizeAirportCode()", () => {
    it("uppercases and trims valid codes and returns an empty string for invalid input", () => {
      expect(normalizeAirportCode(" jfk ")).to.equal("JFK");
      expect(normalizeAirportCode("")).to.equal("");
      expect(normalizeAirportCode(null)).to.equal("");
    });
  });

  describe("validateSearchParams()", () => {
    it("accepts comma-delimited airport lists and normalizes casing", () => {
      expect(
        validateSearchParams("jfk,ewr", "lhr,cdg", "2026-06-01"),
      ).to.deep.equal({
        normalizedOrigin: "JFK,EWR",
        normalizedDestination: "LHR,CDG",
      });
    });
  });

  describe("buildSeatsAeroSearchParams()", () => {
    it("builds normalized cached-search query params", () => {
      const params = buildSeatsAeroSearchParams({
        origin: "jfk",
        destination: "sfo",
        date: "2026-07-04",
      });

      expect(params.get("origin_airport")).to.equal("JFK");
      expect(params.get("destination_airport")).to.equal("SFO");
      expect(params.get("start_date")).to.equal("2026-07-04");
      expect(params.get("end_date")).to.equal("2026-07-04");
      expect(params.get("take")).to.equal("250");
      expect(params.get("include_trips")).to.equal("true");
      expect(params.get("include_filtered")).to.equal("false");
    });
  });

  describe("normalizeSeatsAeroResults()", () => {
    it("normalizes generic payloads with synthetic itineraries, fallback labels, and alternate payload roots", () => {
      const results = normalizeSeatsAeroResults({
        results: [
          {
            id: "avail-generic",
            source: "united-airlines",
            departureDate: "2026-07-04",
            originAirport: "ewr",
            destinationAirport: "nrt",
            mileageCost: "88000",
            travelClass: "first",
            trips: [],
            departsAt: "2026-07-04T09:15:00Z",
            arrivesAt: "2026-07-05T13:30:00Z",
            flightNo: "UA79",
          },
        ],
      });

      expect(results).to.have.length(1);
      expect(results[0]).to.include({
        id: "avail-generic:first:0",
        depAirport: "EWR",
        arrAirport: "NRT",
        dep: "09:15",
        arr: "13:30",
        miles: 88000,
        class: "First",
        airline: "United Airlines",
        flightNo: "UA79",
        travelDate: "2026-07-04",
        source: "united-airlines",
      });
      expect(results[0].durationMin).to.equal(1695);
      expect(results[0].itinerary).to.deep.equal([
        {
          depA: "EWR",
          dep: "09:15",
          arrA: "NRT",
          arr: "13:30",
          dur: "28h 15m",
        },
      ]);
    });

    it("supports nested cabin pricing, segment aliases, fallback miles, and payload arrays", () => {
      const results = normalizeSeatsAeroResults([
        {
          availabilityId: "avail-cabins",
          source: "delta",
          Date: "2026-09-10",
          Route: {
            OriginAirport: "bos",
            DestinationAirport: "fco",
          },
          cabins: {
            premium: {
              miles: "47000",
              available: "true",
              trips: [
                {
                  segments: [
                    {
                      origin: { code: "bos" },
                      destination: { code: "jfk" },
                      departure: "2026-09-10T06:00:00Z",
                      arrival: "2026-09-10T07:30:00Z",
                      carrierCode: "DL",
                      number: "100",
                      durationMin: "90",
                    },
                    {
                      departureAirport: "JFK",
                      arrivalAirport: "FCO",
                      dep: "2026-09-10T09:00:00Z",
                      arr: "2026-09-10T17:15:00Z",
                      airline: "DL",
                      flightNo: "DL444",
                      dur: "8h 15m",
                    },
                  ],
                  stopCount: "1",
                  miles: "46000",
                  travelClass: "premium economy",
                  connections: "jfk",
                },
              ],
            },
          },
        },
      ]);

      expect(results).to.have.length(1);
      expect(results[0]).to.include({
        id: "avail-cabins:W:0",
        depAirport: "BOS",
        arrAirport: "FCO",
        dep: "06:00",
        arr: "17:15",
        durationMin: 675,
        stops: 1,
        miles: 46000,
        class: "Premium Economy",
        airline: "DL",
        airlineCode: "DL",
        flightNo: "DL100, DL444",
      });
      expect(results[0].connections).to.deep.equal(["JFK"]);
      expect(results[0].itinerary[0].flightNo).to.equal("DL100");
      expect(results[0].itinerary[0].layover).to.equal("1h 30m in JFK");
      expect(results[0].itinerary[1].dur).to.equal("8h 15m");
    });

    it("filters incomplete availability trips and falls back to source-derived labels", () => {
      const results = normalizeSeatsAeroResults({
        Availability: [
          {
            ID: "avail-filtered",
            Source: "flying-blue",
            Route: {
              OriginAirport: "jfk",
              DestinationAirport: "cdg",
            },
            AvailabilityTrips: [
              {
                ID: "trip-bad",
                OriginAirport: "JFK",
                DestinationAirport: "CDG",
                MileageCost: 0,
                TotalDuration: 0,
              },
              {
                ID: "trip-good",
                OriginAirport: "JFK",
                DestinationAirport: "CDG",
                MileageCost: 56000,
                TotalDuration: 435,
                Cabin: "award",
                DepartsAt: "2026-08-11T18:10:00Z",
                ArrivesAt: "2026-08-12T01:25:00Z",
              },
            ],
          },
        ],
      });

      expect(results).to.have.length(1);
      expect(results[0]).to.include({
        id: "trip-good",
        airline: "Flying Blue",
        flightNo: "Flying Blue",
        class: "Award",
        miles: 56000,
        durationMin: 435,
      });
      expect(results[0].itinerary[0]).to.deep.equal({
        depA: "JFK",
        dep: "18:10",
        arrA: "CDG",
        arr: "01:25",
        dur: "7h 15m",
      });
    });

    it("returns an empty array when there is no usable mileage or trip data", () => {
      expect(normalizeSeatsAeroResults({ items: [{ ID: "empty-1" }] })).to.deep
        .equal([]);
    });

    it("handles minute-only durations, empty labels, and synthetic itineraries built from fallback route data", () => {
      const results = normalizeSeatsAeroResults({
        data: [
          {
            ID: "avail-edge",
            Route: {
              OriginAirport: "mia",
              DestinationAirport: "bog",
            },
            Source: null,
            MileageCost: 32000,
            Cabin: null,
            Trips: [
              {
                DepartsAt: "2026-08-09T10:00:00Z",
                ArrivesAt: "2026-08-09T11:35:00Z",
              },
            ],
          },
          {
            ID: "avail-short-hop",
            originAirport: "lga",
            destinationAirport: "bos",
            source: "",
            miles: 9000,
            class: "",
            trips: [
              {
                originAirport: "lga",
                destinationAirport: "bos",
                departureTime: "2026-09-01T10:00:00Z",
                arrivalTime: "2026-09-01T10:45:00Z",
                carrier: "DL",
                number: "777",
                duration: null,
              },
            ],
          },
        ],
      });

      expect(results).to.have.length(2);
      expect(results[0]).to.include({
        id: "avail-edge:award:0",
        depAirport: "MIA",
        arrAirport: "BOG",
        airline: "Seats.aero",
        flightNo: "",
        class: "Award",
        miles: 32000,
        durationMin: 95,
      });
      expect(results[0].itinerary).to.deep.equal([
        {
          depA: "MIA",
          dep: "10:00",
          arrA: "BOG",
          arr: "11:35",
          dur: "1h 35m",
        },
      ]);

      expect(results[1]).to.include({
        depAirport: "LGA",
        arrAirport: "BOS",
        airline: "DL",
        flightNo: "",
        class: "Award",
        miles: 9000,
        durationMin: 45,
      });
      expect(results[1].itinerary[0].dur).to.equal("45m");
    });
  });

  describe("searchSeatsAeroFlights()", () => {
    it("passes normalized params and authorization to the fetch implementation", async () => {
      process.env.SEATS_AERO_API = "  test-key  ";
      let capturedRequest = null;

      const flights = await searchSeatsAeroFlights(
        { origin: "jfk", destination: "sfo", date: "2026-10-20" },
        async (url, options) => {
          capturedRequest = { url, options };
          return createJsonResponse({
            data: [
              {
                ID: "avail-1",
                Route: { OriginAirport: "JFK", DestinationAirport: "SFO" },
                YAvailable: true,
                YMileageCost: 15000,
                DepartsAt: "2026-10-20T08:00:00Z",
                ArrivesAt: "2026-10-20T11:15:00Z",
                Source: "alaska",
              },
            ],
          });
        },
      );

      expect(capturedRequest.url).to.include("/partnerapi/search?");
      expect(capturedRequest.url).to.include("origin_airport=JFK");
      expect(capturedRequest.url).to.include("destination_airport=SFO");
      expect(capturedRequest.options.headers["Partner-Authorization"]).to.equal(
        "test-key",
      );
      expect(flights).to.have.length(1);
      expect(flights[0].miles).to.equal(15000);
    });

    it("returns an empty result set when the upstream response body is not valid JSON but the request succeeds", async () => {
      process.env.SEATS_AERO_API = "test-key";
      console.error = () => {};

      const flights = await searchSeatsAeroFlights(
        { origin: "JFK", destination: "SFO", date: "2026-10-20" },
        async () => ({
          ok: true,
          status: 200,
          async json() {
            throw new Error("invalid json");
          },
        }),
      );

      expect(flights).to.deep.equal([]);
    });

    it("maps upstream 4xx errors to 400 and uses the default message when JSON parsing fails", async () => {
      process.env.SEATS_AERO_API = "test-key";
      console.error = () => {};

      try {
        await searchSeatsAeroFlights(
          { origin: "JFK", destination: "SFO", date: "2026-10-20" },
          async () => ({
            ok: false,
            status: 401,
            async json() {
              throw new Error("invalid json");
            },
          }),
        );
        expect.fail("Expected upstream error");
      } catch (error) {
        expect(error.statusCode).to.equal(400);
        expect(error.message).to.equal("Seats.aero search request failed.");
      }
    });

    it("throws a configuration error when the API key is missing", async () => {
      delete process.env.SEATS_AERO_API;

      try {
        await searchSeatsAeroFlights({
          origin: "JFK",
          destination: "SFO",
          date: "2026-10-20",
        });
        expect.fail("Expected configuration error");
      } catch (error) {
        expect(error.statusCode).to.equal(500);
        expect(error.message).to.equal(
          "SEATS_AERO_API is not configured on the backend.",
        );
      }
    });
  });

  describe("getSeatsAeroTripDetail()", () => {
    it("throws a configuration error when the API key is missing", async () => {
      delete process.env.SEATS_AERO_API;

      try {
        await getSeatsAeroTripDetail({
          availabilityId: "avail-1",
          tripId: "trip-1",
        });
        expect.fail("Expected configuration error");
      } catch (error) {
        expect(error.statusCode).to.equal(500);
        expect(error.message).to.equal(
          "SEATS_AERO_API is not configured on the backend.",
        );
      }
    });

    it("returns 400 when availabilityId or tripId is missing", async () => {
      process.env.SEATS_AERO_API = "test-key";

      try {
        await getSeatsAeroTripDetail({ availabilityId: "", tripId: "" });
        expect.fail("Expected validation error");
      } catch (error) {
        expect(error.statusCode).to.equal(400);
        expect(error.message).to.equal(
          "availabilityId and tripId are required route parameters.",
        );
      }
    });

    it("maps upstream 4xx trip-detail errors to 400 and uses the fallback message when JSON parsing fails", async () => {
      process.env.SEATS_AERO_API = "test-key";

      try {
        await getSeatsAeroTripDetail(
          { availabilityId: "avail-1", tripId: "trip-1" },
          async () => ({
            ok: false,
            status: 429,
            async json() {
              throw new Error("invalid json");
            },
          }),
        );
        expect.fail("Expected upstream error");
      } catch (error) {
        expect(error.statusCode).to.equal(400);
        expect(error.message).to.equal("Seats.aero trip request failed.");
      }
    });

    it("supports alternate payload roots and camelCase booking links", async () => {
      process.env.SEATS_AERO_API = "test-key";

      const result = await getSeatsAeroTripDetail(
        { availabilityId: "avail-alt", tripId: "trip-alt" },
        async () =>
          createJsonResponse({
            items: [
              {
                id: "trip-alt",
                originAirport: "ord",
                destinationAirport: "mad",
                mileageCost: "42000",
                totalDuration: "480",
                carriers: "IB, IB",
                flightNumbers: "IB10",
                cabin: "J",
                date: "2026-11-04",
              },
            ],
            bookingLinks: [{ label: "Book", link: "https://example.com/book" }],
          }),
      );

      expect(result).to.include({
        id: "trip-alt",
        airline: "IB",
        airlineCode: "IB",
        class: "Business",
        miles: 42000,
        durationMin: 480,
        depAirport: "ORD",
        arrAirport: "MAD",
      });
      expect(result.itinerary).to.deep.equal([
        {
          depA: "ORD",
          dep: "",
          arrA: "MAD",
          arr: "",
          dur: "8h",
        },
      ]);
      expect(result.bookingLinks).to.deep.equal([
        { label: "Book", link: "https://example.com/book", primary: false },
      ]);
    });

    it("returns a synthetic detail itinerary when timestamps are invalid and no duration can be computed", async () => {
      process.env.SEATS_AERO_API = "test-key";

      const result = await getSeatsAeroTripDetail(
        { availabilityId: "avail-invalid", tripId: "trip-invalid" },
        async () =>
          createJsonResponse({
            data: [
              {
                ID: "trip-invalid",
                OriginAirport: "mia",
                DestinationAirport: "bog",
                MileageCost: 27000,
                Cabin: "economy",
                DepartsAt: "not-a-date",
                ArrivesAt: "also-not-a-date",
              },
            ],
          }),
      );

      expect(result).to.include({
        id: "trip-invalid",
        depAirport: "MIA",
        arrAirport: "BOG",
        class: "Economy",
        miles: 27000,
        durationMin: 0,
      });
      expect(result.itinerary).to.deep.equal([
        {
          depA: "MIA",
          dep: "not-a-date",
          arrA: "BOG",
          arr: "also-not-a-date",
          dur: "",
        },
      ]);
    });
  });
});
