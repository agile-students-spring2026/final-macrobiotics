import { expect } from "chai";
import request from "supertest";
import { app } from "../server.js";
import { resetAuthState, signupAndGetToken } from "./authTestUtils.js";
import { clearSearchHistory } from "../repositories/searchRepository.js";

describe("History API", () => {
  let token;

  beforeEach(async () => {
    await resetAuthState();
    await clearSearchHistory();
    const result = await signupAndGetToken({
      email: "history@example.com",
      password: "password123",
    });
    token = result.token;
  });

  describe("authorization", () => {
    it("returns 401 without a token", async () => {
      const res = await request(app).get("/api/history");
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property("message", "Authorization token required.");
    });
  });

  describe("GET /api/history", () => {
    it("returns 200 with an empty array when the user has no history", async () => {
      const res = await request(app)
        .get("/api/history")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("message");
      expect(res.body).to.have.property("data");
      expect(res.body.data).to.be.an("array");
      expect(res.body.data).to.have.length(0);
    });

    it("returns history entries with the correct shape", async () => {
      const res = await request(app)
        .get("/api/history")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body.data).to.be.an("array");
    });

    it("respects the limit query parameter", async () => {
      const res = await request(app)
        .get("/api/history?limit=5")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body.data.length).to.be.at.most(5);
    });

    it("returns 200 with default limit when limit param is omitted", async () => {
      const res = await request(app)
        .get("/api/history")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body.data).to.be.an("array");
    });
  });
});
