const express = require("express");
const app = express();
const commentController = require("../controllers/commentController");
const verifyToken = require("../middleware/verifyToken");

app.get("/:slug", verifyToken, commentController.getCommentsByPostSlug);
app.post("/", verifyToken, commentController.createComment);
app.put("/", verifyToken, commentController.updateComment);
app.delete("/:id", verifyToken, commentController.deleteComment);

module.exports = app;
