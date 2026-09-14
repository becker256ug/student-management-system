const db = require("../config/db");

/*
|--------------------------------------------------------------------------
| GET LOGGED-IN STUDENT
|--------------------------------------------------------------------------
| Finds the student record belonging to the currently logged-in user.
|
| We use req.user.id from the authentication token.
| The frontend never supplies a student_id for these requests.
|--------------------------------------------------------------------------
*/

const getLoggedInStudent = async (userId) => {
  const [students] = await db.execute(
    `
      SELECT
        id,
        user_id,
        student_number,
        first_name,
        last_name,
        gender,
        date_of_birth,
        phone,
        address,
        guardian_name,
        guardian_phone,
        created_at,
        updated_at
      FROM students
      WHERE user_id = ?
      LIMIT 1
    `,
    [userId]
  );

  return students.length > 0 ? students[0] : null;
};


/*
|--------------------------------------------------------------------------
| MY PROFILE
|--------------------------------------------------------------------------
| GET /api/student-portal/profile
|--------------------------------------------------------------------------
*/

const getMyProfile = async (req, res) => {
  try {
    const student = await getLoggedInStudent(req.user.id);

    if (!student) {
      return res.status(404).json({
        message: "Student profile not found.",
      });
    }

    return res.json({
      student,
    });
  } catch (error) {
    console.error("Get student profile error:", error);

    return res.status(500).json({
      message: "Failed to fetch student profile.",
    });
  }
};


/*
|--------------------------------------------------------------------------
| MY ATTENDANCE
|--------------------------------------------------------------------------
| GET /api/student-portal/attendance
|
| Returns attendance belonging ONLY to the logged-in student.
|--------------------------------------------------------------------------
*/

const getMyAttendance = async (req, res) => {
  try {
    const student = await getLoggedInStudent(req.user.id);

    if (!student) {
      return res.status(404).json({
        message: "Student profile not found.",
      });
    }

    const [attendance] = await db.execute(
      `
        SELECT
          a.id,
          a.enrollment_id,
          a.class_subject_id,

          a.attendance_date,
          a.status,
          a.remarks,

          c.id AS class_id,
          c.name AS class_name,
          c.code AS class_code,

          s.id AS subject_id,
          s.name AS subject_name,
          s.code AS subject_code,

          e.semester_id,

          sem.name AS semester,

          ay.id AS academic_year_id,
          ay.name AS academic_year,

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

        INNER JOIN academic_years ay
          ON sem.academic_year_id = ay.id

        WHERE st.id = ?

        ORDER BY
          a.attendance_date DESC,
          s.name ASC
      `,
      [student.id]
    );

    /*
    |--------------------------------------------------------------------------
    | ATTENDANCE SUMMARY
    |--------------------------------------------------------------------------
    */

    const summary = {
      total: attendance.length,
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
    };

    attendance.forEach((record) => {
      const status = String(record.status).toLowerCase();

      if (status === "present") {
        summary.present += 1;
      }

      if (status === "absent") {
        summary.absent += 1;
      }

      if (status === "late") {
        summary.late += 1;
      }

      if (status === "excused") {
        summary.excused += 1;
      }
    });

    /*
    |--------------------------------------------------------------------------
    | ATTENDANCE PERCENTAGE
    |--------------------------------------------------------------------------
    */

    let attendancePercentage = 0;

    if (summary.total > 0) {
      attendancePercentage =
        ((summary.present + summary.late) / summary.total) * 100;
    }

    return res.json({
      student: {
        id: student.id,
        student_number: student.student_number,
        first_name: student.first_name,
        last_name: student.last_name,
      },

      summary: {
        ...summary,
        attendance_percentage:
          Number(attendancePercentage.toFixed(2)),
      },

      attendance,
    });
  } catch (error) {
    console.error("Get student attendance error:", error);

    return res.status(500).json({
      message: "Failed to fetch student attendance.",
    });
  }
};


/*
|--------------------------------------------------------------------------
| MY TIMETABLE
|--------------------------------------------------------------------------
| GET /api/student-portal/timetable
|
| A timetable belongs to a class_subject + semester.
| We therefore find the logged-in student's enrollment and return
| timetable entries for the student's enrolled class and semester.
|--------------------------------------------------------------------------
*/

