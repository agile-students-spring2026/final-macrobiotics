import { expect } from "chai";
import cron from "node-cron";
import redisClient from "../config/redis.js";
import { mockApiResponse } from "./data/prefetch.data.js";
import {
  startPrefetchJob,
  runPrefetchJob,
  buildSearchUrl,
} from "../workers/prefetch.js";

describe("Prefetch Job", () => {
  let originalArgv;
  let originalFetch;
  let originalSchedule;
  let originalRedisSetEx;
  let originalConsoleLog;
  let originalNpmLifecycleEvent;

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
  });

  afterEach(() => {
    process.argv = originalArgv;
    global.fetch = originalFetch;
    cron.schedule = originalSchedule;
    redisClient.setEx = originalRedisSetEx;
    console.log = originalConsoleLog;
    process.env.npm_lifecycle_event = originalNpmLifecycleEvent;
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
  });
});
