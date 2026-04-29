import { expect } from "chai";
import request from "supertest";
import { app } from "../server.js";
import { resetAuthState, signupAndGetToken } from "./authTestUtils.js";

describe("Recent Searches API", () => {
  let token;

  beforeEach(async () => {
    await resetAuthState();
    const result = await signupAndGetToken({
      email: "recent-searches@example.com",
      password: "password123",
    });
    token = result.token;
  });

  describe("authorization", () => {
    it("returns 401 without a token", async () => {
      const getRes = await request(app).get("/api/recent-searches");
      expect(getRes.status).to.equal(401);
      expect(getRes.body.message).to.equal("Authorization token required.");

      const postRes = await request(app).post("/api/recent-searches").send({
        origin: "JFK",
        destination: "LHR",
        travelDate: "2026-07-01",
        searchedAt: "2026-04-29",
      });
      expect(postRes.status).to.equal(401);
      expect(postRes.body.message).to.equal("Authorization token required.");
    });
  });

  describe("GET /api/recent-searches", () => {
    it("returns an empty list for a new user", async () => {
      const res = await request(app)
        .get("/api/recent-searches")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body.message).to.equal(
        "Recent searches retrieved successfully",
      );
      expect(res.body.data).to.deep.equal([]);
    });
  });

  describe("POST /api/recent-searches", () => {
    it("returns 400 when required fields are missing", async () => {
      const res = await request(app)
        .post("/api/recent-searches")
        .set("Authorization", `Bearer ${token}`)
        .send({ origin: "JFK", destination: "LHR" });

      expect(res.status).to.equal(400);
      expect(res.body.message).to.equal(
        "origin, destination, travelDate, and searchedAt are required.",
      );
    });

    it("saves and returns a normalized recent-search entry", async () => {
      const payload = {
        origin: "jfk",
        destination: "lhr",
        travelDate: "2026-07-01",
        searchedAt: "2026-04-29",
        cabin: "Business",
        preferredAirline: "United",
        travelers: 2,
        milesRange: "60000-90000",
      };

      const postRes = await request(app)
        .post("/api/recent-searches")
        .set("Authorization", `Bearer ${token}`)
        .send(payload);

      expect(postRes.status).to.equal(200);
      expect(postRes.body.data).to.have.length(1);
      expect(postRes.body.data[0]).to.include({
        origin: "JFK",
        destination: "LHR",
        travelDate: "2026-07-01",
        searchedAt: "2026-04-29",
        cabin: "Business",
        preferredAirline: "United",
        travelers: 2,
        milesRange: "60000-90000",
      });

      const getRes = await request(app)
        .get("/api/recent-searches")
        .set("Authorization", `Bearer ${token}`);
      expect(getRes.status).to.equal(200);
      expect(getRes.body.data).to.have.length(1);
      expect(getRes.body.data[0].origin).to.equal("JFK");
      expect(getRes.body.data[0].destination).to.equal("LHR");
    });

    it("deduplicates matching searches and keeps the latest at the top", async () => {
      const basePayload = {
        origin: "JFK",
        destination: "LHR",
        travelDate: "2026-07-01",
        searchedAt: "2026-04-28",
        cabin: "Any Cabin",
        preferredAirline: "Any Airline",
        travelers: 1,
        milesRange: "Any",
      };

      await request(app)
        .post("/api/recent-searches")
        .set("Authorization", `Bearer ${token}`)
        .send(basePayload);

      const secondRes = await request(app)
        .post("/api/recent-searches")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...basePayload, searchedAt: "2026-04-29" });

      expect(secondRes.status).to.equal(200);
      expect(secondRes.body.data).to.have.length(1);
      expect(secondRes.body.data[0].searchedAt).to.equal("2026-04-29");
    });

    it("caps persisted recent searches at 10 entries", async () => {
      for (let i = 0; i < 11; i += 1) {
        const day = String(i + 1).padStart(2, "0");
        const originCode = String.fromCharCode(65 + (i % 26));
        const destinationCode = String.fromCharCode(90 - (i % 26));

        const res = await request(app)
          .post("/api/recent-searches")
          .set("Authorization", `Bearer ${token}`)
          .send({
            origin: `${originCode}AA`,
            destination: `${destinationCode}BB`,
            travelDate: `2026-07-${day}`,
            searchedAt: `2026-04-${day}`,
            cabin: "Any Cabin",
            preferredAirline: "Any Airline",
            travelers: 1,
            milesRange: "Any",
          });

        expect(res.status).to.equal(200);
      }

      const getRes = await request(app)
        .get("/api/recent-searches")
        .set("Authorization", `Bearer ${token}`);

      expect(getRes.status).to.equal(200);
      expect(getRes.body.data).to.have.length(10);
      expect(getRes.body.data[0].travelDate).to.equal("2026-07-11");
      expect(getRes.body.data.map((entry) => entry.travelDate)).to.not.include(
        "2026-07-01",
      );
    });
  });
});
