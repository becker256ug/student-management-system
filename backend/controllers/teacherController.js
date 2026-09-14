const bcrypt = require("bcryptjs");
const db = require("../config/db");

/*
|--------------------------------------------------------------------------
| CREATE TEACHER
|--------------------------------------------------------------------------
*/
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

    if (!["Male", "Female", "Other"].includes(gender)) {
      return res.status(400).json({
        message: "Gender must be Male, Female, or Other.",
      });
    }

    if (status && !["active", "inactive"].includes(status)) {
      return res.status(400).json({
        message: "Status must be active or inactive.",
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
        message: "Email already exists.",
      });
    }

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

    const passwordHash = await bcrypt.hash(password, 10);

    const [userResult] = await connection.execute(
      `
      INSERT INTO users
      (
        name,
        email,
        password_hash,
        role,
        status
      )
      VALUES (?, ?, ?, 'teacher', ?)
      `,
      [
        name.trim(),
        email.trim(),
        passwordHash,
        status || "active",
      ]
    );

    const userId = userResult.insertId;

    const [teacherResult] = await connection.execute(
      `
      INSERT INTO teachers
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
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        userId,
        employee_number.trim(),
        first_name.trim(),
        last_name.trim(),
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


/*
|--------------------------------------------------------------------------
| GET ALL TEACHERS
|--------------------------------------------------------------------------
*/
const getTeachers = async (req, res) => {
  try {
    const [teachers] = await db.execute(
      `
      SELECT
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
        u.name,
        u.email
      FROM teachers t
      INNER JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC
      `
    );

    return res.json(teachers);
  } catch (error) {
    console.error("Get teachers error:", error);

    return res.status(500).json({
      message: "Failed to fetch teachers.",
    });
  }
};


/*
|--------------------------------------------------------------------------
| GET ONE TEACHER
|--------------------------------------------------------------------------
*/
const getTeacherById = async (req, res) => {
  try {
    const { id } = req.params;

    const [teachers] = await db.execute(
      `
      SELECT
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
        u.name,
        u.email
      FROM teachers t
      INNER JOIN users u ON t.user_id = u.id
      WHERE t.id = ?
      LIMIT 1
      `,
      [id]
    );

    if (teachers.length === 0) {
      return res.status(404).json({
        message: "Teacher not found.",
      });
    }

    return res.json(teachers[0]);
  } catch (error) {
    console.error("Get teacher error:", error);

    return res.status(500).json({
      message: "Failed to fetch teacher.",
    });
  }
};


/*
|--------------------------------------------------------------------------
| UPDATE TEACHER
|--------------------------------------------------------------------------
*/
const updateTeacher = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { id } = req.params;

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

    if (
      !name ||
      !email ||
      !employee_number ||
      !first_name ||
      !last_name ||
      !gender
    ) {
      return res.status(400).json({
        message:
          "name, email, employee_number, first_name, last_name, and gender are required.",
      });
    }

    if (!["Male", "Female", "Other"].includes(gender)) {
      return res.status(400).json({
        message: "Gender must be Male, Female, or Other.",
      });
    }

    if (status && !["active", "inactive"].includes(status)) {
      return res.status(400).json({
        message: "Status must be active or inactive.",
      });
    }

    await connection.beginTransaction();

    const [existingTeachers] = await connection.execute(
      `
      SELECT
        t.id,
        t.user_id
      FROM teachers t
      INNER JOIN users u ON t.user_id = u.id
      WHERE t.id = ?
      LIMIT 1
      `,
      [id]
    );

    if (existingTeachers.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        message: "Teacher not found.",
      });
    }

    const teacher = existingTeachers[0];

    const [existingEmail] = await connection.execute(
      `
      SELECT id
      FROM users
      WHERE email = ?
      AND id <> ?
      LIMIT 1
      `,
      [email.trim(), teacher.user_id]
    );

    if (existingEmail.length > 0) {
      await connection.rollback();

      return res.status(409).json({
        message: "Email already exists.",
      });
    }

    const [existingEmployee] = await connection.execute(
      `
      SELECT id
      FROM teachers
      WHERE employee_number = ?
      AND id <> ?
      LIMIT 1
      `,
      [employee_number.trim(), id]
    );

    if (existingEmployee.length > 0) {
      await connection.rollback();

      return res.status(409).json({
        message: "Employee number already exists.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE USER ACCOUNT
    |--------------------------------------------------------------------------
    */

    if (password && password.trim()) {
      const passwordHash = await bcrypt.hash(
        password.trim(),
        10
      );

      await connection.execute(
        `
        UPDATE users
        SET
          name = ?,
          email = ?,
          password_hash = ?,
          status = ?
        WHERE id = ?
        `,
        [
          name.trim(),
          email.trim(),
          passwordHash,
          status || "active",
          teacher.user_id,
        ]
      );
    } else {
      await connection.execute(
        `
        UPDATE users
        SET
          name = ?,
          email = ?,
          status = ?
        WHERE id = ?
        `,
        [
          name.trim(),
          email.trim(),
          status || "active",
          teacher.user_id,
        ]
      );
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE TEACHER PROFILE
    |--------------------------------------------------------------------------
    */

    await connection.execute(
      `
      UPDATE teachers
      SET
        employee_number = ?,
        first_name = ?,
        last_name = ?,
        gender = ?,
        date_of_birth = ?,
        phone = ?,
        address = ?,
        specialization = ?,
        hire_date = ?,
        status = ?
      WHERE id = ?
      `,
      [
        employee_number.trim(),
        first_name.trim(),
        last_name.trim(),
        gender,
        date_of_birth || null,
        phone || null,
        address || null,
        specialization || null,
        hire_date || null,
        status || "active",
        id,
      ]
    );

    await connection.commit();

    return res.json({
      message: "Teacher updated successfully.",
    });
  } catch (error) {
    await connection.rollback();

    console.error("Update teacher error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Email or employee number already exists.",
      });
    }

    return res.status(500).json({
      message: "Failed to update teacher.",
    });
  } finally {
    connection.release();
  }
};


/*
|--------------------------------------------------------------------------
| ACTIVATE TEACHER
|--------------------------------------------------------------------------
*/
const activateTeacher = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { id } = req.params;

    await connection.beginTransaction();

    const [teachers] = await connection.execute(
      `
      SELECT user_id
      FROM teachers
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    if (teachers.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        message: "Teacher not found.",
      });
    }

    const userId = teachers[0].user_id;

    await connection.execute(
      `
      UPDATE teachers
      SET status = 'active'
      WHERE id = ?
      `,
      [id]
    );

    await connection.execute(
      `
      UPDATE users
      SET status = 'active'
      WHERE id = ?
      `,
      [userId]
    );

    await connection.commit();

    return res.json({
      message: "Teacher has been activated successfully.",
    });
  } catch (error) {
    await connection.rollback();

    console.error("Activate teacher error:", error);

    return res.status(500).json({
      message: "Failed to activate teacher.",
    });
  } finally {
    connection.release();
  }
};


