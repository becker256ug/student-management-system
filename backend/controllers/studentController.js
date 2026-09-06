const bcrypt = require("bcryptjs");
const db = require("../config/db");

const createStudent = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const {
      name,
      email,
      password,
      student_number,
      first_name,
      last_name,
      gender,
      date_of_birth,
      phone,
      address,
      guardian_name,
      guardian_phone,
    } = req.body;

    if (
      !name ||
      !email ||
      !password ||
      !student_number ||
      !first_name ||
      !last_name ||
      !gender ||
      !date_of_birth
    ) {
      return res.status(400).json({
        message:
          "name, email, password, student_number, first_name, last_name, gender, and date_of_birth are required.",
      });
    }

    await connection.beginTransaction();

    const [existingUsers] = await connection.execute(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (existingUsers.length > 0) {
      await connection.rollback();

      return res.status(409).json({
        message: "Email address is already registered.",
      });
    }

    const [existingStudents] = await connection.execute(
      "SELECT id FROM students WHERE student_number = ? LIMIT 1",
      [student_number]
    );

    if (existingStudents.length > 0) {
      await connection.rollback();

      return res.status(409).json({
        message: "Student number already exists.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [userResult] = await connection.execute(
      `
        INSERT INTO users
          (name, email, password_hash, role, status)
        VALUES
          (?, ?, ?, 'student', 'active')
      `,
      [name, email, passwordHash]
    );

    const userId = userResult.insertId;

    const [studentResult] = await connection.execute(
      `
        INSERT INTO students
          (
            user_id,
            student_number,
            first_name,
            last_name,
            gender,
            date_of_birth,
            phone,
            address,
            guardian_name,
            guardian_phone
          )
        VALUES
          (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        userId,
        student_number,
        first_name,
        last_name,
        gender,
        date_of_birth,
        phone || null,
        address || null,
        guardian_name || null,
        guardian_phone || null,
      ]
    );

    await connection.commit();

    return res.status(201).json({
      message: "Student registered successfully.",
      studentId: studentResult.insertId,
      userId,
    });
  } catch (error) {
    await connection.rollback();

    console.error("Create student error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Email or student number already exists.",
      });
    }

    return res.status(500).json({
      message: "Failed to register student.",
    });
  } finally {
    connection.release();
  }
};

const getStudents = async (req, res) => {
  try {
    const [students] = await db.execute(`
      SELECT
        s.id,
        s.user_id,
        s.student_number,
        s.first_name,
        s.last_name,
        s.gender,
        s.date_of_birth,
        s.phone,
        s.address,
        s.guardian_name,
        s.guardian_phone,
        s.created_at,
        s.updated_at,
        u.email,
        u.status
      FROM students s
      INNER JOIN users u ON s.user_id = u.id
      ORDER BY s.created_at DESC
    `);

    return res.json(students);
  } catch (error) {
    console.error("Get students error:", error);

    return res.status(500).json({
      message: "Failed to fetch students.",
    });
  }
};

module.exports = {
  createStudent,
  getStudents,
};