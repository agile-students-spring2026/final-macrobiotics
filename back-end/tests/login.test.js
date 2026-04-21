import { expect } from "chai";
import request from "supertest";
import { app } from "../server.js";
import { resetAuthState, signupAndGetToken } from "./authTestUtils.js";

describe("Login API", () => {
  beforeEach(async () => {
    await resetAuthState();
  });

  describe("POST /api/login", () => {
    it("returns 200 with a JWT when valid credentials are provided", async () => {
      await signupAndGetToken({
        email: "test@example.com",
        password: "secret123",
      });

      const res = await request(app)
        .post("/api/login")
        .send({ email: "test@example.com", password: "secret123" });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("message", "Login successful.");
      expect(res.body).to.have.property("data");
      expect(res.body.data).to.have.property("email", "test@example.com");
      expect(res.body.data).to.have.property("token").that.is.a("string");
      expect(res.body.data.token.length).to.be.greaterThan(20);
    });

    it("returns 400 when email is missing", async () => {
      const res = await request(app)
        .post("/api/login")
        .send({ password: "secret123" });

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property(
        "message",
        "Email and password are required.",
      );
    });

    it("returns 400 when password is missing", async () => {
      const res = await request(app)
        .post("/api/login")
        .send({ email: "test@example.com" });

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property(
        "message",
        "Email and password are required.",
      );
    });

    it("returns 401 when the password is incorrect", async () => {
      await signupAndGetToken({
        email: "test@example.com",
        password: "secret123",
      });

      const res = await request(app)
        .post("/api/login")
        .send({ email: "test@example.com", password: "wrongpass" });

      expect(res.status).to.equal(401);
      expect(res.body).to.have.property(
        "message",
        "Invalid email or password.",
      );
    });
  });

  describe("POST /api/signup", () => {
    it("returns 201 with a JWT when a new account is created", async () => {
      const res = await request(app).post("/api/signup").send({
        email: "testnewuser@example.com",
        password: "abcdefg",
      });

      expect(res.status).to.equal(201);
      expect(res.body).to.have.property(
        "message",
        "Account successfully created.",
      );
      expect(res.body).to.have.property("data");
      expect(res.body.data).to.have.property(
        "email",
        "testnewuser@example.com",
      );
      expect(res.body.data).to.have.property("token").that.is.a("string");
    });

    it("returns 400 when email is missing", async () => {
      const res = await request(app)
        .post("/api/signup")
        .send({ password: "abcdefg" });

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property(
        "message",
        "Email and password are required.",
      );
    });

    it("returns 400 when password is missing", async () => {
      const res = await request(app)
        .post("/api/signup")
        .send({ email: "testnewuser@example.com" });

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property(
        "message",
        "Email and password are required.",
      );
    });

    it("returns 409 when the email already exists", async () => {
      await signupAndGetToken({
        email: "duplicate@example.com",
        password: "secret123",
      });

      const res = await request(app).post("/api/signup").send({
        email: "duplicate@example.com",
        password: "secret123",
      });

      expect(res.status).to.equal(409);
      expect(res.body).to.have.property(
        "message",
        "An account with that email already exists.",
      );
    });
  });
});
