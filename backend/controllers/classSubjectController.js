const db = require("../config/db");

const createClassSubject = async (req, res) => {
  try {
    const { class_id, subject_id } = req.body;

    if (!class_id || !subject_id) {
      return res.status(400).json({
        message: "class_id and subject_id are required.",
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

    const [subjects] = await db.execute(
      "SELECT id FROM subjects WHERE id = ? LIMIT 1",
      [subject_id]
    );

    if (subjects.length === 0) {
      return res.status(404).json({
        message: "Subject not found.",
      });
    }

    const [existingAssignment] = await db.execute(
      `SELECT id
       FROM class_subjects
       WHERE class_id = ?
         AND subject_id = ?
       LIMIT 1`,
      [class_id, subject_id]
    );

    if (existingAssignment.length > 0) {
      return res.status(409).json({
        message: "Subject is already assigned to this class.",
      });
    }

    const [result] = await db.execute(
      `INSERT INTO class_subjects
      (
        class_id,
        subject_id
      )
      VALUES (?, ?)`,
      [class_id, subject_id]
    );

    return res.status(201).json({
      message: "Subject assigned to class successfully.",
      classSubjectId: result.insertId,
    });
  } catch (error) {
    console.error("Create class subject error:", error);

    return res.status(500).json({
      message: "Failed to assign subject to class.",
    });
  }
};

const getClassSubjects = async (req, res) => {
  try {
    const [classSubjects] = await db.execute(
      `SELECT
        cs.id,
        cs.class_id,
        c.name AS class_name,
        c.code AS class_code,
        cs.subject_id,
        s.name AS subject_name,
        s.code AS subject_code,
        cs.created_at
      FROM class_subjects cs
      INNER JOIN classes c
        ON cs.class_id = c.id
      INNER JOIN subjects s
        ON cs.subject_id = s.id
      ORDER BY cs.created_at DESC`
    );

    return res.json(classSubjects);
  } catch (error) {
    console.error("Get class subjects error:", error);

    return res.status(500).json({
      message: "Failed to fetch class subjects.",
    });
  }
};

module.exports = {
  createClassSubject,
  getClassSubjects,
};