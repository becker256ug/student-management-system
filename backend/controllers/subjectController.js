const db = require("../config/db");

const createSubject = async (req, res) => {
  try {
    const {
      name,
      code,
      description,
      status,
    } = req.body;

    // Validate required fields
    if (!name || !code) {
      return res.status(400).json({
        message: "name and code are required.",
      });
    }

    // Validate status
    if (status && !["active", "inactive"].includes(status)) {
      return res.status(400).json({
        message: "Status must be active or inactive.",
      });
    }

    // Check whether the subject code already exists
    const [existingSubjects] = await db.execute(
      "SELECT id FROM subjects WHERE code = ? LIMIT 1",
      [code]
    );

    if (existingSubjects.length > 0) {
      return res.status(409).json({
        message: "Subject code already exists.",
      });
    }

    // Create subject
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
        name,
        code,
        description || null,
        status || "active",
      ]
    );

    return res.status(201).json({
      message: "Subject created successfully.",
      subjectId: result.insertId,
    });
  } catch (error) {
    console.error("Create subject error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Subject code already exists.",
      });
    }

    return res.status(500).json({
      message: "Failed to create subject.",
    });
  }
};

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
      message: "Failed to fetch subjects.",
    });
  }
};

module.exports = {
  createSubject,
  getSubjects,
};