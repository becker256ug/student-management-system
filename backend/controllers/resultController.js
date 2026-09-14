const db = require("../config/db");

/*
|--------------------------------------------------------------------------
| GRADE CALCULATION
|--------------------------------------------------------------------------
|
| 80 - 100 = A - Excellent
| 70 - 79  = B - Very Good
| 60 - 69  = C - Good
| 50 - 59  = D - Pass
| 0  - 49  = F - Fail
|
|--------------------------------------------------------------------------
*/

const calculateGrade = (total) => {
  if (total >= 80) {
    return "A";
  }

  if (total >= 70) {
    return "B";
  }

  if (total >= 60) {
    return "C";
  }

  if (total >= 50) {
    return "D";
  }

  return "F";
};


/*
|--------------------------------------------------------------------------
| REMARKS CALCULATION
|--------------------------------------------------------------------------
*/

const calculateRemarks = (total) => {
  if (total >= 80) {
    return "Excellent";
  }

  if (total >= 70) {
    return "Very Good";
  }

  if (total >= 60) {
    return "Good";
  }

  if (total >= 50) {
    return "Pass";
  }

  return "Fail";
};


/*
|--------------------------------------------------------------------------
| VALIDATE MARKS
|--------------------------------------------------------------------------
|
| Beginning of Semester = /20
| Mid-Semester          = /20
| Final Semester        = /60
| Total                 = /100
|
|--------------------------------------------------------------------------
*/

const validateMarks = (
  beginning_marks,
  midsemester_marks,
  final_marks
) => {
  /*
  |--------------------------------------------------------------------------
  | CHECK EMPTY VALUES
  |--------------------------------------------------------------------------
  */

  if (
    beginning_marks === "" ||
    midsemester_marks === "" ||
    final_marks === "" ||
    beginning_marks === null ||
    midsemester_marks === null ||
    final_marks === null ||
    beginning_marks === undefined ||
    midsemester_marks === undefined ||
    final_marks === undefined
  ) {
    return {
      valid: false,
      message: "All marks are required.",
    };
  }


  /*
  |--------------------------------------------------------------------------
  | CHECK WHITESPACE VALUES
  |--------------------------------------------------------------------------
  */

  if (
    String(beginning_marks).trim() === "" ||
    String(midsemester_marks).trim() === "" ||
    String(final_marks).trim() === ""
  ) {
    return {
      valid: false,
      message: "All marks are required.",
    };
  }


  /*
  |--------------------------------------------------------------------------
  | CONVERT TO NUMBERS
  |--------------------------------------------------------------------------
  */

  const beginning = Number(beginning_marks);
  const midsemester = Number(midsemester_marks);
  const final = Number(final_marks);


  /*
  |--------------------------------------------------------------------------
  | CHECK VALID NUMBERS
  |--------------------------------------------------------------------------
  */

  if (
    !Number.isFinite(beginning) ||
    !Number.isFinite(midsemester) ||
    !Number.isFinite(final)
  ) {
    return {
      valid: false,
      message: "All marks must be valid numbers.",
    };
  }


  /*
  |--------------------------------------------------------------------------
  | BEGINNING MARKS
  |--------------------------------------------------------------------------
  */

  if (beginning < 0 || beginning > 20) {
    return {
      valid: false,
      message:
        "Beginning of Semester marks must be between 0 and 20.",
    };
  }


  /*
  |--------------------------------------------------------------------------
  | MID-SEMESTER MARKS
  |--------------------------------------------------------------------------
  */

  if (midsemester < 0 || midsemester > 20) {
    return {
      valid: false,
      message:
        "Mid-Semester marks must be between 0 and 20.",
    };
  }


  /*
  |--------------------------------------------------------------------------
  | FINAL MARKS
  |--------------------------------------------------------------------------
  */

  if (final < 0 || final > 60) {
    return {
      valid: false,
      message:
        "Final Semester marks must be between 0 and 60.",
    };
  }


  /*
  |--------------------------------------------------------------------------
  | VALID
  |--------------------------------------------------------------------------
  */

  return {
    valid: true,
    beginning,
    midsemester,
    final,
  };
};


/*
|--------------------------------------------------------------------------
| VERIFY TEACHER ASSIGNMENT
|--------------------------------------------------------------------------
|
| Confirms:
|
| 1. Logged-in user belongs to a teacher.
| 2. Teacher is assigned to the class subject.
| 3. Teacher is assigned to the semester.
| 4. Enrollment belongs to the same class.
| 5. Enrollment belongs to the same semester.
| 6. Assignment is active.
|
|--------------------------------------------------------------------------
*/

