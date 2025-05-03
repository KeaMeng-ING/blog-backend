const express = require("express");
const app = express();
const port = 8080;
const cors = require("cors"); // Import CORS
const postRoutes = require("./routes/postRoutes");
const userRoutes = require("./routes/userRoutes");
const commentRoutes = require("./routes/commentRoutes");

app.use(cors()); // Enable CORS
app.use(express.json({ limit: "10mb" })); // Adjust the limit as needed
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.get("/test", (req, res) => {
  res.send("Hello World!");
});
app.use("/api/posts", postRoutes);
app.use("/api/users", userRoutes);
app.use("/api/comments", commentRoutes);

app.listen(port, () => {
  console.log(`Server is running on port https://localhost:${port}`);
});
