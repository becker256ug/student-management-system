const db = require("../config/db");

const createAcademicYear = async (req, res) => {
  try {
    const {
      name,
      start_date,
      end_date,
      status,
    } = req.body;

    if (!name || !start_date || !end_date) {
      return res.status(400).json({
        message: "name, start_date and end_date are required.",
      });
    }

    if (status && !["active", "closed"].includes(status)) {
      return res.status(400).json({
        message: "Status must be active or closed.",
      });
    }

    if (new Date(start_date) >= new Date(end_date)) {
      return res.status(400).json({
        message: "start_date must be before end_date.",
      });
    }

    const [existingYears] = await db.execute(
      "SELECT id FROM academic_years WHERE name = ? LIMIT 1",
      [name]
    );

    if (existingYears.length > 0) {
      return res.status(409).json({
        message: "Academic year already exists.",
      });
    }

    const [result] = await db.execute(
      `INSERT INTO academic_years
      (
        name,
        start_date,
        end_date,
        status
      )
      VALUES (?, ?, ?, ?)`,
      [
        name,
        start_date,
        end_date,
        status || "active",
      ]
    );

    return res.status(201).json({
      message: "Academic year created successfully.",
      academicYearId: result.insertId,
    });
  } catch (error) {
    console.error("Create academic year error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Academic year already exists.",
      });
    }

    return res.status(500).json({
      message: "Failed to create academic year.",
    });
  }
};

const getAcademicYears = async (req, res) => {
  try {
    const [academicYears] = await db.execute(
      `SELECT
        id,
        name,
        start_date,
        end_date,
        status,
        created_at,
        updated_at
      FROM academic_years
      ORDER BY start_date DESC`
    );

    return res.json(academicYears);
  } catch (error) {
    console.error("Get academic years error:", error);

    return res.status(500).json({
      message: "Failed to fetch academic years.",
    });
  }
};

module.exports = {
  createAcademicYear,
  getAcademicYears,
};