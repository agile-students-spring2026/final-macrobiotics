import request from "supertest";
import * as chai from "chai";
import app, { bookmarks } from "../server.js";

const { expect } = chai;

describe("Bookmarks API", () => {
  beforeEach(() => {
    bookmarks.length = 0;
  });

  describe("GET /", () => {
    it("should return success message", async () => {
      const res = await request(app).get("/").expect(200);

      expect(res.text).to.equal("API route reached successfully");
    });
  });

  describe("GET /api/bookmarks", () => {
    it("should return bookmarks array", async () => {
      const res = await request(app).get("/api/bookmarks").expect(200);

      expect(res.body).to.have.property(
        "message",
        "Bookmarks retrieved successfully",
      );
      expect(res.body).to.have.property("data").that.is.an("array");
    });
  });

  describe("POST /api/bookmarks", () => {
    it("should add a new bookmark", async () => {
      const bookmark = {
        id: "test-id-1",
        flightNo: "AA123",
        depAirport: "JFK",
        arrAirport: "LAX",
      };

      const res = await request(app)
        .post("/api/bookmarks")
        .send(bookmark)
        .expect(201);

      expect(res.body).to.have.property(
        "message",
        "Bookmark saved successfully.",
      );
      expect(res.body).to.have.property("data").that.deep.equals(bookmark);
    });

    it("should not add duplicate bookmark", async () => {
      const bookmark = {
        id: "test-id-2",
        flightNo: "BB456",
        depAirport: "ORD",
        arrAirport: "SFO",
      };

      await request(app).post("/api/bookmarks").send(bookmark).expect(201);

      const res = await request(app)
        .post("/api/bookmarks")
        .send(bookmark)
        .expect(400);

      expect(res.body).to.have.property("message", "Bookmark already exists.");
    });
  });

  describe("DELETE /api/bookmarks/:id", () => {
    it("should delete an existing bookmark", async () => {
      const bookmark = {
        id: "test-id-3",
        flightNo: "CC789",
        depAirport: "MIA",
        arrAirport: "SEA",
      };

      await request(app).post("/api/bookmarks").send(bookmark).expect(201);

      const res = await request(app)
        .delete("/api/bookmarks/test-id-3")
        .expect(200);

      expect(res.body).to.have.property(
        "message",
        "Bookmark deleted successfully!",
      );
    });

    it("should return 404 for non-existent bookmark", async () => {
      const res = await request(app)
        .delete("/api/bookmarks/non-existent-id")
        .expect(404);

      expect(res.body).to.have.property("message", "Bookmark not found.");
    });
  });
});
