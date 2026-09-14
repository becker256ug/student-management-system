const bcrypt = require("bcryptjs");
const db = require("../config/db");

/*
|--------------------------------------------------------------------------
| CREATE STUDENT
|--------------------------------------------------------------------------
| Creates:
| 1. A user account with role = student
| 2. A student profile linked to that user
|--------------------------------------------------------------------------
*/
const createStudent = async (req, res) => {
  let connection;

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

    /*
     * Validation
     */
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
          "Name, email, password, student number, first name, last name, gender, and date of birth are required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message:
          "Student password must be at least 6 characters.",
      });
    }

    /*
     * Prevent future date of birth
     */
    const today = new Date()
      .toISOString()
      .split("T")[0];

    if (date_of_birth > today) {
      return res.status(400).json({
        message:
          "Date of birth cannot be in the future.",
      });
    }

    connection = await db.getConnection();

    await connection.beginTransaction();

    /*
     * Check duplicate email
     */
    const [existingUsers] = await connection.execute(
      `
      SELECT id
      FROM users
      WHERE email = ?
      LIMIT 1
      `,
      [email.trim()]
    );

    if (existingUsers.length > 0) {
      await connection.rollback();

      return res.status(409).json({
        message:
          "A user with this email already exists.",
      });
    }

    /*
     * Check duplicate student number
     */
    const [existingStudents] =
      await connection.execute(
        `
        SELECT id
        FROM students
        WHERE student_number = ?
        LIMIT 1
        `,
        [student_number.trim()]
      );

    if (existingStudents.length > 0) {
      await connection.rollback();

      return res.status(409).json({
        message:
          "A student with this student number already exists.",
      });
    }

    /*
     * Hash password
     */
    const passwordHash = await bcrypt.hash(
      password,
      10
    );

    /*
     * Create student user account
     */
    const [userResult] =
      await connection.execute(
        `
        INSERT INTO users
        (
          name,
          email,
          password_hash,
          role,
          status
        )
        VALUES (?, ?, ?, 'student', 'active')
        `,
        [
          name.trim(),
          email.trim(),
          passwordHash,
        ]
      );

    const userId = userResult.insertId;

    /*
     * Create student profile
     */
    const [studentResult] =
      await connection.execute(
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
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          userId,
          student_number.trim(),
          first_name.trim(),
          last_name.trim(),
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
      message:
        "Student registered successfully.",
      studentId: studentResult.insertId,
      userId,
    });
  } catch (error) {
    console.error(
      "Create student error:",
      error
    );

    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error(
          "Rollback error:",
          rollbackError
        );
      }
    }

    /*
     * Handle MySQL duplicate errors
     */
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message:
          "A student or user with the supplied information already exists.",
      });
    }

    return res.status(500).json({
      message:
        "Failed to register student.",
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

/*
|--------------------------------------------------------------------------
| GET STUDENTS
|--------------------------------------------------------------------------
| Admin/registrar:
|   Returns all students.
|
| Student:
|   Returns only the logged-in student's own record.
|--------------------------------------------------------------------------
*/
const getStudents = async (req, res) => {
  try {
    let sql = `
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
        u.name,
        u.email,
        u.status AS account_status
      FROM students s
      INNER JOIN users u
        ON s.user_id = u.id
    `;

    const params = [];

    /*
     * Students can only see themselves.
     */
    if (req.user?.role === "student") {
      sql += `
        WHERE s.user_id = ?
      `;

      params.push(req.user.id);
    }

    sql += `
      ORDER BY s.created_at DESC
    `;

    const [students] =
      await db.execute(sql, params);

    return res.status(200).json(students);
  } catch (error) {
    console.error(
      "Get students error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch students.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| GET SINGLE STUDENT
|--------------------------------------------------------------------------
*/
const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || Number.isNaN(Number(id))) {
      return res.status(400).json({
        message:
          "A valid student ID is required.",
      });
    }

    const [students] =
      await db.execute(
        `
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
          u.name,
          u.email,
          u.status AS account_status
        FROM students s
        INNER JOIN users u
          ON s.user_id = u.id
        WHERE s.id = ?
        LIMIT 1
        `,
        [id]
      );

    if (students.length === 0) {
      return res.status(404).json({
        message:
          "Student not found.",
      });
    }

    const student = students[0];

    /*
     * A student may only view their own record.
     */
    if (
      req.user?.role === "student" &&
      Number(student.user_id) !==
        Number(req.user.id)
    ) {
      return res.status(403).json({
        message:
          "You are not authorized to view this student.",
      });
    }

    return res.status(200).json(student);
  } catch (error) {
    console.error(
      "Get student by ID error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch student.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| UPDATE STUDENT
|--------------------------------------------------------------------------
| Updates:
| - student profile
| - user name
| - user email
|
| Password is optional.
| If password is supplied, it is hashed before saving.
|--------------------------------------------------------------------------
*/
const updateStudent = async (req, res) => {
  let connection;

  try {
    const { id } = req.params;

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

    if (!id || Number.isNaN(Number(id))) {
      return res.status(400).json({
        message:
          "A valid student ID is required.",
      });
    }

    /*
     * Required student fields
     */
    if (
      !student_number ||
      !first_name ||
      !last_name ||
      !gender ||
      !date_of_birth
    ) {
      return res.status(400).json({
        message:
          "Student number, first name, last name, gender, and date of birth are required.",
      });
    }

    /*
     * Prevent future DOB
     */
    const today = new Date()
      .toISOString()
      .split("T")[0];

    if (date_of_birth > today) {
      return res.status(400).json({
        message:
          "Date of birth cannot be in the future.",
      });
    }

    connection = await db.getConnection();

    await connection.beginTransaction();

    /*
     * Find student and linked user
     */
    const [students] =
      await connection.execute(
        `
        SELECT
          s.id,
          s.user_id,
          s.student_number,
          u.email
        FROM students s
        INNER JOIN users u
          ON s.user_id = u.id
        WHERE s.id = ?
        LIMIT 1
        `,
        [id]
      );

    if (students.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        message:
          "Student not found.",
      });
    }

    const existingStudent =
      students[0];

    /*
     * Check student number belongs to another student
     */
    const [duplicateStudentNumbers] =
      await connection.execute(
        `
        SELECT id
        FROM students
        WHERE student_number = ?
          AND id <> ?
        LIMIT 1
        `,
        [
          student_number.trim(),
          id,
        ]
      );

    if (
      duplicateStudentNumbers.length >
      0
    ) {
      await connection.rollback();

      return res.status(409).json({
        message:
          "Another student already uses this student number.",
      });
    }

    /*
     * Check email if supplied
     */
    if (email && email.trim()) {
      const [duplicateEmails] =
        await connection.execute(
          `
          SELECT id
          FROM users
          WHERE email = ?
            AND id <> ?
          LIMIT 1
          `,
          [
            email.trim(),
            existingStudent.user_id,
          ]
        );

      if (duplicateEmails.length > 0) {
        await connection.rollback();

        return res.status(409).json({
          message:
            "Another user already uses this email address.",
        });
      }
    }

    /*
     * Update student profile
     */
    await connection.execute(
      `
      UPDATE students
      SET
        student_number = ?,
        first_name = ?,
        last_name = ?,
        gender = ?,
        date_of_birth = ?,
        phone = ?,
        address = ?,
        guardian_name = ?,
        guardian_phone = ?
      WHERE id = ?
      `,
      [
        student_number.trim(),
        first_name.trim(),
        last_name.trim(),
        gender,
        date_of_birth,
        phone || null,
        address || null,
        guardian_name || null,
        guardian_phone || null,
        id,
      ]
    );

    /*
     * Update user account information
     */
    if (name && email) {
      await connection.execute(
        `
        UPDATE users
        SET
          name = ?,
          email = ?
        WHERE id = ?
        `,
        [
          name.trim(),
          email.trim(),
          existingStudent.user_id,
        ]
      );
    } else if (name) {
      await connection.execute(
        `
        UPDATE users
        SET name = ?
        WHERE id = ?
        `,
        [
          name.trim(),
          existingStudent.user_id,
        ]
      );
    } else if (email) {
      await connection.execute(
        `
        UPDATE users
        SET email = ?
        WHERE id = ?
        `,
        [
          email.trim(),
          existingStudent.user_id,
        ]
      );
    }

    /*
     * Update password only when provided.
     */
    if (
      password &&
      String(password).trim()
    ) {
      if (password.length < 6) {
        await connection.rollback();

        return res.status(400).json({
          message:
            "Student password must be at least 6 characters.",
        });
      }

      const passwordHash =
        await bcrypt.hash(
          password,
          10
        );

      await connection.execute(
        `
        UPDATE users
        SET password_hash = ?
        WHERE id = ?
        `,
        [
          passwordHash,
          existingStudent.user_id,
        ]
      );
    }

    await connection.commit();

    return res.status(200).json({
      message:
        "Student updated successfully.",
    });
  } catch (error) {
    console.error(
      "Update student error:",
      error
    );

    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error(
          "Rollback error:",
          rollbackError
        );
      }
    }

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message:
          "The supplied student number or email already exists.",
      });
    }

    return res.status(500).json({
      message:
        "Failed to update student.",
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

/*
|--------------------------------------------------------------------------
| CHANGE STUDENT STATUS
|--------------------------------------------------------------------------
| This is the preferred action for normal administration.
|
| Examples:
| active
| inactive
|--------------------------------------------------------------------------
*/
const updateStudentStatus = async (
  req,
  res
) => {
  let connection;

  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id || Number.isNaN(Number(id))) {
      return res.status(400).json({
        message:
          "A valid student ID is required.",
      });
    }

    if (
      !["active", "inactive"].includes(
        status
      )
    ) {
      return res.status(400).json({
        message:
          "Student status must be active or inactive.",
      });
    }

    connection = await db.getConnection();

    await connection.beginTransaction();

    /*
     * Find student
     */
    const [students] =
      await connection.execute(
        `
        SELECT user_id
        FROM students
        WHERE id = ?
        LIMIT 1
        `,
        [id]
      );

    if (students.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        message:
          "Student not found.",
      });
    }

    const userId =
      students[0].user_id;

    /*
     * Update student account status.
     *
     * The student table itself does not need a
     * status column for this implementation.
     * The login account status controls access.
     */
    await connection.execute(
      `
      UPDATE users
      SET status = ?
      WHERE id = ?
      `,
      [status, userId]
    );

    await connection.commit();

    return res.status(200).json({
      message:
        status === "active"
          ? "Student activated successfully."
          : "Student deactivated successfully.",
      status,
    });
  } catch (error) {
    console.error(
      "Update student status error:",
      error
    );

    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error(
          "Rollback error:",
          rollbackError
        );
      }
    }

    return res.status(500).json({
      message:
        "Failed to update student status.",
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

/*
|--------------------------------------------------------------------------
| DELETE STUDENT
|--------------------------------------------------------------------------
| Permanent deletion is deliberately protected.
|
| If the student has enrollments, attendance, results,
| fees, etc., the database may reject the deletion.
|
| In that case the administrator should deactivate the
| account instead.
|--------------------------------------------------------------------------
*/
const deleteStudent = async (
  req,
  res
) => {
  let connection;

  try {
    const { id } = req.params;

    if (!id || Number.isNaN(Number(id))) {
      return res.status(400).json({
        message:
          "A valid student ID is required.",
      });
    }

    connection = await db.getConnection();

    await connection.beginTransaction();

    /*
     * Find student and linked user
     */
    const [students] =
      await connection.execute(
        `
        SELECT
          id,
          user_id
        FROM students
        WHERE id = ?
        LIMIT 1
        `,
        [id]
      );

    if (students.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        message:
          "Student not found.",
      });
    }

    const userId =
      students[0].user_id;

    /*
     * Check dependent records first.
     *
     * We do not delete historical academic data.
     */
    const [enrollments] =
      await connection.execute(
        `
        SELECT COUNT(*) AS count
        FROM enrollments
        WHERE student_id = ?
        `,
        [id]
      );

    if (
      Number(enrollments[0].count) >
      0
    ) {
      await connection.rollback();

      return res.status(409).json({
        message:
          "This student has enrollment records and cannot be permanently deleted. Deactivate the student account instead.",
        canDeactivate: true,
      });
    }

    /*
     * No enrollment records.
     *
     * Delete the student profile first.
     * The linked user account will then be deleted
     * explicitly.
     */
    await connection.execute(
      `
      DELETE FROM students
      WHERE id = ?
      `,
      [id]
    );

    await connection.execute(
      `
      DELETE FROM users
      WHERE id = ?
      `,
      [userId]
    );

    await connection.commit();

    return res.status(200).json({
      message:
        "Student deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete student error:",
      error
    );

    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error(
          "Rollback error:",
          rollbackError
        );
      }
    }

    /*
     * Foreign-key protection
     */
    if (
      error.code ===
      "ER_ROW_IS_REFERENCED_2"
    ) {
      return res.status(409).json({
        message:
          "This student has related academic records and cannot be permanently deleted. Deactivate the student account instead.",
        canDeactivate: true,
      });
    }

    return res.status(500).json({
      message:
        "Failed to delete student.",
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

module.exports = {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  updateStudentStatus,
  deleteStudent,
};