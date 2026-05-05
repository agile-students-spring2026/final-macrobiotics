import request from "supertest";
import * as chai from "chai";
import mongoose from "mongoose";
import sinon from "sinon";
import app from "../server.js";
import { resetAuthState, signupAndGetToken } from "./authTestUtils.js";
import User from "../models/User.js";
import { findUserByEmail } from "../repositories/userRepository.js";

const { expect } = chai;

describe("Bookmarks API", () => {
  let token;
  let userEmail;
  let sandbox;

  beforeEach(async () => {
    await resetAuthState();
    const signupResult = await signupAndGetToken({
      email: "bookmarks@example.com",
      password: "password123",
    });
    token = signupResult.token;
    userEmail = signupResult.email;
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("GET /", () => {
    it("should return success message", async () => {
      const res = await request(app).get("/").expect(200);

      expect(res.text).to.equal("API route reached successfully");
    });
  });

  describe("GET /api/bookmarks", () => {
    let previousReadyState;

    beforeEach(async () => {
      const signedUpUser = await findUserByEmail(userEmail);

      previousReadyState = mongoose.connection.readyState;
      mongoose.connection.readyState = 1;

      sandbox.stub(User, "findById").callsFake(async (_id, projection) => {
        if (projection?.bookmarks) {
          return {
            _id: signedUpUser.id,
            bookmarks: [],
          };
        }

        return {
          _id: signedUpUser.id,
          email: signedUpUser.email,
          passwordHash: signedUpUser.passwordHash,
          preferences: signedUpUser.preferences,
          bookmarks: signedUpUser.bookmarks,
        };
      });
    });

    afterEach(() => {
      mongoose.connection.readyState = previousReadyState;
    });

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

    it("returns 503 when the database is not connected", async () => {

      previousReadyState = mongoose.connection.readyState;
      mongoose.connection.readyState = 0;

      const res = await request(app)
        .get("/api/bookmarks")
        .set("Authorization", `Bearer ${token}`)
      
      mongoose.connection.readyState = previousReadyState;

      expect(res.status).to.equal(503);
      expect(res.body).to.have.property(

        "message",
        "Database connection is required to retrieve bookmarks",
      );
    });
  });

  describe("POST /api/bookmarks", () => {
    let previousReadyState;

    beforeEach(async () => {
      const signedUpUser = await findUserByEmail(userEmail);

      previousReadyState = mongoose.connection.readyState;
      mongoose.connection.readyState = 1;

      sandbox.stub(User, "findById").resolves({
        _id: signedUpUser.id,
        email: signedUpUser.email,
        passwordHash: signedUpUser.passwordHash,
        preferences: signedUpUser.preferences,
        bookmarks: signedUpUser.bookmarks,
      });
    });

    afterEach(() => {
      mongoose.connection.readyState = previousReadyState;
    });

    it("returns 401 without authorization", async () => {
      const res = await request(app)
        .post("/api/bookmarks")
        .send({ id: "missing-auth-bookmark" })
        .expect(401);

      expect(res.body).to.have.property(
        "message",
        "Authorization token required.",
      );
    });

    it("adds a new bookmark", async () => {
      const bookmark = {
        id: "test-id-1",
        flightNo: "AA123",
        depAirport: "JFK",
        arrAirport: "LAX",
      };

      const existsStub = sandbox.stub(User, "exists").resolves(null);
      const createStub = sandbox
        .stub(User, "findByIdAndUpdate")
        .resolves({ _id: "mock-user-id" });

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
      expect(existsStub.calledOnce).to.equal(true);
      expect(createStub.calledOnce).to.equal(true);
    });

    it("updates an existing bookmark with the same id", async () => {
      const bookmark = {
        id: "test-id-2",
        flightNo: "BB456",
        depAirport: "ORD",
        arrAirport: "SFO",
      };

      const existsStub = sandbox.stub(User, "exists");
      existsStub.onFirstCall().resolves(null);
      existsStub.onSecondCall().resolves({ _id: "mock-user-id" });

      sandbox.stub(User, "findByIdAndUpdate").resolves({ _id: "mock-user-id" });

      const updateStub = sandbox.stub(User, "updateOne").resolves({
        matchedCount: 1,
      });

      await request(app)
        .post("/api/bookmarks")
        .set("Authorization", `Bearer ${token}`)
        .send(bookmark)
        .expect(201);

      const res = await request(app)
        .post("/api/bookmarks")
        .set("Authorization", `Bearer ${token}`)
        .send(bookmark)
        .expect(200);

      expect(res.body).to.have.property(
        "message",
        "Bookmark updated successfully.",
      );
      expect(updateStub.calledOnce).to.equal(true);
    });

    it("returns 400 when id is missing", async () => {

      const res = await request(app)
        .post("/api/bookmarks")
        .set("Authorization", `Bearer ${token}`)
        .send({

          depAirport: "JFK",
          arrAirport: "LAX"
        });

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property(
        
        "message", 
        "Bookmark id is required.");
    });

    it("returns 400 when depAirport or arrAirport are missing", async () => {

      const res = await request(app)
        .post("/api/bookmarks")
        .set("Authorization", `Bearer ${token}`)
        .send({

          id: "test-id-missing-airports"});

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property(
        
        "message",
        "depAirport and arrAirport are required.");
    });

    it("returns 503 when the database is not connected", async () => {

      previousReadyState = mongoose.connection.readyState;
      mongoose.connection.readyState = 0;

      const res = await request(app)
        .post("/api/bookmarks")
        .set("Authorization", `Bearer ${token}`)
        .send({

          id: "test-503",
          depAirport: "JFK",
          arrAirport: "LAX"
        });
      
      mongoose.connection.readyState = previousReadyState;

      expect(res.status).to.equal(503);
      expect(res.body).to.have.property(

        "message",
        "Database connection is required to save bookmarks",
      );
    });

  });

  describe("DELETE /api/bookmarks/:id", () => {
    let previousReadyState;

    beforeEach(async () => {
      const signedUpUser = await findUserByEmail(userEmail);

      previousReadyState = mongoose.connection.readyState;
      mongoose.connection.readyState = 1;

      sandbox.stub(User, "findById").resolves({
        _id: signedUpUser.id,
        email: signedUpUser.email,
        passwordHash: signedUpUser.passwordHash,
        preferences: signedUpUser.preferences,
        bookmarks: signedUpUser.bookmarks,
      });
    });

    afterEach(() => {
      mongoose.connection.readyState = previousReadyState;
    });

    it("deletes an existing bookmark", async () => {
      sandbox.stub(User, "exists").resolves({ _id: "mock-user-id" });
      const updateStub = sandbox.stub(User, "updateOne").resolves({
        matchedCount: 1,
      });

      const res = await request(app)
        .delete("/api/bookmarks/test-id-3")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body).to.have.property(
        "message",
        "Bookmark deleted successfully!",
      );
      expect(updateStub.calledOnce).to.equal(true);
    });

    it("returns 404 for non-existent bookmark", async () => {
      sandbox.stub(User, "exists").resolves(null);

      const res = await request(app)
        .delete("/api/bookmarks/non-existent-id")
        .set("Authorization", `Bearer ${token}`)
        .expect(404);

      expect(res.body).to.have.property("message", "Bookmark not found.");
    });

    it("returns 503 when the database is not connected", async () => {

      previousReadyState = mongoose.connection.readyState;
      mongoose.connection.readyState = 0;

      const res = await request(app)
        .delete("/api/bookmarks/some-id")
        .set("Authorization", `Bearer ${token}`)
      
      mongoose.connection.readyState = previousReadyState;

      expect(res.status).to.equal(503);
      expect(res.body).to.have.property(

        "message",
        "Database connection is required to delete bookmarks",
      );
    });
  });
});
