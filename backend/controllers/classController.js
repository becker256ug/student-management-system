const db = require("../config/db");

const createClass = async (req, res) => {
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

    // Check whether the class code already exists
    const [existingClasses] = await db.execute(
      "SELECT id FROM classes WHERE code = ? LIMIT 1",
      [code]
    );

    if (existingClasses.length > 0) {
      return res.status(409).json({
        message: "Class code already exists.",
      });
    }

    // Create class
    const [result] = await db.execute(
      `INSERT INTO classes
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
      message: "Class created successfully.",
      classId: result.insertId,
    });
  } catch (error) {
    console.error("Create class error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Class code already exists.",
      });
    }

    return res.status(500).json({
      message: "Failed to create class.",
    });
  }
};

const getClasses = async (req, res) => {
  try {
    const [classes] = await db.execute(
      `SELECT
        id,
        name,
        code,
        description,
        status,
        created_at,
        updated_at
      FROM classes
      ORDER BY created_at DESC`
    );

    return res.json(classes);
  } catch (error) {
    console.error("Get classes error:", error);

    return res.status(500).json({
      message: "Failed to fetch classes.",
    });
  }
};

module.exports = {
  createClass,
  getClasses,
};