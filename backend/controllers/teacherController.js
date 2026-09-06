const bcrypt = require("bcryptjs");
const db = require("../config/db");

const createTeacher = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const {
      name,
      email,
      password,
      employee_number,
      first_name,
      last_name,
      gender,
      date_of_birth,
      phone,
      address,
      specialization,
      hire_date,
      status,
    } = req.body;

    // Validate required fields
    if (
      !name ||
      !email ||
      !password ||
      !employee_number ||
      !first_name ||
      !last_name ||
      !gender
    ) {
      return res.status(400).json({
        message:
          "name, email, password, employee_number, first_name, last_name, and gender are required.",
      });
    }

    // Validate gender
    if (!["Male", "Female", "Other"].includes(gender)) {
      return res.status(400).json({
        message: "Gender must be Male, Female, or Other.",
      });
    }

    // Validate status if provided
    if (status && !["active", "inactive"].includes(status)) {
      return res.status(400).json({
        message: "Status must be active or inactive.",
      });
    }

    await connection.beginTransaction();

    // Check email
    const [existingUsers] = await connection.execute(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (existingUsers.length > 0) {
      await connection.rollback();

      return res.status(409).json({
        message: "Email already exists.",
      });
    }

    // Check employee number
    const [existingTeachers] = await connection.execute(
      "SELECT id FROM teachers WHERE employee_number = ? LIMIT 1",
      [employee_number]
    );

    if (existingTeachers.length > 0) {
      await connection.rollback();

      return res.status(409).json({
        message: "Employee number already exists.",
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create teacher user account
    const [userResult] = await connection.execute(
      `INSERT INTO users
      (
        name,
        email,
        password_hash,
        role,
        status
      )
      VALUES (?, ?, ?, 'teacher', ?)`,
      [
        name,
        email,
        passwordHash,
        status || "active",
      ]
    );

    const userId = userResult.insertId;

    // Create teacher profile
    const [teacherResult] = await connection.execute(
      `INSERT INTO teachers
      (
        user_id,
        employee_number,
        first_name,
        last_name,
        gender,
        date_of_birth,
        phone,
        address,
        specialization,
        hire_date,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        employee_number,
        first_name,
        last_name,
        gender,
        date_of_birth || null,
        phone || null,
        address || null,
        specialization || null,
        hire_date || null,
        status || "active",
      ]
    );

    await connection.commit();

    return res.status(201).json({
      message: "Teacher registered successfully.",
      userId,
      teacherId: teacherResult.insertId,
    });
  } catch (error) {
    await connection.rollback();

    console.error("Create teacher error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Email or employee number already exists.",
      });
    }

    return res.status(500).json({
      message: "Failed to register teacher.",
    });
  } finally {
    connection.release();
  }
};

const getTeachers = async (req, res) => {
  try {
    const [teachers] = await db.execute(
      `SELECT
        t.id,
        t.user_id,
        t.employee_number,
        t.first_name,
        t.last_name,
        t.gender,
        t.date_of_birth,
        t.phone,
        t.address,
        t.specialization,
        t.hire_date,
        t.status,
        t.created_at,
        t.updated_at,
        u.email
      FROM teachers t
      INNER JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC`
    );

    return res.json(teachers);
  } catch (error) {
    console.error("Get teachers error:", error);

    return res.status(500).json({
      message: "Failed to fetch teachers.",
    });
  }
};

module.exports = {
  createTeacher,
  getTeachers,
};