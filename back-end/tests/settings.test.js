import { expect } from "chai";
import request from "supertest";
import { app } from "../server.js";
import { resetAuthState, signupAndGetToken } from "./authTestUtils.js";

describe("Settings API", () => {
  let token;

  beforeEach(async () => {
    await resetAuthState();
    const signupResult = await signupAndGetToken({
      email: "settings@example.com",
      password: "password123",
    });
    token = signupResult.token;
  });

  describe("authorization", () => {
    it("returns 401 for protected settings routes without a token", async () => {
      const res = await request(app).get("/api/settings/preferences");

      expect(res.status).to.equal(401);
      expect(res.body).to.have.property(
        "message",
        "Authorization token required.",
      );
    });
  });

  describe("GET /api/settings/preferences", () => {
    it("returns 200 with a preferences array", async () => {
      const res = await request(app)
        .get("/api/settings/preferences")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("message");
      expect(res.body).to.have.property("data");
      expect(res.body.data).to.be.an("array");
      expect(res.body.data).to.have.length(3);
    });

    it("returns preferences with id, label, and value fields", async () => {
      const res = await request(app)
        .get("/api/settings/preferences")
        .set("Authorization", `Bearer ${token}`);

      const pref = res.body.data[0];
      expect(pref).to.have.property("id");
      expect(pref).to.have.property("label");
      expect(pref).to.have.property("value");
    });
  });

  describe("PUT /api/settings/email", () => {
    it("returns 200 when both fields are provided and match the account", async () => {
      const res = await request(app)
        .put("/api/settings/email")
        .set("Authorization", `Bearer ${token}`)
        .send({
          previousEmail: "settings@example.com",
          newEmail: "new@example.com",
        });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("message", "Email updated successfully.");
      expect(res.body.data).to.have.property("email", "new@example.com");
    });

    it("returns 400 when newEmail is missing", async () => {
      const res = await request(app)
        .put("/api/settings/email")
        .set("Authorization", `Bearer ${token}`)
        .send({ previousEmail: "settings@example.com" });

      expect(res.status).to.equal(400);
    });

    it("returns 400 when previousEmail is missing", async () => {
      const res = await request(app)
        .put("/api/settings/email")
        .set("Authorization", `Bearer ${token}`)
        .send({ newEmail: "new@example.com" });

      expect(res.status).to.equal(400);
    });

    it("returns 400 when previousEmail does not match the account", async () => {
      const res = await request(app)
        .put("/api/settings/email")
        .set("Authorization", `Bearer ${token}`)
        .send({
          previousEmail: "wrong@example.com",
          newEmail: "new@example.com",
        });

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property(
        "message",
        "previousEmail does not match the current account.",
      );
    });
  });

  describe("PUT /api/settings/password", () => {
    it("returns 200 when both fields are valid", async () => {
      const res = await request(app)
        .put("/api/settings/password")
        .set("Authorization", `Bearer ${token}`)
        .send({
          previousPassword: "password123",
          newPassword: "newpass456",
        });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property(
        "message",
        "Password updated successfully.",
      );
    });

    it("returns 400 when newPassword is missing", async () => {
      const res = await request(app)
        .put("/api/settings/password")
        .set("Authorization", `Bearer ${token}`)
        .send({ previousPassword: "password123" });

      expect(res.status).to.equal(400);
    });

    it("returns 400 when previousPassword is missing", async () => {
      const res = await request(app)
        .put("/api/settings/password")
        .set("Authorization", `Bearer ${token}`)
        .send({ newPassword: "newpass456" });

      expect(res.status).to.equal(400);
    });

    it("returns 400 when previousPassword is incorrect", async () => {
      const res = await request(app)
        .put("/api/settings/password")
        .set("Authorization", `Bearer ${token}`)
        .send({
          previousPassword: "incorrect",
          newPassword: "newpass456",
        });

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property(
        "message",
        "previousPassword is incorrect.",
      );
    });
  });

  describe("PUT /api/settings/preferences", () => {
    it("returns 200 when a valid updates array is provided", async () => {
      const res = await request(app)
        .put("/api/settings/preferences")
        .set("Authorization", `Bearer ${token}`)
        .send([{ id: "airport", value: "LAX" }]);

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property(
        "message",
        "Preferences updated successfully.",
      );
    });

    it("persists updated preference values", async () => {
      await request(app)
        .put("/api/settings/preferences")
        .set("Authorization", `Bearer ${token}`)
        .send([{ id: "airline", value: "United" }]);

      const res = await request(app)
        .get("/api/settings/preferences")
        .set("Authorization", `Bearer ${token}`);

      const airline = res.body.data.find((p) => p.id === "airline");
      expect(airline.value).to.equal("United");
    });

    it("returns 400 when body is not an array", async () => {
      const res = await request(app)
        .put("/api/settings/preferences")
        .set("Authorization", `Bearer ${token}`)
        .send({ id: "airport", value: "LAX" });

      expect(res.status).to.equal(400);
    });

    it("returns 400 when body is an empty array", async () => {
      const res = await request(app)
        .put("/api/settings/preferences")
        .set("Authorization", `Bearer ${token}`)
        .send([]);

      expect(res.status).to.equal(400);
    });
  });
});
