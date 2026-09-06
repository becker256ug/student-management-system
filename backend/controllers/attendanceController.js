const db = require("../config/db");

const createAttendance = async (req, res) => {
  try {
    const {
      enrollment_id,
      class_subject_id,
      attendance_date,
      status,
      remarks,
    } = req.body;

    if (
      !enrollment_id ||
      !class_subject_id ||
      !attendance_date ||
      !status
    ) {
      return res.status(400).json({
        message:
          "enrollment_id, class_subject_id, attendance_date and status are required.",
      });
    }

    if (
      !["present", "absent", "late", "excused"].includes(status)
    ) {
      return res.status(400).json({
        message:
          "Status must be present, absent, late or excused.",
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

    const [existingAttendance] = await db.execute(
      `SELECT id
       FROM attendance
       WHERE enrollment_id = ?
         AND class_subject_id = ?
         AND attendance_date = ?
       LIMIT 1`,
      [
        enrollment_id,
        class_subject_id,
        attendance_date,
      ]
    );

    if (existingAttendance.length > 0) {
      return res.status(409).json({
        message:
          "Attendance has already been recorded for this student, subject and date.",
      });
    }

    const [result] = await db.execute(
      `INSERT INTO attendance
      (
        enrollment_id,
        class_subject_id,
        attendance_date,
        status,
        remarks
      )
      VALUES (?, ?, ?, ?, ?)`,
      [
        enrollment_id,
        class_subject_id,
        attendance_date,
        status,
        remarks || null,
      ]
    );

    return res.status(201).json({
      message: "Attendance recorded successfully.",
      attendanceId: result.insertId,
    });
  } catch (error) {
    console.error("Create attendance error:", error);

    return res.status(500).json({
      message: "Failed to record attendance.",
    });
  }
};

const getAttendance = async (req, res) => {
  try {
    const [attendance] = await db.execute(
      `SELECT
        a.id,
        a.enrollment_id,
        CONCAT(st.first_name, ' ', st.last_name) AS student_name,
        st.student_number,
        a.class_subject_id,
        c.name AS class_name,
        c.code AS class_code,
        s.name AS subject_name,
        s.code AS subject_code,
        a.attendance_date,
        a.status,
        a.remarks,
        a.created_at,
        a.updated_at
      FROM attendance a
      INNER JOIN enrollments e
        ON a.enrollment_id = e.id
      INNER JOIN students st
        ON e.student_id = st.id
      INNER JOIN class_subjects cs
        ON a.class_subject_id = cs.id
      INNER JOIN classes c
        ON cs.class_id = c.id
      INNER JOIN subjects s
        ON cs.subject_id = s.id
      ORDER BY a.attendance_date DESC, a.created_at DESC`
    );

    return res.json(attendance);
  } catch (error) {
    console.error("Get attendance error:", error);

    return res.status(500).json({
      message: "Failed to fetch attendance.",
    });
  }
};

module.exports = {
  createAttendance,
  getAttendance,
};