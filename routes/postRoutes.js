const express = require("express");
const app = express();
const postController = require("../controllers/postController");

app.get("/", postController.getAllPosts);
app.post("/", postController.createPost);

module.exports = app;
