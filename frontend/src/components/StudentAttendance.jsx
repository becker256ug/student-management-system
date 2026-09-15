import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function StudentAttendance({ auth, onLogout }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE}/student-portal/attendance`,
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
          result.message || "Failed to load attendance."
        );
      }

      setData(result);
    } catch (err) {
      console.error("Student attendance error:", err);
      setError(err.message || "Failed to load attendance.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <p style={styles.loading}>Loading your attendance...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.error}>{error}</div>

          <button onClick={fetchAttendance} style={styles.button}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const student = data?.student;
  const summary = data?.summary || {};
  const attendance = data?.attendance || [];

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>My Attendance</h1>

        <p style={styles.subtitle}>
          View your attendance records and attendance performance
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
              Student Number: {student.student_number || "N/A"}
            </p>
          </div>
        </div>
      )}

      <div style={styles.summaryGrid}>
        <SummaryCard
          title="Total"
          value={summary.total || 0}
        />

        <SummaryCard
          title="Present"
          value={summary.present || 0}
        />

        <SummaryCard
          title="Absent"
          value={summary.absent || 0}
        />

        <SummaryCard
          title="Late"
          value={summary.late || 0}
        />

        <SummaryCard
          title="Excused"
          value={summary.excused || 0}
        />

        <SummaryCard
          title="Attendance %"
          value={`${Number(summary.attendance_percentage || 0).toFixed(1)}%`}
        />
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Attendance Records</h2>

        {attendance.length === 0 ? (
          <div style={styles.empty}>
            No attendance records found.
          </div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Class</th>
                  <th style={styles.th}>Subject</th>
                  <th style={styles.th}>Semester</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Remarks</th>
                </tr>
              </thead>

              <tbody>
                {attendance.map((record) => (
                  <tr key={record.id}>
                    <td style={styles.td}>
                      {record.attendance_date
                        ? new Date(
                            record.attendance_date
                          ).toLocaleDateString()
                        : "N/A"}
                    </td>

                    <td style={styles.td}>
                      {record.class_name || "N/A"}
                    </td>

                    <td style={styles.td}>
                      {record.subject_name || "N/A"}
                    </td>

                    <td style={styles.td}>
                      {record.semester_name || "N/A"}
                    </td>

                    <td style={styles.td}>
                      <StatusBadge status={record.status} />
                    </td>

                    <td style={styles.td}>
                      {record.remarks || "—"}
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

function StatusBadge({ status }) {
  const normalized = String(status || "").toLowerCase();

  let background = "#f3f4f6";
  let color = "#374151";

  if (normalized === "present") {
    background = "#dcfce7";
    color = "#166534";
  } else if (normalized === "absent") {
    background = "#fee2e2";
    color = "#991b1b";
  } else if (normalized === "late") {
    background = "#fef3c7";
    color = "#92400e";
  } else if (normalized === "excused") {
    background = "#dbeafe";
    color = "#1e40af";
  }

  return (
    <span
      style={{
        ...styles.badge,
        background,
        color,
      }}
    >
      {status || "N/A"}
    </span>
  );
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
    marginBottom: "20px",
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
      "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "16px",
    marginBottom: "24px",
  },

  summaryCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "18px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
  },

  summaryTitle: {
    color: "#6b7280",
    fontSize: "13px",
    marginBottom: "8px",
  },

  summaryValue: {
    fontSize: "25px",
    fontWeight: "700",
    color: "#111827",
  },

  card: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "20px",
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
    minWidth: "750px",
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
    textTransform: "capitalize",
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

export default StudentAttendance;
