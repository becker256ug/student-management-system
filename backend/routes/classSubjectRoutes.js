const express = require("express");

const {
  createClassSubject,
  getClassSubjects,
} = require("../controllers/classSubjectController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authenticateToken);

router.post(
  "/",
  authorizeRoles("admin", "registrar"),
  createClassSubject
);

router.get("/", getClassSubjects);

module.exports = router;