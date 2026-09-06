const express = require("express");

const {
  createResult,
  getResults,
} = require("../controllers/resultController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authenticateToken);

router.post(
  "/",
  authorizeRoles("admin", "registrar"),
  createResult
);

router.get("/", getResults);

module.exports = router;