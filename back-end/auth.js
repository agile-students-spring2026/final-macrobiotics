import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { findUserById } from "./repositories/userRepository.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_JWT_SECRET = "milely-local-dev-secret";
const JWT_EXPIRATION = "7d";

export const normalizeEmail = (email) => {
  if (typeof email !== "string") {
    return "";
  }

  return email.trim().toLowerCase();
};

export const isValidEmail = (email) => EMAIL_PATTERN.test(email);

export const isValidPassword = (password) =>
  typeof password === "string" && password.trim().length >= 6;

export const hashPassword = async (password) => bcrypt.hash(password, 10);

export const verifyPassword = async (password, passwordHash) =>
  bcrypt.compare(password, passwordHash);

export const getJwtSecret = () => {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }

  return DEFAULT_JWT_SECRET;
};

export const createAuthToken = (user) =>
  jwt.sign(
    {
      sub: user.id,
      email: user.email,
    },
    getJwtSecret(),
    { expiresIn: JWT_EXPIRATION },
  );

export const optionalAuth = async (req, _res, next) => {
  const authorizationHeader = req.get("authorization");

  if (!authorizationHeader?.startsWith("Bearer ")) {
    return next();
  }

  try {
    const token = authorizationHeader.slice("Bearer ".length).trim();
    const payload = jwt.verify(token, getJwtSecret());
    const user = await findUserById(payload.sub);
    if (user) req.user = user;
  } catch (_error) {
    // Invalid token is silently ignored for optional auth
  }

  next();
};

export const requireAuth = async (req, res, next) => {
  const authorizationHeader = req.get("authorization");

  if (!authorizationHeader?.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Authorization token required.",
    });
  }

  try {
    const token = authorizationHeader.slice("Bearer ".length).trim();
    const payload = jwt.verify(token, getJwtSecret());
    const user = await findUserById(payload.sub);

    if (!user) {
      return res.status(401).json({
        message: "Authorization token is invalid.",
      });
    }

    req.user = user;
    next();
  } catch (_error) {
    return res.status(401).json({
      message: "Authorization token is invalid.",
    });
  }
};
