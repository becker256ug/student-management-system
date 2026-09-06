const db = require("../config/db");

const createSemester = async (req, res) => {
  try {
    const {
      academic_year_id,
      name,
      start_date,
      end_date,
      status,
    } = req.body;

    if (!academic_year_id || !name || !start_date || !end_date) {
      return res.status(400).json({
        message:
          "academic_year_id, name, start_date and end_date are required.",
      });
    }

    if (
      status &&
      !["upcoming", "active", "closed"].includes(status)
    ) {
      return res.status(400).json({
        message: "Status must be upcoming, active or closed.",
      });
    }

    if (new Date(start_date) >= new Date(end_date)) {
      return res.status(400).json({
        message: "start_date must be before end_date.",
      });
    }

    const [academicYears] = await db.execute(
      "SELECT id FROM academic_years WHERE id = ? LIMIT 1",
      [academic_year_id]
    );

    if (academicYears.length === 0) {
      return res.status(404).json({
        message: "Academic year not found.",
      });
    }

    const [result] = await db.execute(
      `INSERT INTO semesters
      (
        academic_year_id,
        name,
        start_date,
        end_date,
        status
      )
      VALUES (?, ?, ?, ?, ?)`,
      [
        academic_year_id,
        name,
        start_date,
        end_date,
        status || "upcoming",
      ]
    );

    return res.status(201).json({
      message: "Semester created successfully.",
      semesterId: result.insertId,
    });
  } catch (error) {
    console.error("Create semester error:", error);

    return res.status(500).json({
      message: "Failed to create semester.",
    });
  }
};

const getSemesters = async (req, res) => {
  try {
    const [semesters] = await db.execute(
      `SELECT
        s.id,
        s.academic_year_id,
        ay.name AS academic_year,
        s.name,
        s.start_date,
        s.end_date,
        s.status,
        s.created_at,
        s.updated_at
      FROM semesters s
      INNER JOIN academic_years ay
        ON s.academic_year_id = ay.id
      ORDER BY s.start_date DESC`
    );

    return res.json(semesters);
  } catch (error) {
    console.error("Get semesters error:", error);

    return res.status(500).json({
      message: "Failed to fetch semesters.",
    });
  }
};

module.exports = {
  createSemester,
  getSemesters,
};