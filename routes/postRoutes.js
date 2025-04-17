const express = require("express");
const app = express();
const postController = require("../controllers/postController");
const verifyToken = require("../middleware/verifyToken");

app.get("/", postController.getAllPosts);
app.post("/", verifyToken, postController.createPost);
app.get("/category", verifyToken, postController.getAllCategories);
app.get("/:slug", verifyToken, postController.getPostBySlugAndSamePosts);
app.put("/:slug/incrementViews", postController.incrementViews);

module.exports = app;
