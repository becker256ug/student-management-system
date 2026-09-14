const db = require("../config/db");

/*
=========================================================
CREATE SUBJECT / COURSE UNIT
=========================================================
*/
const createSubject = async (req, res) => {
  try {
    const {
      name,
      code,
      description,
      status,
    } = req.body;

    const subjectName = String(name || "").trim();
    const subjectCode = String(code || "")
      .trim()
      .toUpperCase();
    const subjectDescription =
      String(description || "").trim();

    // Validate required fields
    if (!subjectName || !subjectCode) {
      return res.status(400).json({
        message: "Course unit name and code are required.",
      });
    }

    // Validate status
    if (
      status &&
      !["active", "inactive"].includes(status)
    ) {
      return res.status(400).json({
        message: "Status must be active or inactive.",
      });
    }

    // Check duplicate code
    const [existingSubjects] = await db.execute(
      `SELECT id
       FROM subjects
       WHERE code = ?
       LIMIT 1`,
      [subjectCode]
    );

    if (existingSubjects.length > 0) {
      return res.status(409).json({
        message: "Course unit code already exists.",
      });
    }

    // Create course unit
    const [result] = await db.execute(
      `INSERT INTO subjects
       (
         name,
         code,
         description,
         status
       )
       VALUES (?, ?, ?, ?)`,
      [
        subjectName,
        subjectCode,
        subjectDescription || null,
        status || "active",
      ]
    );

    return res.status(201).json({
      message: "Course unit created successfully.",
      subjectId: result.insertId,
    });
  } catch (error) {
    console.error("Create subject error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Course unit code already exists.",
      });
    }

    return res.status(500).json({
      message: "Failed to create course unit.",
    });
  }
};


/*
=========================================================
GET ALL SUBJECTS / COURSE UNITS
=========================================================
*/
const getSubjects = async (req, res) => {
  try {
    const [subjects] = await db.execute(
      `SELECT
         id,
         name,
         code,
         description,
         status,
         created_at,
         updated_at
       FROM subjects
       ORDER BY created_at DESC`
    );

    return res.json(subjects);
  } catch (error) {
    console.error("Get subjects error:", error);

    return res.status(500).json({
      message: "Failed to fetch course units.",
    });
  }
};


/*
=========================================================
GET ONE SUBJECT / COURSE UNIT
=========================================================
*/
const getSubjectById = async (req, res) => {
  try {
    const { id } = req.params;

    const [subjects] = await db.execute(
      `SELECT
         id,
         name,
         code,
         description,
         status,
         created_at,
         updated_at
       FROM subjects
       WHERE id = ?
       LIMIT 1`,
      [id]
    );

    if (subjects.length === 0) {
      return res.status(404).json({
        message: "Course unit not found.",
      });
    }

    return res.json(subjects[0]);
  } catch (error) {
    console.error(
      "Get subject by ID error:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch course unit.",
    });
  }
};


/*
=========================================================
UPDATE SUBJECT / COURSE UNIT
=========================================================
*/
const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      code,
      description,
      status,
    } = req.body;

    const subjectName = String(name || "").trim();
    const subjectCode = String(code || "")
      .trim()
      .toUpperCase();
    const subjectDescription =
      String(description || "").trim();

    // Validate required fields
    if (!subjectName || !subjectCode) {
      return res.status(400).json({
        message: "Course unit name and code are required.",
      });
    }

    // Validate status
    if (
      status &&
      !["active", "inactive"].includes(status)
    ) {
      return res.status(400).json({
        message: "Status must be active or inactive.",
      });
    }

    // Check subject exists
    const [existingSubject] = await db.execute(
      `SELECT id
       FROM subjects
       WHERE id = ?
       LIMIT 1`,
      [id]
    );

    if (existingSubject.length === 0) {
      return res.status(404).json({
        message: "Course unit not found.",
      });
    }

    // Check whether another subject uses the code
    const [duplicateCode] = await db.execute(
      `SELECT id
       FROM subjects
       WHERE code = ?
         AND id <> ?
       LIMIT 1`,
      [subjectCode, id]
    );

    if (duplicateCode.length > 0) {
      return res.status(409).json({
        message: "Course unit code already exists.",
      });
    }

    await db.execute(
      `UPDATE subjects
       SET
         name = ?,
         code = ?,
         description = ?,
         status = ?
       WHERE id = ?`,
      [
        subjectName,
        subjectCode,
        subjectDescription || null,
        status || "active",
        id,
      ]
    );

    return res.json({
      message: "Course unit updated successfully.",
    });
  } catch (error) {
    console.error("Update subject error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Course unit code already exists.",
      });
    }

    return res.status(500).json({
      message: "Failed to update course unit.",
    });
  }
};


/*
=========================================================
ACTIVATE / DEACTIVATE SUBJECT
=========================================================
*/
const updateSubjectStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (
      !["active", "inactive"].includes(status)
    ) {
      return res.status(400).json({
        message: "Status must be active or inactive.",
      });
    }

    const [existingSubject] = await db.execute(
      `SELECT id
       FROM subjects
       WHERE id = ?
       LIMIT 1`,
      [id]
    );

    if (existingSubject.length === 0) {
      return res.status(404).json({
        message: "Course unit not found.",
      });
    }

    await db.execute(
      `UPDATE subjects
       SET status = ?
       WHERE id = ?`,
      [status, id]
    );

    return res.json({
      message:
        status === "active"
          ? "Course unit activated successfully."
          : "Course unit deactivated successfully.",
    });
  } catch (error) {
    console.error(
      "Update subject status error:",
      error
    );

    return res.status(500).json({
      message: "Failed to update course unit status.",
    });
  }
};


/*
=========================================================
DELETE SUBJECT / COURSE UNIT
=========================================================
*/
const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;

    // Check subject exists
    const [existingSubject] = await db.execute(
      `SELECT id, name
       FROM subjects
       WHERE id = ?
       LIMIT 1`,
      [id]
    );

    if (existingSubject.length === 0) {
      return res.status(404).json({
        message: "Course unit not found.",
      });
    }

    /*
    Check whether this course unit is already
    connected to any class through class_subjects.

    We must preserve academic history.
    */
    const [classSubjects] = await db.execute(
      `SELECT id
       FROM class_subjects
       WHERE subject_id = ?
       LIMIT 1`,
      [id]
    );

    if (classSubjects.length > 0) {
      return res.status(409).json({
        message:
          "This course unit is already assigned to a class and cannot be permanently deleted. Deactivate it instead.",
      });
    }

    await db.execute(
      `DELETE FROM subjects
       WHERE id = ?`,
      [id]
    );

    return res.json({
      message: "Course unit deleted successfully.",
    });
  } catch (error) {
    console.error("Delete subject error:", error);

    if (
      error.code === "ER_ROW_IS_REFERENCED_2" ||
      error.code === "ER_ROW_IS_REFERENCED"
    ) {
      return res.status(409).json({
        message:
          "This course unit is being used by other records and cannot be deleted. Deactivate it instead.",
      });
    }

    return res.status(500).json({
      message: "Failed to delete course unit.",
    });
  }
};


/*
=========================================================
EXPORT CONTROLLER FUNCTIONS
=========================================================
*/
module.exports = {
  createSubject,
  getSubjects,
  getSubjectById,
  updateSubject,
  updateSubjectStatus,
  deleteSubject,
};