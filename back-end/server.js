import "./config/env.js";
import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createAuthToken,
  hashPassword,
  isValidEmail,
  isValidPassword,
  normalizeEmail,
  requireAuth,
  verifyPassword,
} from "./auth.js";
import { connectToDatabase } from "./config/database.js";
import redisClient, { ensureRedisConnection } from "./config/redis.js";
import {
  createUser,
  findUserByEmail,
  replaceUser,
} from "./repositories/userRepository.js";
import User from "./models/User.js";
import { getSeatsAeroTripDetail, searchSeatsAeroFlights } from "./seatsAero.js";
import { startPrefetchJob } from "./workers/prefetch.js";
import { validateSearchParams } from "./seatsAero.js";
import { isDatabaseConnected } from "./config/database.js";

const app = express();
const port = 3000;
const currentFilePath = fileURLToPath(import.meta.url);
const isDirectExecution =
  process.argv[1] != null && path.resolve(process.argv[1]) === currentFilePath;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (_req, res) => {
  res.send("API route reached successfully");
});

app.get("/api/search/flights", async (req, res) => {
  try {
    const { origin, destination, date } = req.query;
    const { normalizedOrigin, normalizedDestination } = validateSearchParams(
      origin,
      destination,
      date,
    );
    const cacheKey = `search:${normalizedOrigin}:${normalizedDestination}:${date}`;

    try {
      const cacheClient = await ensureRedisConnection();
      const cachedData = cacheClient ? await cacheClient.get(cacheKey) : null;

      if (cachedData) {
        return res.status(200).json({
          message: "Flights retrieved successfully from cache",
          data: JSON.parse(cachedData),
        });
      }
    } catch (_error) {
      // Cache availability should not block live search results.
    }

    const flights = await searchSeatsAeroFlights({
      origin: normalizedOrigin,
      destination: normalizedDestination,
      date,
    });

    res.status(200).json({
      message: "Flights retrieved successfully from API",
      data: flights,
    });
  } catch (error) {
    res.status(error.statusCode ?? 500).json({
      message: error.message ?? "Unable to retrieve flights.",
    });
  }
});

app.get(
  "/api/search/flights/:availabilityId/trips/:tripId",
  async (req, res) => {
    try {
      const flight = await getSeatsAeroTripDetail({
        availabilityId: req.params.availabilityId,
        tripId: req.params.tripId,
      });

      res.status(200).json({
        message: "Flight details retrieved successfully",
        data: flight,
      });
    } catch (error) {
      res.status(error.statusCode ?? 500).json({
        message: error.message ?? "Unable to retrieve flight details.",
      });
    }
  },
);

app.post("/api/login", async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const { password } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required.",
    });
  }

  try {
    const user = await findUserByEmail(email);

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    return res.status(200).json({
      message: "Login successful.",
      data: {
        email: user.email,
        token: createAuthToken(user),
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message ?? "Unable to log in.",
    });
  }
});

app.post("/api/signup", async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const { password } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required.",
    });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({
      message: "A valid email address is required.",
    });
  }

  if (!isValidPassword(password)) {
    return res.status(400).json({
      message: "Password must be at least 6 characters long.",
    });
  }

  try {
    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      return res.status(409).json({
        message: "An account with that email already exists.",
      });
    }

    const user = await createUser({
      email,
      passwordHash: await hashPassword(password),
    });

    return res.status(201).json({
      message: "Account successfully created.",
      data: {
        email: user.email,
        token: createAuthToken(user),
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message ?? "Unable to create account.",
    });
  }
});

app.get("/api/settings/preferences", requireAuth, async (req, res) => {
  res.status(200).json({
    message: "Preferences retrieved successfully",
    data: req.user.preferences,
  });
});

app.put("/api/settings/email", requireAuth, async (req, res) => {
  const previousEmail = normalizeEmail(req.body?.previousEmail);
  const newEmail = normalizeEmail(req.body?.newEmail);

  if (!previousEmail || !newEmail) {
    return res
      .status(400)
      .json({ message: "previousEmail and newEmail are required." });
  }

  if (req.user.email !== previousEmail) {
    return res.status(400).json({
      message: "previousEmail does not match the current account.",
    });
  }

  if (!isValidEmail(newEmail)) {
    return res.status(400).json({
      message: "A valid email address is required.",
    });
  }

  const existingUser = await findUserByEmail(newEmail);

  if (existingUser && existingUser.id !== req.user.id) {
    return res.status(409).json({
      message: "An account with that email already exists.",
    });
  }

  const updatedUser = await replaceUser({
    ...req.user,
    email: newEmail,
  });

  req.user = updatedUser;

  res.status(200).json({
    message: "Email updated successfully.",
    data: {
      email: updatedUser.email,
    },
  });
});