const verifyTeacherAssignment = async (
  teacherUserId,
  classSubjectId,
  enrollmentId
) => {
  const [rows] = await db.execute(
    `
      SELECT
        ta.id AS teacher_assignment_id,
        ta.teacher_id,
        ta.class_subject_id,
        ta.semester_id,

        cs.class_id,
        cs.subject_id,

        e.id AS enrollment_id,
        e.student_id,
        e.class_id AS enrollment_class_id,
        e.semester_id AS enrollment_semester_id

      FROM teacher_assignments ta

      INNER JOIN teachers t
        ON ta.teacher_id = t.id

      INNER JOIN class_subjects cs
        ON ta.class_subject_id = cs.id

      INNER JOIN enrollments e
        ON e.class_id = cs.class_id
        AND e.semester_id = ta.semester_id

      WHERE t.user_id = ?
        AND ta.class_subject_id = ?
        AND ta.semester_id = e.semester_id
        AND e.id = ?
        AND ta.status = 'active'

      LIMIT 1
    `,
    [
      teacherUserId,
      classSubjectId,
      enrollmentId,
    ]
  );

  return rows.length > 0 ? rows[0] : null;
};


/*
|--------------------------------------------------------------------------
| VERIFY TEACHER CAN ACCESS EXISTING RESULT
|--------------------------------------------------------------------------
*/

const verifyTeacherResultAccess = async (
  teacherUserId,
  resultId
) => {
  const [rows] = await db.execute(
    `
      SELECT
        r.id,
        r.enrollment_id,
        r.class_subject_id,

        ta.id AS teacher_assignment_id,
        ta.teacher_id,
        ta.semester_id AS assignment_semester_id,

        cs.class_id,
        cs.subject_id,

        e.semester_id AS enrollment_semester_id,
        e.class_id AS enrollment_class_id

      FROM results r

      INNER JOIN enrollments e
        ON r.enrollment_id = e.id

      INNER JOIN class_subjects cs
        ON r.class_subject_id = cs.id

      INNER JOIN teacher_assignments ta
        ON ta.class_subject_id = r.class_subject_id
        AND ta.semester_id = e.semester_id
        AND ta.status = 'active'

      INNER JOIN teachers t
        ON ta.teacher_id = t.id

      WHERE r.id = ?
        AND t.user_id = ?
        AND cs.class_id = e.class_id

      LIMIT 1
    `,
    [
      resultId,
      teacherUserId,
    ]
  );

  return rows.length > 0 ? rows[0] : null;
};


/*
|--------------------------------------------------------------------------
| CREATE RESULT
|--------------------------------------------------------------------------
|
| POST /api/results
|
|--------------------------------------------------------------------------
*/

