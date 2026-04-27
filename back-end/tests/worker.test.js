import { expect } from "chai";
import cron from "node-cron";
import mongoose from "mongoose";
import sinon from "sinon";
import redisClient from "../config/redis.js";
import SearchHistory from "../models/SearchHistory.js";
import { mockApiResponse } from "./data/prefetch.data.js";
import {
  startPrefetchJob,
  runPrefetchJob,
  buildSearchUrl,
  getPrefetchTargets,
} from "../workers/prefetch.js";

describe("Prefetch Job", () => {
  let originalArgv;
  let originalFetch;
  let originalSchedule;
  let originalRedisSetEx;
  let originalConsoleLog;
  let originalNpmLifecycleEvent;
  let originalReadyState;
  let sandbox;

  beforeEach(() => {
    delete process.env.SEATS_AERO_API;
    originalArgv = [...process.argv];
    process.argv = ["node", "server.js"];

    originalNpmLifecycleEvent = process.env.npm_lifecycle_event;
    process.env.npm_lifecycle_event = "test";

    originalFetch = global.fetch;
    originalSchedule = cron.schedule;
    originalRedisSetEx = redisClient.setEx;
    originalConsoleLog = console.log;
    originalReadyState = mongoose.connection.readyState;
    sandbox = sinon.createSandbox();
    sandbox.useFakeTimers(new Date("2026-04-26T12:00:00Z"));
  });

  afterEach(() => {
    process.argv = originalArgv;
    global.fetch = originalFetch;
    cron.schedule = originalSchedule;
    redisClient.setEx = originalRedisSetEx;
    console.log = originalConsoleLog;
    process.env.npm_lifecycle_event = originalNpmLifecycleEvent;
    mongoose.connection.readyState = originalReadyState;
    sandbox.restore();
  });

  describe("buildSearchUrl()", () => {
    it("should construct the correct seats.aero URL with query parameters", () => {
      const url = buildSearchUrl({
        origin: "JFK,EWR",
        destination: "LHR,CDG",
        startDate: "2026-10-01",
        endDate: "2026-10-31",
      });

      expect(url).to.include("origin_airport=JFK%2CEWR");
      expect(url).to.include("start_date=2026-10-01");
      expect(url).to.include("take=500");
    });
  });

  describe("startPrefetchJob()", () => {
    it("should schedule the cron job if --prefetch flag is present", async () => {
      let scheduledInterval = "";
      cron.schedule = (interval) => {
        scheduledInterval = interval;
      };

      global.fetch = async () => ({
        ok: true,
        json: async () => ({ data: [] }),
      });
      process.argv.push("--prefetch");

      await startPrefetchJob();

      expect(scheduledInterval).to.equal("*/20 * * * *");
    });

    it("should not schedule the job if the --prefetch flag is missing", async () => {
      let cronWasCalled = false;
      cron.schedule = () => {
        cronWasCalled = true;
      };

      await startPrefetchJob();

      expect(cronWasCalled).to.be.false;
    });
  });

  describe("runPrefetchJob()", () => {
    it("should abort operation if SEATS_AERO_API key is missing", async () => {
      console.log = () => {
        throw new Error("Unexpected console output during test run");
      };

      let fetchWasCalled = false;
      global.fetch = async () => {
        fetchWasCalled = true;
      };

      await runPrefetchJob();

      expect(fetchWasCalled).to.be.false;
    });

    it("should fetch raw data, normalize it, and cache to Redis", async () => {
      process.env.SEATS_AERO_API = "fake-test-key";

      global.fetch = async () => ({
        ok: true,
        json: async () => mockApiResponse,
      });

      const redisSaves = [];
      redisClient.setEx = async (key, ttl, value) => {
        redisSaves.push({ key, ttl, value: JSON.parse(value) });
        return "OK";
      };

      console.log = () => {};

      await runPrefetchJob();

      expect(redisSaves).to.have.lengthOf(1);

      const firstSave = redisSaves[0];
      expect(firstSave.key).to.equal("search:JFK:LHR:2026-04-30");
      expect(firstSave.value).to.have.length.greaterThan(0);

      expect(firstSave.value[0].id).to.include("39VjFUDvgm1Si8XLI3za0KSIgFE");
    });

    it("should prefetch the top exact searches when history-derived targets are available", async () => {
      process.env.SEATS_AERO_API = "fake-test-key";
      mongoose.connection.readyState = 1;
      sandbox.stub(SearchHistory, "aggregate").resolves([
        {
          _id: {
            origin: "JFK",
            destination: "LHR",
          },
          count: 7,
          lastSearchedAt: new Date("2026-04-26T10:00:00.000Z"),
        },
        {
          _id: {
            origin: "SFO",
            destination: "HND",
          },
          count: 5,
          lastSearchedAt: new Date("2026-04-25T09:00:00.000Z"),
        },
      ]);

      const secondApiResponse = {
        data: [
          {
            ID: "avail-2",
            Source: "ana",
            Date: "2026-05-02",
            Route: {
              OriginAirport: "SFO",
              DestinationAirport: "HND",
            },
            YAvailable: true,
            YMileageCost: 50000,
            AvailabilityTrips: [
              {
                ID: "trip-2",
                MileageCost: 50000,
                TotalDuration: 660,
                Stops: 0,
                Carriers: "NH",
                FlightNumbers: "NH7",
                OriginAirport: "SFO",
                DestinationAirport: "HND",
                DepartsAt: "2026-05-02T17:00:00Z",
                ArrivesAt: "2026-05-03T04:00:00Z",
                Cabin: "economy",
                Source: "ana",
              },
            ],
          },
        ],
      };

      const fetchUrls = [];
      const fetchResponses = [mockApiResponse, secondApiResponse];
      global.fetch = async (url) => {
        fetchUrls.push(url);

        const responseBody = fetchResponses.shift();

        return {
          ok: true,
          json: async () => responseBody,
        };
      };

      const redisSaves = [];
      redisClient.setEx = async (key, ttl, value) => {
        redisSaves.push({ key, ttl, value: JSON.parse(value) });
        return "OK";
      };

      console.log = () => {};

      await runPrefetchJob();

      expect(fetchUrls).to.have.lengthOf(2);
      expect(fetchUrls[0]).to.include("origin_airport=JFK");
      expect(fetchUrls[0]).to.include("destination_airport=LHR");
      expect(fetchUrls[0]).to.include("start_date=2026-04-26");
      expect(fetchUrls[0]).to.include("end_date=2026-05-26");
      expect(fetchUrls[1]).to.include("origin_airport=SFO");
      expect(fetchUrls[1]).to.include("destination_airport=HND");
      expect(fetchUrls[1]).to.include("start_date=2026-04-26");
      expect(fetchUrls[1]).to.include("end_date=2026-05-26");

      expect(redisSaves.map((save) => save.key)).to.deep.equal([
        "search:JFK:LHR:2026-04-30",
        "search:SFO:HND:2026-05-02",
      ]);
    });
  });

  describe("getPrefetchTargets()", () => {
    it("should turn top searched route pairs into rolling 30-day prefetch targets", async () => {
      mongoose.connection.readyState = 1;
      sandbox.stub(SearchHistory, "aggregate").resolves([
        {
          _id: {
            origin: "JFK",
            destination: "LHR",
          },
          count: 7,
          lastSearchedAt: new Date("2026-04-26T10:00:00.000Z"),
        },
        {
          _id: {
            origin: "SFO",
            destination: "HND",
          },
          count: 5,
          lastSearchedAt: new Date("2026-04-25T09:00:00.000Z"),
        },
      ]);

      const targets = await getPrefetchTargets();

      expect(targets).to.deep.equal([
        {
          origin: "JFK",
          destination: "LHR",
          startDate: "2026-04-26",
          endDate: "2026-05-26",
        },
        {
          origin: "SFO",
          destination: "HND",
          startDate: "2026-04-26",
          endDate: "2026-05-26",
        },
      ]);
    });

    it("should fall back to the broad static query when history-derived targets are unavailable", async () => {
      const targets = await getPrefetchTargets();

      expect(targets).to.have.lengthOf(1);
      expect(targets[0].origin).to.include("JFK");
      expect(targets[0].destination).to.include("LHR");
    });
  });
});