/*
|--------------------------------------------------------------------------
| DEACTIVATE TEACHER
|--------------------------------------------------------------------------
*/
const deactivateTeacher = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { id } = req.params;

    await connection.beginTransaction();

    const [teachers] = await connection.execute(
      `
      SELECT user_id
      FROM teachers
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    if (teachers.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        message: "Teacher not found.",
      });
    }

    const userId = teachers[0].user_id;

    /*
    |--------------------------------------------------------------------------
    | DEACTIVATE TEACHER PROFILE
    |--------------------------------------------------------------------------
    */

    await connection.execute(
      `
      UPDATE teachers
      SET status = 'inactive'
      WHERE id = ?
      `,
      [id]
    );

    /*
    |--------------------------------------------------------------------------
    | DEACTIVATE LOGIN ACCOUNT
    |--------------------------------------------------------------------------
    */

    await connection.execute(
      `
      UPDATE users
      SET status = 'inactive'
      WHERE id = ?
      `,
      [userId]
    );

    await connection.commit();

    return res.json({
      message:
        "Teacher has been deactivated successfully.",
    });
  } catch (error) {
    await connection.rollback();

    console.error(
      "Deactivate teacher error:",
      error
    );

    return res.status(500).json({
      message: "Failed to deactivate teacher.",
    });
  } finally {
    connection.release();
  }
};


/*
|--------------------------------------------------------------------------
| DELETE TEACHER
|--------------------------------------------------------------------------
|
| RULE:
|
| ACTIVE TEACHER:
|   If assignments exist -> refuse deletion and tell admin to deactivate.
|
| INACTIVE TEACHER:
|   Delete assignment records first.
|   Then delete teacher profile.
|   Then delete user account.
|
|--------------------------------------------------------------------------
*/
const deleteTeacher = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { id } = req.params;

    await connection.beginTransaction();

    /*
    |--------------------------------------------------------------------------
    | FIND TEACHER
    |--------------------------------------------------------------------------
    */

    const [teachers] = await connection.execute(
      `
      SELECT
        t.id,
        t.user_id,
        t.first_name,
        t.last_name,
        t.status
      FROM teachers t
      WHERE t.id = ?
      LIMIT 1
      `,
      [id]
    );

    if (teachers.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        message: "Teacher not found.",
      });
    }

    const teacher = teachers[0];

    /*
    |--------------------------------------------------------------------------
    | CHECK ASSIGNMENTS
    |--------------------------------------------------------------------------
    */

    const [assignments] = await connection.execute(
      `
      SELECT id
      FROM teacher_assignments
      WHERE teacher_id = ?
      `,
      [id]
    );

    /*
    |--------------------------------------------------------------------------
    | ACTIVE TEACHER WITH ASSIGNMENTS
    |--------------------------------------------------------------------------
    |
    | Do NOT delete.
    | Tell frontend that deactivation is required first.
    |
    */

    if (
      assignments.length > 0 &&
      teacher.status === "active"
    ) {
      await connection.rollback();

      return res.status(409).json({
        message:
          "This teacher has assignment records. Please deactivate the teacher before deleting.",
        requiresDeactivation: true,
        teacherId: id,
      });
    }

    /*
    |--------------------------------------------------------------------------
    | INACTIVE TEACHER
    |--------------------------------------------------------------------------
    |
    | The administrator has already deactivated the teacher.
    |
    | We can now safely remove the teacher's assignments first.
    |
    */

    if (
      assignments.length > 0 &&
      teacher.status === "inactive"
    ) {
      await connection.execute(
        `
        DELETE FROM teacher_assignments
        WHERE teacher_id = ?
        `,
        [id]
      );
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE TEACHER PROFILE
    |--------------------------------------------------------------------------
    */

    await connection.execute(
      `
      DELETE FROM teachers
      WHERE id = ?
      `,
      [id]
    );

    /*
    |--------------------------------------------------------------------------
    | DELETE USER LOGIN ACCOUNT
    |--------------------------------------------------------------------------
    */

    await connection.execute(
      `
      DELETE FROM users
      WHERE id = ?
      `,
      [teacher.user_id]
    );

    await connection.commit();

    return res.json({
      message: "Teacher deleted successfully.",
    });
  } catch (error) {
    await connection.rollback();

    console.error(
      "Delete teacher error:",
      error
    );

    if (
      error.code === "ER_ROW_IS_REFERENCED_2" ||
      error.code === "ER_ROW_IS_REFERENCED"
    ) {
      return res.status(409).json({
        message:
          "This teacher has related records and cannot be permanently deleted. Deactivate the teacher first.",
        requiresDeactivation: true,
        teacherId: req.params.id,
      });
    }

    return res.status(500).json({
      message: "Failed to delete teacher.",
    });
  } finally {
    connection.release();
  }
};


/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
  createTeacher,
  getTeachers,
  getTeacherById,
  updateTeacher,
  activateTeacher,
  deactivateTeacher,
  deleteTeacher,
};