const db = require("../config/db");

const createStudent = async (req, res) => {
  try {
    const {
      student_number,
      first_name,
      last_name,
      gender,
      date_of_birth,
      email,
      phone,
      address,
      guardian_name,
      guardian_phone,
      class_name,
    } = req.body;

    // Required fields
    if (
      !student_number ||
      !first_name ||
      !last_name ||
      !gender ||
      !date_of_birth
    ) {
      return res.status(400).json({
        message: "Please fill in all required fields.",
      });
    }

    const [result] = await db.execute(
      `INSERT INTO students
      (
        student_number,
        first_name,
        last_name,
        gender,
        date_of_birth,
        email,
        phone,
        address,
        guardian_name,
        guardian_phone,
        class_name
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        student_number,
        first_name,
        last_name,
        gender,
        date_of_birth,
        email || null,
        phone || null,
        address || null,
        guardian_name || null,
        guardian_phone || null,
        class_name || null,
      ]
    );

    res.status(201).json({
      message: "Student registered successfully.",
      studentId: result.insertId,
    });
  } catch (error) {
    console.error("Create student error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Student number already exists.",
      });
    }

    res.status(500).json({
      message: "Failed to register student.",
    });
  }
};

const getStudents = async (req, res) => {
  try {
    const [students] = await db.execute(
      "SELECT * FROM students ORDER BY created_at DESC"
    );

    res.json(students);
  } catch (error) {
    console.error("Get students error:", error);

    res.status(500).json({
      message: "Failed to fetch students.",
    });
  }
};

module.exports = {
  createStudent,
  getStudents,
};