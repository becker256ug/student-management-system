import { useEffect, useState } from "react";

const API_BASE = "http://localhost:5000/api";

function StudentFees({ auth, onLogout }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchFees();
  }, []);

  const fetchFees = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE}/student-portal/fees`,
        {
          headers: {
            Authorization: `Bearer ${auth?.token}`,
          },
        }
      );

      if (response.status === 401 || response.status === 403) {
        onLogout();
        return;
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to load fees."
        );
      }

      setData(result);
    } catch (err) {
      console.error("Student fees error:", err);
      setError(err.message || "Failed to load fees.");
    } finally {
      setLoading(false);
    }
  };

  const student = data?.student;
  const summary = data?.summary || {};
  const fees = data?.fees || [];
  const payments = data?.payments || [];

  const totalFees = Number(summary.total_fees || 0);
  const totalPaid = Number(summary.total_paid || 0);
  const totalBalance = Number(summary.total_balance || 0);

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <p style={styles.loading}>Loading your fees...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.error}>{error}</div>

          <button onClick={fetchFees} style={styles.button}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>My Fees</h1>

        <p style={styles.subtitle}>
          View your school fees, payments and outstanding balance
        </p>
      </div>

      {student && (
        <div style={styles.studentCard}>
          <div style={styles.avatar}>
            {student.first_name?.charAt(0)?.toUpperCase() || "S"}
          </div>

          <div>
            <h2 style={styles.studentName}>
              {student.first_name} {student.last_name}
            </h2>

            <p style={styles.studentNumber}>
              Student Number:{" "}
              {student.student_number || "N/A"}
            </p>
          </div>
        </div>
      )}

      {/* Financial Summary */}
      <div style={styles.summaryGrid}>
        <SummaryCard
          title="Total Fees"
          value={formatAmount(totalFees)}
        />

        <SummaryCard
          title="Total Paid"
          value={formatAmount(totalPaid)}
        />

        <SummaryCard
          title="Balance"
          value={formatAmount(totalBalance)}
        />
      </div>

      {/* Fee Records */}
      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Fee Records</h2>

        {fees.length === 0 ? (
          <div style={styles.empty}>
            No fee records found.
          </div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Fee Type</th>
                  <th style={styles.th}>Amount</th>
                  <th style={styles.th}>Paid</th>
                  <th style={styles.th}>Balance</th>
                  <th style={styles.th}>Semester</th>
                  <th style={styles.th}>Academic Year</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>

              <tbody>
                {fees.map((fee) => {
                  const amount = Number(fee.amount || 0);
                  const paid = Number(fee.paid_amount || 0);
                  const balance = Number(
                    fee.balance ?? amount - paid
                  );

                  return (
                    <tr key={fee.id}>
                      <td style={styles.td}>
                        {fee.fee_type_name || "N/A"}
                      </td>

                      <td style={styles.td}>
                        {formatAmount(amount)}
                      </td>

                      <td style={styles.td}>
                        {formatAmount(paid)}
                      </td>

                      <td style={styles.td}>
                        {formatAmount(balance)}
                      </td>

                      <td style={styles.td}>
                        {fee.semester_name || "N/A"}
                      </td>

                      <td style={styles.td}>
                        {fee.academic_year_name || "N/A"}
                      </td>

                      <td style={styles.td}>
                        <FeeStatus balance={balance} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment History */}
      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Payment History</h2>

        {payments.length === 0 ? (
          <div style={styles.empty}>
            No payment records found.
          </div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Amount</th>
                  <th style={styles.th}>Payment Method</th>
                  <th style={styles.th}>Reference</th>
                  <th style={styles.th}>Fee Type</th>
                </tr>
              </thead>

              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td style={styles.td}>
                      {payment.payment_date
                        ? new Date(
                            payment.payment_date
                          ).toLocaleDateString()
                        : "N/A"}
                    </td>

                    <td style={styles.td}>
                      {formatAmount(payment.amount)}
                    </td>

                    <td style={styles.td}>
                      {payment.payment_method || "N/A"}
                    </td>

                    <td style={styles.td}>
                      {payment.reference_number ||
                        payment.transaction_reference ||
                        "—"}
                    </td>

                    <td style={styles.td}>
                      {payment.fee_type_name || "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ title, value }) {
  return (
    <div style={styles.summaryCard}>
      <div style={styles.summaryTitle}>{title}</div>

      <div style={styles.summaryValue}>{value}</div>
    </div>
  );
}

function FeeStatus({ balance }) {
  if (balance <= 0) {
    return (
      <span
        style={{
          ...styles.badge,
          background: "#dcfce7",
          color: "#166534",
        }}
      >
        Paid
      </span>
    );
  }

  return (
    <span
      style={{
        ...styles.badge,
        background: "#fef3c7",
        color: "#92400e",
      }}
    >
      Balance Due
    </span>
  );
}

function formatAmount(amount) {
  const value = Number(amount || 0);

  return value.toLocaleString("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 0,
  });
}

const styles = {
  page: {
    width: "100%",
    padding: "24px",
    boxSizing: "border-box",
  },

  header: {
    marginBottom: "24px",
  },

  title: {
    margin: 0,
    fontSize: "28px",
    fontWeight: "700",
  },

  subtitle: {
    margin: "6px 0 0",
    color: "#6b7280",
    fontSize: "14px",
  },

  studentCard: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "24px",
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.05)",
  },

  avatar: {
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    background: "#2563eb",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    fontWeight: "700",
  },

  studentName: {
    margin: 0,
    fontSize: "19px",
    fontWeight: "700",
  },

  studentNumber: {
    margin: "5px 0 0",
    color: "#6b7280",
    fontSize: "13px",
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
    marginBottom: "24px",
  },

  summaryCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "20px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
  },

  summaryTitle: {
    color: "#6b7280",
    fontSize: "13px",
    marginBottom: "8px",
  },

  summaryValue: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#111827",
  },

  card: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "24px",
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.05)",
  },

  sectionTitle: {
    margin: "0 0 18px",
    fontSize: "18px",
    fontWeight: "600",
  },

  tableWrapper: {
    width: "100%",
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "850px",
  },

  th: {
    textAlign: "left",
    padding: "12px",
    borderBottom: "2px solid #e5e7eb",
    background: "#f9fafb",
    fontSize: "13px",
    fontWeight: "600",
    color: "#374151",
  },

  td: {
    padding: "12px",
    borderBottom: "1px solid #e5e7eb",
    fontSize: "14px",
    color: "#374151",
  },

  badge: {
    display: "inline-block",
    padding: "5px 9px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "600",
  },

  empty: {
    textAlign: "center",
    padding: "30px",
    color: "#6b7280",
  },

  loading: {
    textAlign: "center",
    color: "#6b7280",
  },

  error: {
    padding: "12px",
    marginBottom: "12px",
    background: "#fee2e2",
    color: "#991b1b",
    borderRadius: "8px",
  },

  button: {
    padding: "10px 16px",
    border: "none",
    borderRadius: "7px",
    background: "#2563eb",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: "600",
  },
};

export default StudentFees;