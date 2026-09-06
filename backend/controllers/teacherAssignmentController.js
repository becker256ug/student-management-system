const db = require("../config/db");

const createTeacherAssignment = async (req, res) => {
  try {
    const {
      teacher_id,
      class_subject_id,
      semester_id,
    } = req.body;

    if (!teacher_id || !class_subject_id || !semester_id) {
      return res.status(400).json({
        message:
          "teacher_id, class_subject_id and semester_id are required.",
      });
    }

    const [teachers] = await db.execute(
      "SELECT id FROM teachers WHERE id = ? LIMIT 1",
      [teacher_id]
    );

    if (teachers.length === 0) {
      return res.status(404).json({
        message: "Teacher not found.",
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
        message: "Class subject assignment not found.",
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

    const [existingAssignment] = await db.execute(
      `SELECT id
       FROM teacher_assignments
       WHERE teacher_id = ?
         AND class_subject_id = ?
         AND semester_id = ?
       LIMIT 1`,
      [teacher_id, class_subject_id, semester_id]
    );

    if (existingAssignment.length > 0) {
      return res.status(409).json({
        message:
          "Teacher is already assigned to this class subject for this semester.",
      });
    }

    const [result] = await db.execute(
      `INSERT INTO teacher_assignments
      (
        teacher_id,
        class_subject_id,
        semester_id
      )
      VALUES (?, ?, ?)`,
      [teacher_id, class_subject_id, semester_id]
    );

    return res.status(201).json({
      message: "Teacher assigned successfully.",
      teacherAssignmentId: result.insertId,
    });
  } catch (error) {
    console.error("Create teacher assignment error:", error);

    return res.status(500).json({
      message: "Failed to create teacher assignment.",
    });
  }
};

const getTeacherAssignments = async (req, res) => {
  try {
    const [assignments] = await db.execute(
      `SELECT
        ta.id,
        ta.teacher_id,
        CONCAT(t.first_name, ' ', t.last_name) AS teacher_name,
        ta.class_subject_id,
        c.name AS class_name,
        c.code AS class_code,
        s.name AS subject_name,
        s.code AS subject_code,
        ta.semester_id,
        sem.name AS semester,
        ta.created_at,
        ta.updated_at
      FROM teacher_assignments ta
      INNER JOIN teachers t
        ON ta.teacher_id = t.id
      INNER JOIN class_subjects cs
        ON ta.class_subject_id = cs.id
      INNER JOIN classes c
        ON cs.class_id = c.id
      INNER JOIN subjects s
        ON cs.subject_id = s.id
      INNER JOIN semesters sem
        ON ta.semester_id = sem.id
      ORDER BY ta.created_at DESC`
    );

    return res.json(assignments);
  } catch (error) {
    console.error("Get teacher assignments error:", error);

    return res.status(500).json({
      message: "Failed to fetch teacher assignments.",
    });
  }
};

module.exports = {
  createTeacherAssignment,
  getTeacherAssignments,
};