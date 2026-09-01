const express = require("express");

const {
  createStudent,
  getStudents,
} = require("../controllers/studentController");

const router = express.Router();

router.post("/", createStudent);
router.get("/", getStudents);

module.exports = router;