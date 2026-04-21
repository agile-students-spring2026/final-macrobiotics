import request from "supertest";
import app from "../server.js";
import { clearUsers } from "../repositories/userRepository.js";

export const resetAuthState = async () => {
  await clearUsers();
};

export const signupAndGetToken = async ({
  email = "user@example.com",
  password = "password123",
} = {}) => {
  const response = await request(app)
    .post("/api/signup")
    .send({ email, password });

  return {
    response,
    token: response.body?.data?.token ?? "",
    email,
    password,
  };
};
