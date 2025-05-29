const express = require("express");
const app = express();
const categoryController = require("../controllers/categoryController");
const verifyToken = require("../middleware/verifyToken");

app.get("/", verifyToken, categoryController.getAllCategories);

module.exports = app;