const createResult = async (req, res) => {
  try {
    const {
      enrollment_id,
      class_subject_id,
      beginning_marks,
      midsemester_marks,
      final_marks,
    } = req.body;


    /*
    |--------------------------------------------------------------------------
    | REQUIRED FIELDS
    |--------------------------------------------------------------------------
    */

    if (
      !enrollment_id ||
      !class_subject_id ||
      beginning_marks === undefined ||
      beginning_marks === null ||
      midsemester_marks === undefined ||
      midsemester_marks === null ||
      final_marks === undefined ||
      final_marks === null
    ) {
      return res.status(400).json({
        message:
          "enrollment_id, class_subject_id, beginning_marks, midsemester_marks and final_marks are required.",
      });
    }


    /*
    |--------------------------------------------------------------------------
    | VALIDATE MARKS
    |--------------------------------------------------------------------------
    */

    const marksValidation = validateMarks(
      beginning_marks,
      midsemester_marks,
      final_marks
    );

    if (!marksValidation.valid) {
      return res.status(400).json({
        message: marksValidation.message,
      });
    }


    const beginning = marksValidation.beginning;
    const midsemester = marksValidation.midsemester;
    const final = marksValidation.final;


    /*
    |--------------------------------------------------------------------------
    | CHECK ENROLLMENT
    |--------------------------------------------------------------------------
    */

    const [enrollments] = await db.execute(
      `
        SELECT
          e.id,
          e.student_id,
          e.class_id,
          e.semester_id,
          e.status

        FROM enrollments e

        WHERE e.id = ?

        LIMIT 1
      `,
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
    | CHECK CLASS SUBJECT
    |--------------------------------------------------------------------------
    */

    const [classSubjects] = await db.execute(
      `
        SELECT
          cs.id,
          cs.class_id,
          cs.subject_id

        FROM class_subjects cs

        WHERE cs.id = ?

        LIMIT 1
      `,
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
    | ENSURE CLASS MATCH
    |--------------------------------------------------------------------------
    */

    if (
      Number(enrollment.class_id) !==
      Number(classSubject.class_id)
    ) {
      return res.status(400).json({
        message:
          "The student's enrollment does not belong to the selected class subject.",
      });
    }


    /*
    |--------------------------------------------------------------------------
    | TEACHER SECURITY
    |--------------------------------------------------------------------------
    */

    if (req.user.role === "teacher") {
      const assignment =
        await verifyTeacherAssignment(
          req.user.id,
          class_subject_id,
          enrollment_id
        );

      if (!assignment) {
        return res.status(403).json({
          message:
            "You are not authorized to record results for this student and subject.",
        });
      }
    }


    /*
    |--------------------------------------------------------------------------
    | CHECK DUPLICATE RESULT
    |--------------------------------------------------------------------------
    */

    const [existingResult] = await db.execute(
      `
        SELECT
          id

        FROM results

        WHERE enrollment_id = ?
          AND class_subject_id = ?

        LIMIT 1
      `,
      [
        enrollment_id,
        class_subject_id,
      ]
    );

    if (existingResult.length > 0) {
      return res.status(409).json({
        message:
          "A result already exists for this student and subject.",
      });
    }


    /*
    |--------------------------------------------------------------------------
    | CALCULATE TOTAL
    |--------------------------------------------------------------------------
    */

    const total =
      beginning +
      midsemester +
      final;

    const grade =
      calculateGrade(total);

    const remarks =
      calculateRemarks(total);


    /*
    |--------------------------------------------------------------------------
    | INSERT RESULT
    |--------------------------------------------------------------------------
    */

    const [result] = await db.execute(
      `
        INSERT INTO results
        (
          enrollment_id,
          class_subject_id,
          beginning_marks,
          midsemester_marks,
          final_marks,
          marks,
          grade,
          remarks
        )

        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        enrollment_id,
        class_subject_id,
        beginning,
        midsemester,
        final,
        total,
        grade,
        remarks,
      ]
    );


    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    return res.status(201).json({
      message:
        "Result recorded successfully.",

      resultId:
        result.insertId,

      result: {
        id: result.insertId,

        enrollment_id:
          Number(enrollment_id),

        class_subject_id:
          Number(class_subject_id),

        beginning_marks:
          beginning,

        midsemester_marks:
          midsemester,

        final_marks:
          final,

        marks:
          total,

        grade,

        remarks,
      },
    });
  } catch (error) {
    console.error(
      "Create result error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to record result.",
    });
  }
};


/*
|--------------------------------------------------------------------------
| GET RESULTS
|--------------------------------------------------------------------------
|
| GET /api/results
|
| Admin / Registrar:
|   Can see all results.
|
| Teacher:
|   Can only see results belonging to active assignments.
|
|--------------------------------------------------------------------------
*/

const getResults = async (req, res) => {
  try {
    let query = `
      SELECT
        r.id,
        r.enrollment_id,

        st.id AS student_id,

        CONCAT(
          st.first_name,
          ' ',
          st.last_name
        ) AS student_name,

        st.student_number,

        r.class_subject_id,

        c.id AS class_id,
        c.name AS class_name,
        c.code AS class_code,

        s.id AS subject_id,
        s.name AS subject_name,
        s.code AS subject_code,

        e.semester_id,
        sem.name AS semester,

        r.beginning_marks,
        r.midsemester_marks,
        r.final_marks,

        r.marks,
        r.grade,
        r.remarks,

        r.created_at,
        r.updated_at

      FROM results r

      INNER JOIN enrollments e
        ON r.enrollment_id = e.id

      INNER JOIN students st
        ON e.student_id = st.id

      INNER JOIN class_subjects cs
        ON r.class_subject_id = cs.id

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
    | TEACHER FILTER
    |--------------------------------------------------------------------------
    */

    if (req.user.role === "teacher") {
      query += `
        INNER JOIN teacher_assignments ta
          ON ta.class_subject_id = r.class_subject_id
          AND ta.semester_id = e.semester_id
          AND ta.status = 'active'

        INNER JOIN teachers t
          ON ta.teacher_id = t.id

        WHERE t.user_id = ?
          AND cs.class_id = e.class_id
      `;

      params.push(req.user.id);
    }


    /*
    |--------------------------------------------------------------------------
    | ORDER
    |--------------------------------------------------------------------------
    */

    query += `
      ORDER BY
        r.created_at DESC
    `;


    /*
    |--------------------------------------------------------------------------
    | EXECUTE
    |--------------------------------------------------------------------------
    */

    const [results] =
      await db.execute(
        query,
        params
      );

    return res.json(results);
  } catch (error) {
    console.error(
      "Get results error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch results.",
    });
  }
};


/*
|--------------------------------------------------------------------------
| GET TEACHER STUDENTS
|--------------------------------------------------------------------------
|
| GET:
| /api/results/teacher/students?assignment_id=1
|
| assignment_id = teacher_assignments.id
|
|--------------------------------------------------------------------------
*/

const getTeacherStudents = async (
  req,
  res
) => {
  try {
    /*
    |--------------------------------------------------------------------------
    | ONLY TEACHERS
    |--------------------------------------------------------------------------
    */

    if (req.user.role !== "teacher") {
      return res.status(403).json({
        message:
          "This endpoint is available only to teachers.",
      });
    }


    /*
    |--------------------------------------------------------------------------
    | GET ASSIGNMENT ID
    |--------------------------------------------------------------------------
    */

    const {
      assignment_id,
    } = req.query;

    if (!assignment_id) {
      return res.status(400).json({
        message:
          "assignment_id is required.",
      });
    }


    /*
    |--------------------------------------------------------------------------
    | VERIFY ASSIGNMENT
    |--------------------------------------------------------------------------
    */

    const [assignments] =
      await db.execute(
        `
          SELECT
            ta.id,
            ta.teacher_id,
            ta.class_subject_id,
            ta.semester_id,

            cs.class_id,
            cs.subject_id,

            c.name AS class_name,
            c.code AS class_code,

            s.name AS subject_name,
            s.code AS subject_code,

            sem.name AS semester

          FROM teacher_assignments ta

          INNER JOIN teachers t
            ON ta.teacher_id = t.id

          INNER JOIN class_subjects cs
            ON ta.class_subject_id = cs.id

          INNER JOIN classes c
            ON cs.class_id = c.id

          INNER JOIN subjects s
            ON cs.subject_id = s.id

          INNER JOIN semesters sem
            ON ta.semester_id = sem.id

          WHERE ta.id = ?
            AND t.user_id = ?
            AND ta.status = 'active'

          LIMIT 1
        `,
        [
          assignment_id,
          req.user.id,
        ]
      );


    if (assignments.length === 0) {
      return res.status(403).json({
        message:
          "You are not authorized to access this teacher assignment.",
      });
    }


    const assignment =
      assignments[0];


    /*
    |--------------------------------------------------------------------------
    | GET ENROLLED STUDENTS
    |--------------------------------------------------------------------------
    */

    const [students] =
      await db.execute(
        `
          SELECT
            e.id AS enrollment_id,
            e.student_id,

            CONCAT(
              st.first_name,
              ' ',
              st.last_name
            ) AS student_name,

            st.student_number,

            e.class_id,
            e.semester_id,

            r.id AS result_id,

            r.beginning_marks,
            r.midsemester_marks,
            r.final_marks,

            r.marks,
            r.grade,
            r.remarks,

            r.created_at AS result_created_at,
            r.updated_at AS result_updated_at

          FROM enrollments e

          INNER JOIN students st
            ON e.student_id = st.id

          LEFT JOIN results r
            ON r.enrollment_id = e.id
            AND r.class_subject_id = ?

          WHERE e.class_id = ?
            AND e.semester_id = ?
            AND e.status = 'active'

          ORDER BY
            st.first_name ASC,
            st.last_name ASC
        `,
        [
          assignment.class_subject_id,
          assignment.class_id,
          assignment.semester_id,
        ]
      );


    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    return res.json({
      assignment: {
        id:
          assignment.id,

        class_subject_id:
          assignment.class_subject_id,

        semester_id:
          assignment.semester_id,

        class_id:
          assignment.class_id,

        class_name:
          assignment.class_name,

        class_code:
          assignment.class_code,

        subject_id:
          assignment.subject_id,

        subject_name:
          assignment.subject_name,

        subject_code:
          assignment.subject_code,

        semester:
          assignment.semester,
      },

      students,
    });
  } catch (error) {
    console.error(
      "Get teacher students error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch teacher students.",
    });
  }
};


/*
|--------------------------------------------------------------------------
| UPDATE RESULT
|--------------------------------------------------------------------------
|
| PUT /api/results/:id
|
|--------------------------------------------------------------------------
*/

const updateResult = async (
  req,
  res
) => {
  try {
    const {
      id,
    } = req.params;

    const {
      beginning_marks,
      midsemester_marks,
      final_marks,
    } = req.body;


    /*
    |--------------------------------------------------------------------------
    | REQUIRED FIELDS
    |--------------------------------------------------------------------------
    */

    if (
      beginning_marks === undefined ||
      beginning_marks === null ||
      midsemester_marks === undefined ||
      midsemester_marks === null ||
      final_marks === undefined ||
      final_marks === null
    ) {
      return res.status(400).json({
        message:
          "beginning_marks, midsemester_marks and final_marks are required.",
      });
    }


    /*
    |--------------------------------------------------------------------------
    | VALIDATE MARKS
    |--------------------------------------------------------------------------
    */

    const marksValidation =
      validateMarks(
        beginning_marks,
        midsemester_marks,
        final_marks
      );

    if (!marksValidation.valid) {
      return res.status(400).json({
        message:
          marksValidation.message,
      });
    }


    const beginning =
      marksValidation.beginning;

    const midsemester =
      marksValidation.midsemester;

    const final =
      marksValidation.final;


    /*
    |--------------------------------------------------------------------------
    | CHECK RESULT
    |--------------------------------------------------------------------------
    */

    const [existingResults] =
      await db.execute(
        `
          SELECT
            r.id,
            r.enrollment_id,
            r.class_subject_id

          FROM results r

          WHERE r.id = ?

          LIMIT 1
        `,
        [id]
      );


    if (existingResults.length === 0) {
      return res.status(404).json({
        message:
          "Result not found.",
      });
    }


    const existingResult =
      existingResults[0];


    /*
    |--------------------------------------------------------------------------
    | TEACHER SECURITY
    |--------------------------------------------------------------------------
    */

    if (req.user.role === "teacher") {
      const authorized =
        await verifyTeacherResultAccess(
          req.user.id,
          id
        );

      if (!authorized) {
        return res.status(403).json({
          message:
            "You are not authorized to update this result.",
        });
      }
    }


    /*
    |--------------------------------------------------------------------------
    | CALCULATE TOTAL
    |--------------------------------------------------------------------------
    */

    const total =
      beginning +
      midsemester +
      final;

    const grade =
      calculateGrade(total);

    const remarks =
      calculateRemarks(total);


    /*
    |--------------------------------------------------------------------------
    | UPDATE RESULT
    |--------------------------------------------------------------------------
    */

    await db.execute(
      `
        UPDATE results

        SET
          beginning_marks = ?,
          midsemester_marks = ?,
          final_marks = ?,
          marks = ?,
          grade = ?,
          remarks = ?

        WHERE id = ?
      `,
      [
        beginning,
        midsemester,
        final,
        total,
        grade,
        remarks,
        id,
      ]
    );


    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    return res.json({
      message:
        "Result updated successfully.",

      result: {
        id:
          Number(id),

        enrollment_id:
          existingResult.enrollment_id,

        class_subject_id:
          existingResult.class_subject_id,

        beginning_marks:
          beginning,

        midsemester_marks:
          midsemester,

        final_marks:
          final,

        marks:
          total,

        grade,

        remarks,
      },
    });
  } catch (error) {
    console.error(
      "Update result error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to update result.",
    });
  }
};


