const express = require("express");
const { getTotalUsers } = require("../controllers/userController");

const router = express.Router();

// Dashboard Routes
router.get("/dashboard/totalUsers", getTotalUsers);

module.exports = router;
