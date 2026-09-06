const db = require("../config/db");

const createPayment = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const {
      student_fee_id,
      amount,
      payment_method,
      reference_number,
      payment_date,
      remarks,
    } = req.body;

    if (
      !student_fee_id ||
      amount === undefined ||
      amount === null ||
      !payment_method
    ) {
      return res.status(400).json({
        message:
          "student_fee_id, amount and payment_method are required.",
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

    if (
      !["cash", "bank", "mobile_money", "card"].includes(
        payment_method
      )
    ) {
      return res.status(400).json({
        message:
          "payment_method must be cash, bank, mobile_money or card.",
      });
    }

    await connection.beginTransaction();

    const [studentFees] = await connection.execute(
      `SELECT
        id,
        amount,
        amount_paid
       FROM student_fees
       WHERE id = ?
       LIMIT 1
       FOR UPDATE`,
      [student_fee_id]
    );

    if (studentFees.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        message: "Student fee not found.",
      });
    }

    const studentFee = studentFees[0];

    const feeAmount = Number(studentFee.amount);
    const amountPaid = Number(studentFee.amount_paid);
    const outstandingBalance = feeAmount - amountPaid;

    if (numericAmount > outstandingBalance) {
      await connection.rollback();

      return res.status(400).json({
        message: "Payment amount exceeds the outstanding balance.",
        outstandingBalance,
      });
    }

    const [result] = await connection.execute(
      `INSERT INTO payments
      (
        student_fee_id,
        amount,
        payment_method,
        reference_number,
        payment_date,
        received_by,
        remarks
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        student_fee_id,
        numericAmount,
        payment_method,
        reference_number || null,
        payment_date || new Date(),
        req.user.id,
        remarks || null,
      ]
    );

    const newAmountPaid = amountPaid + numericAmount;

    let newStatus = "partial";

    if (newAmountPaid >= feeAmount) {
      newStatus = "paid";
    }

    await connection.execute(
      `UPDATE student_fees
       SET
         amount_paid = ?,
         status = ?
       WHERE id = ?`,
      [
        newAmountPaid,
        newStatus,
        student_fee_id,
      ]
    );

    await connection.commit();

    return res.status(201).json({
      message: "Payment recorded successfully.",
      paymentId: result.insertId,
      amountPaid: newAmountPaid,
      status: newStatus,
    });
  } catch (error) {
    await connection.rollback();

    console.error("Create payment error:", error);

    return res.status(500).json({
      message: "Failed to record payment.",
    });
  } finally {
    connection.release();
  }
};

const getPayments = async (req, res) => {
  try {
    const [payments] = await db.execute(
      `SELECT
        p.id,
        p.student_fee_id,
        CONCAT(st.first_name, ' ', st.last_name) AS student_name,
        st.student_number,
        ft.name AS fee_type,
        p.amount,
        p.payment_method,
        p.reference_number,
        p.payment_date,
        p.received_by,
        u.name AS received_by_name,
        p.remarks,
        p.created_at
      FROM payments p
      INNER JOIN student_fees sf
        ON p.student_fee_id = sf.id
      INNER JOIN enrollments e
        ON sf.enrollment_id = e.id
      INNER JOIN students st
        ON e.student_id = st.id
      INNER JOIN fee_types ft
        ON sf.fee_type_id = ft.id
      LEFT JOIN users u
        ON p.received_by = u.id
      ORDER BY p.payment_date DESC, p.created_at DESC`
    );

    return res.json(payments);
  } catch (error) {
    console.error("Get payments error:", error);

    return res.status(500).json({
      message: "Failed to fetch payments.",
    });
  }
};

module.exports = {
  createPayment,
  getPayments,
};