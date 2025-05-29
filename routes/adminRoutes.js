const express = require("express");
const app = express();
const adminController = require("../controllers/adminController");
const verifyToken = require("../middleware/verifyToken");

app.get("/dashboard", verifyToken, adminController.dashboardData);
app.get("/category", verifyToken, adminController.categoryData);
app.get("/recentUser", verifyToken, adminController.recentUser);
app.get("/recentPost", verifyToken, adminController.recentPost);

module.exports = app;