/*
|--------------------------------------------------------------------------
| GET RESULTS FOR LOGGED-IN STUDENT
|--------------------------------------------------------------------------
|
| GET:
| /api/results/student
|
| SECURITY:
| The student is identified using req.user.id.
|
| A student can ONLY see results belonging to
| their own student profile.
|
|--------------------------------------------------------------------------
*/

const getStudentResults = async (
  req,
  res
) => {
  try {
    /*
    |--------------------------------------------------------------------------
    | AUTHENTICATION CHECK
    |--------------------------------------------------------------------------
    */

    if (!req.user?.id) {
      return res.status(401).json({
        message:
          "Authentication required.",
      });
    }


    /*
    |--------------------------------------------------------------------------
    | FIND STUDENT PROFILE
    |--------------------------------------------------------------------------
    */

    const [studentRows] =
      await db.execute(
        `
          SELECT
            st.id,
            st.user_id,
            st.student_number,
            st.first_name,
            st.last_name

          FROM students st

          WHERE st.user_id = ?

          LIMIT 1
        `,
        [req.user.id]
      );


    if (studentRows.length === 0) {
      return res.status(404).json({
        message:
          "Student profile not found.",
      });
    }


    const student =
      studentRows[0];


    /*
    |--------------------------------------------------------------------------
    | GET ONLY THIS STUDENT'S RESULTS
    |--------------------------------------------------------------------------
    */

    const [results] =
      await db.execute(
        `
          SELECT

            r.id,
            r.enrollment_id,
            r.class_subject_id,

            /*
            |--------------------------------------------------------------------------
            | STUDENT
            |--------------------------------------------------------------------------
            */

            st.id AS student_id,

            st.student_number,

            CONCAT(
              st.first_name,
              ' ',
              st.last_name
            ) AS student_name,


            /*
            |--------------------------------------------------------------------------
            | CLASS
            |--------------------------------------------------------------------------
            */

            c.id AS class_id,
            c.name AS class_name,
            c.code AS class_code,


            /*
            |--------------------------------------------------------------------------
            | SUBJECT
            |--------------------------------------------------------------------------
            */

            s.id AS subject_id,
            s.name AS subject_name,
            s.code AS subject_code,


            /*
            |--------------------------------------------------------------------------
            | SEMESTER
            |--------------------------------------------------------------------------
            */

            e.semester_id,
            sem.name AS semester_name,


            /*
            |--------------------------------------------------------------------------
            | ACADEMIC YEAR
            |--------------------------------------------------------------------------
            */

            ay.id AS academic_year_id,
            ay.name AS academic_year_name,


            /*
            |--------------------------------------------------------------------------
            | MARKS
            |--------------------------------------------------------------------------
            */

            r.beginning_marks,
            r.midsemester_marks,
            r.final_marks,

            r.marks,
            r.grade,
            r.remarks,


            /*
            |--------------------------------------------------------------------------
            | DATES
            |--------------------------------------------------------------------------
            */

            r.created_at,
            r.updated_at


          FROM results r


          /*
          |--------------------------------------------------------------------------
          | ENROLLMENT
          |--------------------------------------------------------------------------
          */

          INNER JOIN enrollments e
            ON r.enrollment_id = e.id


          /*
          |--------------------------------------------------------------------------
          | STUDENT
          |--------------------------------------------------------------------------
          */

          INNER JOIN students st
            ON e.student_id = st.id


          /*
          |--------------------------------------------------------------------------
          | CLASS
          |--------------------------------------------------------------------------
          */

          INNER JOIN classes c
            ON e.class_id = c.id


          /*
          |--------------------------------------------------------------------------
          | CLASS SUBJECT
          |--------------------------------------------------------------------------
          */

          INNER JOIN class_subjects cs
            ON r.class_subject_id = cs.id


          /*
          |--------------------------------------------------------------------------
          | SUBJECT
          |--------------------------------------------------------------------------
          */

          INNER JOIN subjects s
            ON cs.subject_id = s.id


          /*
          |--------------------------------------------------------------------------
          | SEMESTER
          |--------------------------------------------------------------------------
          */

          INNER JOIN semesters sem
            ON e.semester_id = sem.id


          /*
          |--------------------------------------------------------------------------
          | ACADEMIC YEAR
          |--------------------------------------------------------------------------
          */

          INNER JOIN academic_years ay
            ON sem.academic_year_id = ay.id


          /*
          |--------------------------------------------------------------------------
          | DATA CONSISTENCY
          |--------------------------------------------------------------------------
          |
          | Ensure the result's class subject belongs
          | to the student's enrolled class.
          |
          |--------------------------------------------------------------------------
          */

          WHERE st.user_id = ?
            AND cs.class_id = e.class_id


          /*
          |--------------------------------------------------------------------------
          | ORDER
          |--------------------------------------------------------------------------
          */

          ORDER BY
            ay.name DESC,
            sem.id ASC,
            s.name ASC
        `,
        [req.user.id]
      );


    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    return res.json({
      student: {
        id:
          student.id,

        student_number:
          student.student_number,

        first_name:
          student.first_name,

        last_name:
          student.last_name,
      },

      results,
    });
  } catch (error) {
    console.error(
      "Get student results error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch student results.",
    });
  }
};


/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
  createResult,
  getResults,
  getTeacherStudents,
  updateResult,
  getStudentResults,
};