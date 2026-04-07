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

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
