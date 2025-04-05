const express = require("express");
const app = express();
const authMiddleware = require("../middleware/auth");
const userController = require("../controllers/userController");
const verifyToken = require("../middleware/verifyToken");

app.post("/login", userController.logIn);
app.post("/signup", userController.signUp);

module.exports = app;