app.put("/api/settings/password", requireAuth, async (req, res) => {
  const { previousPassword, newPassword } = req.body ?? {};

  if (!previousPassword || !newPassword) {
    return res
      .status(400)
      .json({ message: "previousPassword and newPassword are required." });
  }

  if (!(await verifyPassword(previousPassword, req.user.passwordHash))) {
    return res.status(400).json({
      message: "previousPassword is incorrect.",
    });
  }

  if (!isValidPassword(newPassword)) {
    return res.status(400).json({
      message: "Password must be at least 6 characters long.",
    });
  }

  const updatedUser = await replaceUser({
    ...req.user,
    passwordHash: await hashPassword(newPassword),
  });

  req.user = updatedUser;

  res.status(200).json({ message: "Password updated successfully." });
});

app.put("/api/settings/preferences", requireAuth, async (req, res) => {
  const updates = req.body;

  if (!Array.isArray(updates) || updates.length === 0) {
    return res.status(400).json({
      message: "Request body must be a non-empty array of preference updates.",
    });
  }

  const updatedPreferences = req.user.preferences.map((preference) => {
    const matchingUpdate = updates.find(
      (update) => update.id === preference.id,
    );

    if (!matchingUpdate) {
      return preference;
    }

    return {
      ...preference,
      value: matchingUpdate.value,
    };
  });

  const updatedUser = await replaceUser({
    ...req.user,
    preferences: updatedPreferences,
  });

  req.user = updatedUser;

  res.status(200).json({
    message: "Preferences updated successfully.",
    data: updatedUser.preferences,
  });
});

app.get("/api/bookmarks", requireAuth, async (req, res) => {
  if (!isDatabaseConnected()) {
    return res.status(503).json({
      message: "Database connection is required to retrieve bookmarks.",
    });
  }

  const user = await User.findById(req.user.id, {
    bookmarks: 1,
  });

  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  res.status(200).json({
    message: "Bookmarks retrieved successfully",
    data: user.bookmarks ?? [],
  });
});

app.post("/api/bookmarks", requireAuth, async (req, res) => {
  const bookmarkPayload = req.body;

  if (!bookmarkPayload?.id) {
    return res.status(400).json({
      message: "Bookmark id is required.",
    });
  }

  if (!isDatabaseConnected()) {
    return res.status(503).json({
      message: "Database connection is required to save bookmarks.",
    });
  }

  const userId = req.user.id;

  const existingBookmark = await User.exists({
    _id: userId,
    "bookmarks.id": bookmarkPayload.id,
  });

  if (existingBookmark) {
    const updateResult = await User.updateOne(
      { _id: userId, "bookmarks.id": bookmarkPayload.id },
      {
        $set: {
          "bookmarks.$": bookmarkPayload,
        },
      },
    );

    if (!updateResult.matchedCount) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({
      message: "Bookmark updated successfully.",
      data: bookmarkPayload,
    });
  }

  const createdBookmarkUser = await User.findByIdAndUpdate(
    userId,
    {
      $push: {
        bookmarks: bookmarkPayload,
      },
    },
    {
      new: true,
      projection: { _id: 1 },
    },
  );

  if (!createdBookmarkUser) {
    return res.status(404).json({ message: "User not found." });
  }

  res.status(201).json({
    message: "Bookmark saved successfully.",
    data: bookmarkPayload,
  });
});

app.delete("/api/bookmarks/:id", requireAuth, async (req, res) => {
  if (!isDatabaseConnected()) {
    return res.status(503).json({
      message: "Database connection is required to delete bookmarks.",
    });
  }

  const bookmarkId = req.params.id;
  const bookmarkExists = await User.exists({
    _id: req.user.id,
    "bookmarks.id": bookmarkId,
  });

  if (!bookmarkExists) {
    return res.status(404).json({ message: "Bookmark not found." });
  }

  const updateResult = await User.updateOne(
    { _id: req.user.id },
    {
      $pull: {
        bookmarks: { id: bookmarkId },
      },
    },
  );

  if (!updateResult.matchedCount) {
    return res.status(404).json({ message: "User not found." });
  }

  res.status(200).json({ message: "Bookmark deleted successfully!" });
});

const startServer = async () => {
  try {
    await connectToDatabase();

    try {
      await ensureRedisConnection();
    } catch (error) {
      console.warn("Redis cache unavailable at startup:", error.message);
    }

    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);

      const mongoUri = process.env.MONGO_URI;

      if (isDatabaseConnected() && mongoUri?.includes("@")) {
        const mongoClusterDomain = mongoUri.split("@")[1]?.split("/")[0] ?? "";

        if (mongoClusterDomain) {
          console.log("Connected to MongoDB at", mongoClusterDomain);
        }
      }

      if (redisClient?.isOpen && process.env.REDIS_URL?.includes("@")) {
        console.log(
          "Connected to Redis at",
          process.env.REDIS_URL.split("@")[1],
        );
      }

      startPrefetchJob();
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

if (isDirectExecution) {
  startServer();
}

export { app, startServer };
export default app;
