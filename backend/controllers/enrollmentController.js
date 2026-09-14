const db = require("../config/db");

/*
=========================================================
CREATE ENROLLMENT
=========================================================
Admin/Registrar can enroll a registered student into
a class for a particular semester.
=========================================================
*/
const createEnrollment = async (req, res) => {
  try {
    const {
      student_id,
      semester_id,
      class_id,
      enrollment_date,
      status,
    } = req.body;

    // -----------------------------------------------------
    // VALIDATION
    // -----------------------------------------------------

    if (
      !student_id ||
      !semester_id ||
      !class_id ||
      !enrollment_date
    ) {
      return res.status(400).json({
        message:
          "student_id, semester_id, class_id and enrollment_date are required.",
      });
    }

    // -----------------------------------------------------
    // ENROLLMENT STATUS
    // -----------------------------------------------------

    const enrollmentStatus = status || "active";

    if (
      !["active", "completed", "withdrawn"].includes(
        enrollmentStatus
      )
    ) {
      return res.status(400).json({
        message:
          "Status must be active, completed or withdrawn.",
      });
    }

    // -----------------------------------------------------
    // CHECK STUDENT
    // -----------------------------------------------------

    const [students] = await db.execute(
      `SELECT
        id,
        user_id,
        student_number,
        first_name,
        last_name
       FROM students
       WHERE id = ?
       LIMIT 1`,
      [student_id]
    );

    if (students.length === 0) {
      return res.status(404).json({
        message: "Student not found.",
      });
    }

    const student = students[0];

    // -----------------------------------------------------
    // CHECK SEMESTER
    // -----------------------------------------------------

    const [semesters] = await db.execute(
      `SELECT
        s.id,
        s.name,
        s.academic_year_id,
        ay.name AS academic_year
       FROM semesters s
       INNER JOIN academic_years ay
         ON s.academic_year_id = ay.id
       WHERE s.id = ?
       LIMIT 1`,
      [semester_id]
    );

    if (semesters.length === 0) {
      return res.status(404).json({
        message: "Semester not found.",
      });
    }

    const semester = semesters[0];

    // -----------------------------------------------------
    // CHECK CLASS
    // -----------------------------------------------------

    const [classes] = await db.execute(
      `SELECT
        id,
        name,
        code
       FROM classes
       WHERE id = ?
       LIMIT 1`,
      [class_id]
    );

    if (classes.length === 0) {
      return res.status(404).json({
        message: "Class not found.",
      });
    }

    const selectedClass = classes[0];

    // -----------------------------------------------------
    // VALIDATE DATE
    // -----------------------------------------------------

    const parsedDate = new Date(enrollment_date);

    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        message: "Invalid enrollment date.",
      });
    }

    // -----------------------------------------------------
    // PREVENT DUPLICATE ENROLLMENT
    // -----------------------------------------------------
    // A student should only have one enrollment
    // for the same semester.

    const [existingEnrollment] = await db.execute(
      `SELECT
        id,
        class_id,
        status
       FROM enrollments
       WHERE student_id = ?
         AND semester_id = ?
       LIMIT 1`,
      [
        student_id,
        semester_id,
      ]
    );

    if (existingEnrollment.length > 0) {
      return res.status(409).json({
        message:
          "Student is already enrolled for the selected semester.",
        enrollmentId:
          existingEnrollment[0].id,
      });
    }

    // -----------------------------------------------------
    // CREATE ENROLLMENT
    // -----------------------------------------------------

    const [result] = await db.execute(
      `INSERT INTO enrollments
      (
        student_id,
        semester_id,
        class_id,
        enrollment_date,
        status
      )
      VALUES (?, ?, ?, ?, ?)`,
      [
        student_id,
        semester_id,
        class_id,
        enrollment_date,
        enrollmentStatus,
      ]
    );

    // -----------------------------------------------------
    // SUCCESS RESPONSE
    // -----------------------------------------------------

    return res.status(201).json({
      message: "Student enrolled successfully.",

      enrollmentId: result.insertId,

      enrollment: {
        id: result.insertId,

        student_id: student.id,

        student_name:
          `${student.first_name} ${student.last_name}`,

        student_number:
          student.student_number,

        semester_id:
          semester.id,

        semester:
          semester.name,

        academic_year:
          semester.academic_year,

        class_id:
          selectedClass.id,

        class_name:
          selectedClass.name,

        class_code:
          selectedClass.code,

        enrollment_date:
          enrollment_date,

        status:
          enrollmentStatus,
      },
    });
  } catch (error) {
    console.error(
      "Create enrollment error:",
      error
    );

    // -----------------------------------------------------
    // DUPLICATE DATABASE ERROR
    // -----------------------------------------------------

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message:
          "This student is already enrolled for the selected semester.",
      });
    }

    return res.status(500).json({
      message:
        "Failed to create enrollment.",
    });
  }
};


/*
=========================================================
GET ENROLLMENTS
=========================================================
Admin / Registrar:
    Can view all enrollments.

Student:
    Can view only their own enrollments.

Teacher:
    Will be handled through teacher-specific features
    later. We do not give teachers unrestricted
    enrollment access here.
=========================================================
*/
const getEnrollments = async (req, res) => {
  try {
    let sql = `
      SELECT
        e.id,

        e.student_id,

        CONCAT(
          st.first_name,
          ' ',
          st.last_name
        ) AS student_name,

        st.student_number,

        e.semester_id,

        sem.name AS semester,

        sem.academic_year_id,

        ay.name AS academic_year,

        e.class_id,

        c.name AS class_name,

        c.code AS class_code,

        e.enrollment_date,

        e.status,

        e.created_at,

        e.updated_at

      FROM enrollments e

      INNER JOIN students st
        ON e.student_id = st.id

      INNER JOIN semesters sem
        ON e.semester_id = sem.id

      INNER JOIN academic_years ay
        ON sem.academic_year_id = ay.id

      INNER JOIN classes c
        ON e.class_id = c.id
    `;

    const params = [];

    // -----------------------------------------------------
    // STUDENT
    // -----------------------------------------------------
    // Students can only see their own enrollments.

    if (req.user?.role === "student") {
      sql += `
        INNER JOIN users u
          ON st.user_id = u.id

        WHERE u.id = ?
      `;

      params.push(req.user.id);
    }

    // -----------------------------------------------------
    // ADMIN / REGISTRAR
    // -----------------------------------------------------
    // No WHERE clause.
    // They can see all enrollments.

    sql += `
      ORDER BY
        e.enrollment_date DESC,
        e.created_at DESC
    `;

    const [enrollments] = await db.execute(
      sql,
      params
    );

    return res.json(enrollments);
  } catch (error) {
    console.error(
      "Get enrollments error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch enrollments.",
    });
  }
};


/*
=========================================================
EXPORT CONTROLLERS
=========================================================
*/

module.exports = {
  createEnrollment,
  getEnrollments,
};