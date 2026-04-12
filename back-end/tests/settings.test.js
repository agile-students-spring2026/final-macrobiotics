import { expect } from "chai";
import request from "supertest";
import { app } from "../server.js";

describe("Settings API", () => {
  describe("GET /api/settings/preferences", () => {
    it("should return 200 with a preferences array", async () => {
      const res = await request(app).get("/api/settings/preferences");
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("message");
      expect(res.body).to.have.property("data");
      expect(res.body.data).to.be.an("array");
      expect(res.body.data).to.have.length(3);
    });

    it("should return preferences with id, label, and value fields", async () => {
      const res = await request(app).get("/api/settings/preferences");
      const pref = res.body.data[0];
      expect(pref).to.have.property("id");
      expect(pref).to.have.property("label");
      expect(pref).to.have.property("value");
    });
  });

  describe("PUT /api/settings/email", () => {
    it("should return 200 when both fields are provided", async () => {
      const res = await request(app)
        .put("/api/settings/email")
        .send({
          previousEmail: "old@example.com",
          newEmail: "new@example.com",
        });
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("message");
    });

    it("should return 400 when newEmail is missing", async () => {
      const res = await request(app)
        .put("/api/settings/email")
        .send({ previousEmail: "old@example.com" });
      expect(res.status).to.equal(400);
    });

    it("should return 400 when previousEmail is missing", async () => {
      const res = await request(app)
        .put("/api/settings/email")
        .send({ newEmail: "new@example.com" });
      expect(res.status).to.equal(400);
    });

    it("should return 400 when body is empty", async () => {
      const res = await request(app).put("/api/settings/email").send({});
      expect(res.status).to.equal(400);
    });
  });

  describe("PUT /api/settings/password", () => {
    it("should return 200 when both fields are provided", async () => {
      const res = await request(app)
        .put("/api/settings/password")
        .send({ previousPassword: "oldpass123", newPassword: "newpass456" });
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("message");
    });

    it("should return 400 when newPassword is missing", async () => {
      const res = await request(app)
        .put("/api/settings/password")
        .send({ previousPassword: "oldpass123" });
      expect(res.status).to.equal(400);
    });

    it("should return 400 when previousPassword is missing", async () => {
      const res = await request(app)
        .put("/api/settings/password")
        .send({ newPassword: "newpass456" });
      expect(res.status).to.equal(400);
    });

    it("should return 400 when body is empty", async () => {
      const res = await request(app).put("/api/settings/password").send({});
      expect(res.status).to.equal(400);
    });
  });

  describe("PUT /api/settings/preferences", () => {
    it("should return 200 when a valid updates array is provided", async () => {
      const res = await request(app)
        .put("/api/settings/preferences")
        .send([{ id: "airport", value: "LAX" }]);
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("message");
    });

    it("should persist updated preference values", async () => {
      await request(app)
        .put("/api/settings/preferences")
        .send([{ id: "airline", value: "United" }]);
      const res = await request(app).get("/api/settings/preferences");
      const airline = res.body.data.find((p) => p.id === "airline");
      expect(airline.value).to.equal("United");
    });

    it("should return 400 when body is not an array", async () => {
      const res = await request(app)
        .put("/api/settings/preferences")
        .send({ id: "airport", value: "LAX" });
      expect(res.status).to.equal(400);
    });

    it("should return 400 when body is an empty array", async () => {
      const res = await request(app).put("/api/settings/preferences").send([]);
      expect(res.status).to.equal(400);
    });
  });
});
