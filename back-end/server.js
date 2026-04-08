import express from "express";
import cors from "cors";

const app = express();
const port = 3000;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("API route reached successfully");
});

let bookmarks = [];

//TODO: Add authenticated route param for users
app.get("/api/bookmarks", (req, res) => {
  res
    .status(200)
    .json({ message: "Bookmarks retrieved successfully", data: bookmarks });
});

//TODO: Deduplicate entries when integrating with db
app.post("/api/bookmarks", (req, res) => {
  console.log("Bookmark request received:\n", {
    flightNo: req.body.flightNo,
    depAirport: req.body.depAirport,
    arrAirport: req.body.arrAirport,
  });
  bookmarks.push(req.body);
  res.status(201).json({ message: "Bookmark received", data: req.body });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
