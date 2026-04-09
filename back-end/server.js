import "./config/env.js";
import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { v4 as uuidv4 } from "uuid";
import { getSeatsAeroTripDetail, searchSeatsAeroFlights } from "./seatsAero.js";

const app = express();
const port = 3000;
const currentFilePath = fileURLToPath(import.meta.url);
const isDirectExecution =
  process.argv[1] != null && path.resolve(process.argv[1]) === currentFilePath;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("API route reached successfully");
});

app.get("/api/search/flights", async (req, res) => {
  try {
    const flights = await searchSeatsAeroFlights({
      origin: req.query.origin,
      destination: req.query.destination,
      date: req.query.date,
    });

    res.status(200).json({
      message: "Flights retrieved successfully",
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

// Mock user settings (Sprint 2: in-memory, no persistence required)
const userSettings = {
  email: "user@example.com",
  preferences: [
    { id: "airport", label: "Default Airport", value: "JFK" },
    { id: "airline", label: "Default Airline", value: "Delta" },
    {
      id: "card",
      label: "Default Credit Card",
      value: "Chase Sapphire Preferred",
    },
  ],
};

app.get("/api/settings/preferences", (_req, res) => {
  res.status(200).json({
    message: "Preferences retrieved successfully",
    data: userSettings.preferences,
  });
});

app.put("/api/settings/email", (req, res) => {
  const { previousEmail, newEmail } = req.body;
  if (!previousEmail || !newEmail) {
    return res
      .status(400)
      .json({ message: "previousEmail and newEmail are required." });
  }
  res.status(200).json({ message: "Email updated successfully." });
});

app.put("/api/settings/password", (req, res) => {
  const { previousPassword, newPassword } = req.body;
  if (!previousPassword || !newPassword) {
    return res
      .status(400)
      .json({ message: "previousPassword and newPassword are required." });
  }
  res.status(200).json({ message: "Password updated successfully." });
});

app.put("/api/settings/preferences", (req, res) => {
  const updates = req.body;
  if (!Array.isArray(updates) || updates.length === 0) {
    return res.status(400).json({
      message: "Request body must be a non-empty array of preference updates.",
    });
  }
  updates.forEach(({ id, value }) => {
    const pref = userSettings.preferences.find((p) => p.id === id);
    if (pref) pref.value = value;
  });
  res.status(200).json({ message: "Preferences updated successfully." });
});

//TODO: Will need to intercept the flight API to assign our own UUIDs to each flight

let bookmarks = [];

// Export bookmarks for testing
export { bookmarks };
export { app };
export default app;

//TODO: Add authenticated route param for users
app.get("/api/bookmarks", (req, res) => {
  res
    .status(200)
    .json({ message: "Bookmarks retrieved successfully", data: bookmarks });
});

app.post("/api/bookmarks", (req, res) => {
  // console.log("Bookmark request received:\n", {
  //   id: req.body.id,
  //   flightNo: req.body.flightNo,
  //   depAirport: req.body.depAirport,
  //   arrAirport: req.body.arrAirport,
  // });
  if (!bookmarks.some((b) => b.id === req.body.id)) {
    bookmarks.push(req.body);
    res
      .status(201)
      .json({ message: "Bookmark saved successfully.", data: req.body });
  } else {
    // console.log("Bookmark already exists for ID:", req.body.id);
    res.status(400).json({ message: "Bookmark already exists." });
  }
});

app.delete("/api/bookmarks/:id", (req, res) => {
  const id = req.params.id;
  const index = bookmarks.findIndex((bookmark) => bookmark.id == id);
  // console.log("Delete request received for ID:", id);
  // console.log(
  //   "Currently available IDs:",
  //   bookmarks.map((b) => b.id),
  // );
  // console.log("Bookmark found with index", index);
  if (index !== -1) {
    bookmarks.splice(index, 1);
    res.status(200).json({ message: "Bookmark deleted successfully!" });
  } else {
    res.status(404).json({ message: "Bookmark not found." });
  }
});

if (process.env.NODE_ENV !== "test" && isDirectExecution) {
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

app.get("/", (req, res) => {
  res.send("Route retrieved successfully");
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and Password required.",
    });
  }

  res.status(200).json({
    message: "Login successful.",

    data: {
      email,
    },
  });
});

app.post("/api/signup", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and Password required.",
    });
  }

  res.status(201).json({
    message: "Account successfully created.",

    data: {
      email,
    },
  });
});
