const db = require("../config/db");

const createStudentFee = async (req, res) => {
  try {
    const {
      enrollment_id,
      fee_type_id,
      amount,
      due_date,
    } = req.body;

    if (
      !enrollment_id ||
      !fee_type_id ||
      amount === undefined ||
      amount === null
    ) {
      return res.status(400).json({
        message:
          "enrollment_id, fee_type_id and amount are required.",
      });
    }

    const numericAmount = Number(amount);

    if (
      Number.isNaN(numericAmount) ||
      numericAmount <= 0
    ) {
      return res.status(400).json({
        message: "amount must be a number greater than 0.",
      });
    }

    const [enrollments] = await db.execute(
      `SELECT id
       FROM enrollments
       WHERE id = ?
       LIMIT 1`,
      [enrollment_id]
    );

    if (enrollments.length === 0) {
      return res.status(404).json({
        message: "Enrollment not found.",
      });
    }

    const [feeTypes] = await db.execute(
      `SELECT id
       FROM fee_types
       WHERE id = ?
       LIMIT 1`,
      [fee_type_id]
    );

    if (feeTypes.length === 0) {
      return res.status(404).json({
        message: "Fee type not found.",
      });
    }

    const [existingFee] = await db.execute(
      `SELECT id
       FROM student_fees
       WHERE enrollment_id = ?
         AND fee_type_id = ?
       LIMIT 1`,
      [enrollment_id, fee_type_id]
    );

    if (existingFee.length > 0) {
      return res.status(409).json({
        message:
          "This fee type is already assigned to this enrollment.",
      });
    }

    const [result] = await db.execute(
      `INSERT INTO student_fees
      (
        enrollment_id,
        fee_type_id,
        amount,
        amount_paid,
        status,
        due_date
      )
      VALUES (?, ?, ?, 0.00, 'pending', ?)`,
      [
        enrollment_id,
        fee_type_id,
        numericAmount,
        due_date || null,
      ]
    );

    return res.status(201).json({
      message: "Student fee assigned successfully.",
      studentFeeId: result.insertId,
    });
  } catch (error) {
    console.error("Create student fee error:", error);

    return res.status(500).json({
      message: "Failed to assign student fee.",
    });
  }
};

const getStudentFees = async (req, res) => {
  try {
    const [studentFees] = await db.execute(
      `SELECT
        sf.id,
        sf.enrollment_id,
        CONCAT(st.first_name, ' ', st.last_name) AS student_name,
        st.student_number,
        sf.fee_type_id,
        ft.name AS fee_type,
        sf.amount,
        sf.amount_paid,
        sf.status,
        sf.due_date,
        sf.created_at,
        sf.updated_at
      FROM student_fees sf
      INNER JOIN enrollments e
        ON sf.enrollment_id = e.id
      INNER JOIN students st
        ON e.student_id = st.id
      INNER JOIN fee_types ft
        ON sf.fee_type_id = ft.id
      ORDER BY sf.created_at DESC`
    );

    return res.json(studentFees);
  } catch (error) {
    console.error("Get student fees error:", error);

    return res.status(500).json({
      message: "Failed to fetch student fees.",
    });
  }
};

module.exports = {
  createStudentFee,
  getStudentFees,
};