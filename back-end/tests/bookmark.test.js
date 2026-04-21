import request from "supertest";
import * as chai from "chai";
import app from "../server.js";
import { resetAuthState, signupAndGetToken } from "./authTestUtils.js";

const { expect } = chai;

describe("Bookmarks API", () => {
  let token;

  beforeEach(async () => {
    await resetAuthState();
    const signupResult = await signupAndGetToken({
      email: "bookmarks@example.com",
      password: "password123",
    });
    token = signupResult.token;
  });

  describe("GET /", () => {
    it("should return success message", async () => {
      const res = await request(app).get("/").expect(200);

      expect(res.text).to.equal("API route reached successfully");
    });
  });

  describe("GET /api/bookmarks", () => {
    it("returns 401 without authorization", async () => {
      const res = await request(app).get("/api/bookmarks").expect(401);

      expect(res.body).to.have.property(
        "message",
        "Authorization token required.",
      );
    });

    it("returns bookmarks array for the authenticated user", async () => {
      const res = await request(app)
        .get("/api/bookmarks")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body).to.have.property(
        "message",
        "Bookmarks retrieved successfully",
      );
      expect(res.body).to.have.property("data").that.is.an("array");
    });
  });

  describe("POST /api/bookmarks", () => {
    it("adds a new bookmark", async () => {
      const bookmark = {
        id: "test-id-1",
        flightNo: "AA123",
        depAirport: "JFK",
        arrAirport: "LAX",
      };

      const res = await request(app)
        .post("/api/bookmarks")
        .set("Authorization", `Bearer ${token}`)
        .send(bookmark)
        .expect(201);

      expect(res.body).to.have.property(
        "message",
        "Bookmark saved successfully.",
      );
      expect(res.body).to.have.property("data").that.deep.equals(bookmark);
    });

    it("does not add a duplicate bookmark", async () => {
      const bookmark = {
        id: "test-id-2",
        flightNo: "BB456",
        depAirport: "ORD",
        arrAirport: "SFO",
      };

      await request(app)
        .post("/api/bookmarks")
        .set("Authorization", `Bearer ${token}`)
        .send(bookmark)
        .expect(201);

      const res = await request(app)
        .post("/api/bookmarks")
        .set("Authorization", `Bearer ${token}`)
        .send(bookmark)
        .expect(400);

      expect(res.body).to.have.property("message", "Bookmark already exists.");
    });
  });

  describe("DELETE /api/bookmarks/:id", () => {
    it("deletes an existing bookmark", async () => {
      const bookmark = {
        id: "test-id-3",
        flightNo: "CC789",
        depAirport: "MIA",
        arrAirport: "SEA",
      };

      await request(app)
        .post("/api/bookmarks")
        .set("Authorization", `Bearer ${token}`)
        .send(bookmark)
        .expect(201);

      const res = await request(app)
        .delete("/api/bookmarks/test-id-3")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body).to.have.property(
        "message",
        "Bookmark deleted successfully!",
      );
    });

    it("returns 404 for non-existent bookmark", async () => {
      const res = await request(app)
        .delete("/api/bookmarks/non-existent-id")
        .set("Authorization", `Bearer ${token}`)
        .expect(404);

      expect(res.body).to.have.property("message", "Bookmark not found.");
    });
  });
});
