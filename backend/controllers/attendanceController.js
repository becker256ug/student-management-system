const db = require("../config/db");

/*
|--------------------------------------------------------------------------
| Get teacher profile ID
|--------------------------------------------------------------------------
*/
const getTeacherProfileId = async (userId) => {
  const [teachers] = await db.execute(
    `SELECT id
     FROM teachers
     WHERE user_id = ?
     LIMIT 1`,
    [userId]
  );

  return teachers.length > 0 ? teachers[0].id : null;
};

/*
|--------------------------------------------------------------------------
| Verify that a teacher is assigned to a class subject and semester
|--------------------------------------------------------------------------
*/
const verifyTeacherAssignment = async (
  userId,
  classSubjectId,
  semesterId
) => {
  const teacherId = await getTeacherProfileId(userId);

  if (!teacherId) {
    return false;
  }

  const [assignments] = await db.execute(
    `SELECT ta.id
     FROM teacher_assignments ta
     WHERE ta.teacher_id = ?
       AND ta.class_subject_id = ?
       AND ta.semester_id = ?
     LIMIT 1`,
    [
      teacherId,
      classSubjectId,
      semesterId,
    ]
  );

  return assignments.length > 0;
};

/*
|--------------------------------------------------------------------------
| Create attendance
|--------------------------------------------------------------------------
*/
const createAttendance = async (req, res) => {
  try {
    const {
      enrollment_id,
      class_subject_id,
      attendance_date,
      status,
      remarks,
    } = req.body;

    /*
    |--------------------------------------------------------------------------
    | Validate required fields
    |--------------------------------------------------------------------------
    */
    if (
      !enrollment_id ||
      !class_subject_id ||
      !attendance_date ||
      !status
    ) {
      return res.status(400).json({
        message:
          "enrollment_id, class_subject_id, attendance_date and status are required.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Validate attendance status
    |--------------------------------------------------------------------------
    */
    const allowedStatuses = [
      "present",
      "absent",
      "late",
      "excused",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message:
          "Status must be present, absent, late or excused.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Find enrollment
    |--------------------------------------------------------------------------
    */
    const [enrollments] = await db.execute(
      `SELECT
        e.id,
        e.student_id,
        e.class_id,
        e.semester_id
       FROM enrollments e
       WHERE e.id = ?
       LIMIT 1`,
      [enrollment_id]
    );

    if (enrollments.length === 0) {
      return res.status(404).json({
        message: "Enrollment not found.",
      });
    }

    const enrollment = enrollments[0];

    /*
    |--------------------------------------------------------------------------
    | Find class subject
    |--------------------------------------------------------------------------
    */
    const [classSubjects] = await db.execute(
      `SELECT
        cs.id,
        cs.class_id,
        cs.subject_id
       FROM class_subjects cs
       WHERE cs.id = ?
       LIMIT 1`,
      [class_subject_id]
    );

    if (classSubjects.length === 0) {
      return res.status(404).json({
        message: "Class subject not found.",
      });
    }

    const classSubject = classSubjects[0];

    /*
    |--------------------------------------------------------------------------
    | Make sure the student's enrollment class matches
    | the selected class subject
    |--------------------------------------------------------------------------
    */
    if (
      Number(classSubject.class_id) !==
      Number(enrollment.class_id)
    ) {
      return res.status(400).json({
        message:
          "The selected subject does not belong to the student's enrolled class.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Teacher security check
    |
    | Admin and registrar can record attendance.
    | Teachers can only record attendance for their assignments.
    |--------------------------------------------------------------------------
    */
    if (req.user?.role === "teacher") {
      const assigned =
        await verifyTeacherAssignment(
          req.user.id,
          class_subject_id,
          enrollment.semester_id
        );

      if (!assigned) {
        return res.status(403).json({
          message:
            "You are not assigned to teach this class subject for this semester.",
        });
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Prevent duplicate attendance
    |--------------------------------------------------------------------------
    */
    const [existingAttendance] =
      await db.execute(
        `SELECT id
         FROM attendance
         WHERE enrollment_id = ?
           AND class_subject_id = ?
           AND attendance_date = ?
         LIMIT 1`,
        [
          enrollment_id,
          class_subject_id,
          attendance_date,
        ]
      );

    if (existingAttendance.length > 0) {
      return res.status(409).json({
        message:
          "Attendance has already been recorded for this student, subject and date.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Insert attendance
    |--------------------------------------------------------------------------
    */
    const [result] = await db.execute(
      `INSERT INTO attendance
      (
        enrollment_id,
        class_subject_id,
        attendance_date,
        status,
        remarks
      )
      VALUES (?, ?, ?, ?, ?)`,
      [
        enrollment_id,
        class_subject_id,
        attendance_date,
        status,
        remarks || null,
      ]
    );

    return res.status(201).json({
      message:
        "Attendance recorded successfully.",
      attendanceId: result.insertId,
    });
  } catch (error) {
    console.error(
      "Create attendance error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to record attendance.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Get attendance records
|
| Admin/Registrar:
|   Can see all attendance.
|
| Teacher:
|   Can only see attendance belonging to their assignments.
|--------------------------------------------------------------------------
*/
const getAttendance = async (req, res) => {
  try {
    let sql = `
      SELECT
        a.id,
        a.enrollment_id,

        CONCAT(
          st.first_name,
          ' ',
          st.last_name
        ) AS student_name,

        st.student_number,

        a.class_subject_id,

        c.name AS class_name,
        c.code AS class_code,

        s.name AS subject_name,
        s.code AS subject_code,

        e.semester_id,

        sem.name AS semester,

        a.attendance_date,
        a.status,
        a.remarks,
        a.created_at,
        a.updated_at

      FROM attendance a

      INNER JOIN enrollments e
        ON a.enrollment_id = e.id

      INNER JOIN students st
        ON e.student_id = st.id

      INNER JOIN class_subjects cs
        ON a.class_subject_id = cs.id

      INNER JOIN classes c
        ON cs.class_id = c.id

      INNER JOIN subjects s
        ON cs.subject_id = s.id

      INNER JOIN semesters sem
        ON e.semester_id = sem.id
    `;

    const params = [];

    /*
    |--------------------------------------------------------------------------
    | Restrict teacher to their own assignments
    |--------------------------------------------------------------------------
    */
    if (req.user?.role === "teacher") {
      sql += `
        INNER JOIN teacher_assignments ta
          ON ta.class_subject_id =
             a.class_subject_id

         AND ta.semester_id =
             e.semester_id

        INNER JOIN teachers t
          ON ta.teacher_id = t.id

         AND t.user_id = ?
      `;

      params.push(req.user.id);
    }

    sql += `
      ORDER BY
        a.attendance_date DESC,
        a.created_at DESC
    `;

    const [attendance] =
      await db.execute(
        sql,
        params
      );

    return res.json(attendance);
  } catch (error) {
    console.error(
      "Get attendance error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch attendance.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Get students for teacher attendance
|--------------------------------------------------------------------------
|
| This returns only students belonging to:
|
| Teacher
|   ↓
| Assignment
|   ↓
| Class Subject
|   ↓
| Semester
|--------------------------------------------------------------------------
*/
const getTeacherStudents = async (
  req,
  res
) => {
  try {
    const {
      class_subject_id,
      semester_id,
    } = req.query;

    /*
    |--------------------------------------------------------------------------
    | Validate parameters
    |--------------------------------------------------------------------------
    */
    if (
      !class_subject_id ||
      !semester_id
    ) {
      return res.status(400).json({
        message:
          "class_subject_id and semester_id are required.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Only teachers can use this endpoint
    |--------------------------------------------------------------------------
    */
    if (req.user?.role !== "teacher") {
      return res.status(403).json({
        message:
          "This endpoint is only available to teachers.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Verify teacher assignment
    |--------------------------------------------------------------------------
    */
    const assigned =
      await verifyTeacherAssignment(
        req.user.id,
        class_subject_id,
        semester_id
      );

    if (!assigned) {
      return res.status(403).json({
        message:
          "You are not assigned to this class subject for this semester.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Get active enrolled students
    |--------------------------------------------------------------------------
    */
    const [students] =
      await db.execute(
        `SELECT

          e.id AS enrollment_id,

          st.id AS student_id,

          st.student_number,

          st.first_name,

          st.last_name,

          CONCAT(
            st.first_name,
            ' ',
            st.last_name
          ) AS student_name,

          e.class_id,

          c.name AS class_name,

          c.code AS class_code,

          e.semester_id,

          sem.name AS semester,

          cs.id AS class_subject_id,

          s.name AS subject_name,

          s.code AS subject_code

        FROM teacher_assignments ta

        INNER JOIN teachers t
          ON ta.teacher_id = t.id

        INNER JOIN class_subjects cs
          ON ta.class_subject_id = cs.id

        INNER JOIN subjects s
          ON cs.subject_id = s.id

        INNER JOIN classes c
          ON cs.class_id = c.id

        INNER JOIN semesters sem
          ON ta.semester_id = sem.id

        INNER JOIN enrollments e
          ON e.class_id = cs.class_id

         AND e.semester_id =
             ta.semester_id

        INNER JOIN students st
          ON e.student_id = st.id

        WHERE t.user_id = ?

          AND ta.class_subject_id = ?

          AND ta.semester_id = ?

          AND e.status = 'active'

        ORDER BY
          st.first_name ASC,
          st.last_name ASC`,
        [
          req.user.id,
          class_subject_id,
          semester_id,
        ]
      );

    return res.json(students);
  } catch (error) {
    console.error(
      "Get teacher attendance students error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch students for attendance.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Get attendance records for a teacher
| for a specific class, subject, semester and date
|--------------------------------------------------------------------------
*/
const getTeacherAttendanceRecords =
  async (req, res) => {
    try {
      const {
        class_subject_id,
        semester_id,
        attendance_date,
      } = req.query;

      /*
      |--------------------------------------------------------------------------
      | Validate parameters
      |--------------------------------------------------------------------------
      */
      if (
        !class_subject_id ||
        !semester_id ||
        !attendance_date
      ) {
        return res.status(400).json({
          message:
            "class_subject_id, semester_id and attendance_date are required.",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Teacher only
      |--------------------------------------------------------------------------
      */
      if (req.user?.role !== "teacher") {
        return res.status(403).json({
          message:
            "This endpoint is only available to teachers.",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Verify teacher assignment
      |--------------------------------------------------------------------------
      */
      const assigned =
        await verifyTeacherAssignment(
          req.user.id,
          class_subject_id,
          semester_id
        );

      if (!assigned) {
        return res.status(403).json({
          message:
            "You are not assigned to this class subject for this semester.",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Get existing attendance
      |--------------------------------------------------------------------------
      */
      const [records] =
        await db.execute(
          `SELECT

            a.id,

            a.enrollment_id,

            a.class_subject_id,

            a.attendance_date,

            a.status,

            a.remarks

          FROM attendance a

          INNER JOIN enrollments e
            ON a.enrollment_id = e.id

          INNER JOIN class_subjects cs
            ON a.class_subject_id = cs.id

          WHERE a.class_subject_id = ?

            AND e.semester_id = ?

            AND a.attendance_date = ?

            AND e.class_id =
                cs.class_id

          ORDER BY
            a.id ASC`,
          [
            class_subject_id,
            semester_id,
            attendance_date,
          ]
        );

      return res.json(records);
    } catch (error) {
      console.error(
        "Get teacher attendance records error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to fetch attendance records.",
      });
    }
  };

/*
|--------------------------------------------------------------------------
| Export controller functions
|--------------------------------------------------------------------------
*/
module.exports = {
  createAttendance,
  getAttendance,
  getTeacherStudents,
  getTeacherAttendanceRecords,
};