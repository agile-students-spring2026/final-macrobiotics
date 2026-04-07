import express from "express";

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("API route reached successfully");
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
