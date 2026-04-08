import express from "express";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";

const app = express();
const port = 3000;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("API route reached successfully");
});

//TODO: Will need to intercept the flight API to assign our own UUIDs to each flight

let bookmarks = [];

//TODO: Add authenticated route param for users
app.get("/api/bookmarks", (req, res) => {
  res
    .status(200)
    .json({ message: "Bookmarks retrieved successfully", data: bookmarks });
});

app.post("/api/bookmarks", (req, res) => {
  console.log("Bookmark request received:\n", {
    id: req.body.id,
    flightNo: req.body.flightNo,
    depAirport: req.body.depAirport,
    arrAirport: req.body.arrAirport,
  });
  if (!bookmarks.some((b) => b.id === req.body.id)) {
    bookmarks.push(req.body);
    res
      .status(201)
      .json({ message: "Bookmark saved successfully.", data: req.body });
  } else {
    console.log("Bookmark already exists for ID:", req.body.id);
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

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
