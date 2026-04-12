import { expect } from "chai";
import request from "supertest";
import { app } from "../server.js";

describe("Login API", () => {
  describe("POST /api/login", () => {
    it("should ret 200 given email and password", async () => {
      const res = await request(app)
        .post("/api/login")
        .send({ email: "test@example.com", password: "12345" });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("message", "Login successful.");
      expect(res.body).to.have.property("data");
      expect(res.body.data).to.have.property("email", "test@example.com");
    });

    it("should ret 400 given email is absent", async () => {
      const res = await request(app)
        .post("/api/login")
        .send({ password: "12345" });

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property("message");
    });

    it("should ret 400 given password is absent", async () => {
      const res = await request(app)
        .post("/api/login")
        .send({ email: "test@example.com" });

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property("message");
    });
  });

  describe("POST /api/signup", () => {
    it("should ret 201 given email and password", async () => {
      const res = await request(app)
        .post("/api/signup")
        .send({ email: "testnewuser@example.com", password: "abcdefg" });

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
    });

    it("should ret 400 given email is absent", async () => {
      const res = await request(app)
        .post("/api/signup")
        .send({ password: "abcdefg" });

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property("message");
    });

    it("should ret 400 given password is absent", async () => {
      const res = await request(app)
        .post("/api/signup")
        .send({ email: "testnewuser@example.com" });

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property("message");
    });
  });
});
