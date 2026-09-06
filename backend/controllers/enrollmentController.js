const db = require("../config/db");

const createEnrollment = async (req, res) => {
  try {
    const {
      student_id,
      semester_id,
      class_id,
      enrollment_date,
      status,
    } = req.body;

    if (
      !student_id ||
      !semester_id ||
      !class_id ||
      !enrollment_date
    ) {
      return res.status(400).json({
        message:
          "student_id, semester_id, class_id and enrollment_date are required.",
      });
    }

    if (
      status &&
      !["active", "completed", "withdrawn"].includes(status)
    ) {
      return res.status(400).json({
        message:
          "Status must be active, completed or withdrawn.",
      });
    }

    const [students] = await db.execute(
      "SELECT id FROM students WHERE id = ? LIMIT 1",
      [student_id]
    );

    if (students.length === 0) {
      return res.status(404).json({
        message: "Student not found.",
      });
    }

    const [semesters] = await db.execute(
      "SELECT id FROM semesters WHERE id = ? LIMIT 1",
      [semester_id]
    );

    if (semesters.length === 0) {
      return res.status(404).json({
        message: "Semester not found.",
      });
    }

    const [classes] = await db.execute(
      "SELECT id FROM classes WHERE id = ? LIMIT 1",
      [class_id]
    );

    if (classes.length === 0) {
      return res.status(404).json({
        message: "Class not found.",
      });
    }

    const [existingEnrollment] = await db.execute(
      `SELECT id
       FROM enrollments
       WHERE student_id = ?
         AND semester_id = ?
       LIMIT 1`,
      [student_id, semester_id]
    );

    if (existingEnrollment.length > 0) {
      return res.status(409).json({
        message:
          "Student is already enrolled in this semester.",
      });
    }

    const [result] = await db.execute(
      `INSERT INTO enrollments
      (
        student_id,
        semester_id,
        class_id,
        enrollment_date,
        status
      )
      VALUES (?, ?, ?, ?, ?)`,
      [
        student_id,
        semester_id,
        class_id,
        enrollment_date,
        status || "active",
      ]
    );

    return res.status(201).json({
      message: "Student enrolled successfully.",
      enrollmentId: result.insertId,
    });
  } catch (error) {
    console.error("Create enrollment error:", error);

    return res.status(500).json({
      message: "Failed to create enrollment.",
    });
  }
};

const getEnrollments = async (req, res) => {
  try {
    const [enrollments] = await db.execute(
      `SELECT
        e.id,
        e.student_id,
        CONCAT(s.first_name, ' ', s.last_name) AS student_name,
        e.semester_id,
        sem.name AS semester,
        e.class_id,
        c.name AS class_name,
        c.code AS class_code,
        e.enrollment_date,
        e.status,
        e.created_at,
        e.updated_at
      FROM enrollments e
      INNER JOIN students s
        ON e.student_id = s.id
      INNER JOIN semesters sem
        ON e.semester_id = sem.id
      INNER JOIN classes c
        ON e.class_id = c.id
      ORDER BY e.enrollment_date DESC`
    );

    return res.json(enrollments);
  } catch (error) {
    console.error("Get enrollments error:", error);

    return res.status(500).json({
      message: "Failed to fetch enrollments.",
    });
  }
};

module.exports = {
  createEnrollment,
  getEnrollments,
};