const db = require("../config/db");

const createTimetable = async (req, res) => {
  try {
    const {
      class_subject_id,
      semester_id,
      day_of_week,
      start_time,
      end_time,
      room,
    } = req.body;

    if (
      !class_subject_id ||
      !semester_id ||
      !day_of_week ||
      !start_time ||
      !end_time
    ) {
      return res.status(400).json({
        message:
          "class_subject_id, semester_id, day_of_week, start_time and end_time are required.",
      });
    }

    if (start_time >= end_time) {
      return res.status(400).json({
        message: "start_time must be earlier than end_time.",
      });
    }

    const validDays = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    if (!validDays.includes(day_of_week)) {
      return res.status(400).json({
        message: "Invalid day_of_week.",
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

    const [semesters] = await db.execute(
      `SELECT id
       FROM semesters
       WHERE id = ?
       LIMIT 1`,
      [semester_id]
    );

    if (semesters.length === 0) {
      return res.status(404).json({
        message: "Semester not found.",
      });
    }

    const [existingTimetable] = await db.execute(
      `SELECT id
       FROM timetables
       WHERE class_subject_id = ?
         AND semester_id = ?
         AND day_of_week = ?
         AND start_time = ?
       LIMIT 1`,
      [
        class_subject_id,
        semester_id,
        day_of_week,
        start_time,
      ]
    );

    if (existingTimetable.length > 0) {
      return res.status(409).json({
        message:
          "A timetable entry already exists for this subject at this time.",
      });
    }

    const [result] = await db.execute(
      `INSERT INTO timetables
      (
        class_subject_id,
        semester_id,
        day_of_week,
        start_time,
        end_time,
        room
      )
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        class_subject_id,
        semester_id,
        day_of_week,
        start_time,
        end_time,
        room || null,
      ]
    );

    return res.status(201).json({
      message: "Timetable entry created successfully.",
      timetableId: result.insertId,
    });
  } catch (error) {
    console.error("Create timetable error:", error);

    return res.status(500).json({
      message: "Failed to create timetable entry.",
    });
  }
};

const getTimetables = async (req, res) => {
  try {
    let query = `
      SELECT
        t.id,
        t.class_subject_id,
        cs.class_id,
        c.name AS class_name,
        c.code AS class_code,
        cs.subject_id,
        s.name AS subject_name,
        s.code AS subject_code,
        t.semester_id,
        sem.name AS semester_name,
        t.day_of_week,
        t.start_time,
        t.end_time,
        t.room,
        t.created_at,
        t.updated_at
      FROM timetables t
      INNER JOIN class_subjects cs
        ON t.class_subject_id = cs.id
      INNER JOIN classes c
        ON cs.class_id = c.id
      INNER JOIN subjects s
        ON cs.subject_id = s.id
      INNER JOIN semesters sem
        ON t.semester_id = sem.id
    `;

    const params = [];

    // Teachers can only see timetables
    // for classes and subjects assigned to them.
    if (req.user.role === "teacher") {
      query += `
        WHERE EXISTS (
          SELECT 1
          FROM teacher_assignments ta
          INNER JOIN teachers tr
            ON ta.teacher_id = tr.id
          WHERE ta.class_subject_id = t.class_subject_id
            AND ta.semester_id = t.semester_id
            AND tr.user_id = ?
        )
      `;

      params.push(req.user.id);
    }

    query += `
      ORDER BY
        t.day_of_week,
        t.start_time
    `;

    const [timetables] = await db.execute(query, params);

    return res.json(timetables);
  } catch (error) {
    console.error("Get timetables error:", error);

    return res.status(500).json({
      message: "Failed to fetch timetables.",
    });
  }
};

module.exports = {
  createTimetable,
  getTimetables,
};