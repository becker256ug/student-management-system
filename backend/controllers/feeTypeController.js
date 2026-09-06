const db = require("../config/db");

const createFeeType = async (req, res) => {
  try {
    const {
      name,
      description,
      status,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "name is required.",
      });
    }

    if (
      status &&
      !["active", "inactive"].includes(status)
    ) {
      return res.status(400).json({
        message: "Status must be active or inactive.",
      });
    }

    const [existingFeeTypes] = await db.execute(
      `SELECT id
       FROM fee_types
       WHERE name = ?
       LIMIT 1`,
      [name]
    );

    if (existingFeeTypes.length > 0) {
      return res.status(409).json({
        message: "Fee type already exists.",
      });
    }

    const [result] = await db.execute(
      `INSERT INTO fee_types
      (
        name,
        description,
        status
      )
      VALUES (?, ?, ?)`,
      [
        name,
        description || null,
        status || "active",
      ]
    );

    return res.status(201).json({
      message: "Fee type created successfully.",
      feeTypeId: result.insertId,
    });
  } catch (error) {
    console.error("Create fee type error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Fee type already exists.",
      });
    }

    return res.status(500).json({
      message: "Failed to create fee type.",
    });
  }
};

const getFeeTypes = async (req, res) => {
  try {
    const [feeTypes] = await db.execute(
      `SELECT
        id,
        name,
        description,
        status,
        created_at,
        updated_at
      FROM fee_types
      ORDER BY created_at DESC`
    );

    return res.json(feeTypes);
  } catch (error) {
    console.error("Get fee types error:", error);

    return res.status(500).json({
      message: "Failed to fetch fee types.",
    });
  }
};

module.exports = {
  createFeeType,
  getFeeTypes,
};