const getMyTimetable = async (req, res) => {
  try {
    const student = await getLoggedInStudent(req.user.id);

    if (!student) {
      return res.status(404).json({
        message: "Student profile not found.",
      });
    }

    const [timetable] = await db.execute(
      `
        SELECT
          tt.id,

          tt.class_subject_id,
          tt.semester_id,

          tt.day_of_week,
          tt.start_time,
          tt.end_time,
          tt.room,

          c.id AS class_id,
          c.name AS class_name,
          c.code AS class_code,

          s.id AS subject_id,
          s.name AS subject_name,
          s.code AS subject_code,

          sem.name AS semester,

          ay.id AS academic_year_id,
          ay.name AS academic_year

        FROM timetables tt

        INNER JOIN class_subjects cs
          ON tt.class_subject_id = cs.id

        INNER JOIN classes c
          ON cs.class_id = c.id

        INNER JOIN subjects s
          ON cs.subject_id = s.id

        INNER JOIN semesters sem
          ON tt.semester_id = sem.id

        INNER JOIN academic_years ay
          ON sem.academic_year_id = ay.id

        INNER JOIN enrollments e
          ON e.class_id = cs.class_id
          AND e.semester_id = tt.semester_id

        INNER JOIN students st
          ON e.student_id = st.id

        WHERE st.id = ?

        ORDER BY
          FIELD(
            tt.day_of_week,
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday'
          ),
          tt.start_time ASC
      `,
      [student.id]
    );

    return res.json({
      student: {
        id: student.id,
        student_number: student.student_number,
        first_name: student.first_name,
        last_name: student.last_name,
      },

      timetable,
    });
  } catch (error) {
    console.error("Get student timetable error:", error);

    return res.status(500).json({
      message: "Failed to fetch student timetable.",
    });
  }
};


/*
|--------------------------------------------------------------------------
| MY FEES
|--------------------------------------------------------------------------
| GET /api/student-portal/fees
|
| Returns fee records belonging ONLY to the logged-in student.
|
| Also returns payment history for those fees.
|--------------------------------------------------------------------------
*/

const getMyFees = async (req, res) => {
  try {
    const student = await getLoggedInStudent(req.user.id);

    if (!student) {
      return res.status(404).json({
        message: "Student profile not found.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | GET STUDENT FEES
    |--------------------------------------------------------------------------
    */

    const [fees] = await db.execute(
      `
        SELECT
          sf.id,
          sf.enrollment_id,
          sf.fee_type_id,

          ft.name AS fee_type,
          ft.description AS fee_description,

          sf.amount,
          sf.amount_paid,

          (
            sf.amount - sf.amount_paid
          ) AS balance,

          sf.status,
          sf.due_date,

          e.semester_id,
          sem.name AS semester,

          ay.id AS academic_year_id,
          ay.name AS academic_year,

          c.id AS class_id,
          c.name AS class_name,
          c.code AS class_code,

          sf.created_at,
          sf.updated_at

        FROM student_fees sf

        INNER JOIN enrollments e
          ON sf.enrollment_id = e.id

        INNER JOIN students st
          ON e.student_id = st.id

        INNER JOIN fee_types ft
          ON sf.fee_type_id = ft.id

        INNER JOIN semesters sem
          ON e.semester_id = sem.id

        INNER JOIN academic_years ay
          ON sem.academic_year_id = ay.id

        INNER JOIN classes c
          ON e.class_id = c.id

        WHERE st.id = ?

        ORDER BY
          sf.created_at DESC,
          ft.name ASC
      `,
      [student.id]
    );


    /*
    |--------------------------------------------------------------------------
    | GET PAYMENT HISTORY
    |--------------------------------------------------------------------------
    */

    const [payments] = await db.execute(
      `
        SELECT
          p.id,
          p.student_fee_id,

          p.amount,
          p.payment_method,
          p.reference_number,
          p.payment_date,
          p.remarks,

          sf.fee_type_id,

          ft.name AS fee_type

        FROM payments p

        INNER JOIN student_fees sf
          ON p.student_fee_id = sf.id

        INNER JOIN enrollments e
          ON sf.enrollment_id = e.id

        INNER JOIN students st
          ON e.student_id = st.id

        INNER JOIN fee_types ft
          ON sf.fee_type_id = ft.id

        WHERE st.id = ?

        ORDER BY
          p.payment_date DESC,
          p.id DESC
      `,
      [student.id]
    );


    /*
    |--------------------------------------------------------------------------
    | FINANCIAL SUMMARY
    |--------------------------------------------------------------------------
    */

    let totalFees = 0;
    let totalPaid = 0;
    let totalBalance = 0;

    fees.forEach((fee) => {
      totalFees += Number(fee.amount || 0);
      totalPaid += Number(fee.amount_paid || 0);
      totalBalance += Number(fee.balance || 0);
    });


    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    return res.json({
      student: {
        id: student.id,
        student_number: student.student_number,
        first_name: student.first_name,
        last_name: student.last_name,
      },

      summary: {
        total_fees: Number(totalFees.toFixed(2)),
        total_paid: Number(totalPaid.toFixed(2)),
        total_balance: Number(totalBalance.toFixed(2)),
      },

      fees,
      payments,
    });
  } catch (error) {
    console.error("Get student fees error:", error);

    return res.status(500).json({
      message: "Failed to fetch student fees.",
    });
  }
};


/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
  getMyProfile,
  getMyAttendance,
  getMyTimetable,
  getMyFees,
};