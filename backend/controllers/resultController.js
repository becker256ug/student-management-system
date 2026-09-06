const db = require("../config/db");

const createResult = async (req, res) => {
  try {
    const {
      enrollment_id,
      class_subject_id,
      marks,
      grade,
      remarks,
    } = req.body;

    if (
      !enrollment_id ||
      !class_subject_id ||
      marks === undefined ||
      marks === null
    ) {
      return res.status(400).json({
        message:
          "enrollment_id, class_subject_id and marks are required.",
      });
    }

    const numericMarks = Number(marks);

    if (
      Number.isNaN(numericMarks) ||
      numericMarks < 0 ||
      numericMarks > 100
    ) {
      return res.status(400).json({
        message: "marks must be a number between 0 and 100.",
      });
    }

    const [enrollments] = await db.execute(
      "SELECT id FROM enrollments WHERE id = ? LIMIT 1",
      [enrollment_id]
    );

    if (enrollments.length === 0) {
      return res.status(404).json({
        message: "Enrollment not found.",
      });
    }

    const [classSubjects] = await db.execute(
      `SELECT id
       FROM class_subjects
       WHERE id = ?
       LIMIT 1`,
      [class_subject_id]
    );

    if (classSubjects.length === 0) {
      return res.status(404).json({
        message: "Class subject not found.",
      });
    }

    const [existingResult] = await db.execute(
      `SELECT id
       FROM results
       WHERE enrollment_id = ?
         AND class_subject_id = ?
       LIMIT 1`,
      [enrollment_id, class_subject_id]
    );

    if (existingResult.length > 0) {
      return res.status(409).json({
        message:
          "A result already exists for this student and subject.",
      });
    }

    const [result] = await db.execute(
      `INSERT INTO results
      (
        enrollment_id,
        class_subject_id,
        marks,
        grade,
        remarks
      )
      VALUES (?, ?, ?, ?, ?)`,
      [
        enrollment_id,
        class_subject_id,
        numericMarks,
        grade || null,
        remarks || null,
      ]
    );

    return res.status(201).json({
      message: "Result recorded successfully.",
      resultId: result.insertId,
    });
  } catch (error) {
    console.error("Create result error:", error);

    return res.status(500).json({
      message: "Failed to record result.",
    });
  }
};

const getResults = async (req, res) => {
  try {
    const [results] = await db.execute(
      `SELECT
        r.id,
        r.enrollment_id,
        CONCAT(st.first_name, ' ', st.last_name) AS student_name,
        st.student_number,
        r.class_subject_id,
        c.name AS class_name,
        c.code AS class_code,
        s.name AS subject_name,
        s.code AS subject_code,
        r.marks,
        r.grade,
        r.remarks,
        r.created_at,
        r.updated_at
      FROM results r
      INNER JOIN enrollments e
        ON r.enrollment_id = e.id
      INNER JOIN students st
        ON e.student_id = st.id
      INNER JOIN class_subjects cs
        ON r.class_subject_id = cs.id
      INNER JOIN classes c
        ON cs.class_id = c.id
      INNER JOIN subjects s
        ON cs.subject_id = s.id
      ORDER BY r.created_at DESC`
    );

    return res.json(results);
  } catch (error) {
    console.error("Get results error:", error);

    return res.status(500).json({
      message: "Failed to fetch results.",
    });
  }
};

module.exports = {
  createResult,
  getResults,
};