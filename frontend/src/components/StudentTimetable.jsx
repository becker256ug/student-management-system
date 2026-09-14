import { useEffect, useState } from "react";

const API_BASE = "http://localhost:5000/api";

function StudentTimetable({ auth, onLogout }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTimetable();
  }, []);

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE}/student-portal/timetable`,
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
          result.message || "Failed to load timetable."
        );
      }

      setData(result);
    } catch (err) {
      console.error("Student timetable error:", err);
      setError(err.message || "Failed to load timetable.");
    } finally {
      setLoading(false);
    }
  };

  const timetable = data?.timetable || [];
  const student = data?.student;

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const groupedTimetable = days.reduce((groups, day) => {
    groups[day] = timetable.filter(
      (item) =>
        String(item.day_of_week || "").toLowerCase() ===
        day.toLowerCase()
    );

    return groups;
  }, {});

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <p style={styles.loading}>
            Loading your timetable...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.error}>{error}</div>

          <button
            onClick={fetchTimetable}
            style={styles.button}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>My Timetable</h1>

        <p style={styles.subtitle}>
          View your weekly class timetable
        </p>
      </div>

      {student && (
        <div style={styles.studentCard}>
          <div style={styles.avatar}>
            {student.first_name?.charAt(0)?.toUpperCase() ||
              "S"}
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

      {timetable.length === 0 ? (
        <div style={styles.card}>
          <div style={styles.empty}>
            No timetable records found for your current
            enrollment.
          </div>
        </div>
      ) : (
        <div style={styles.daysContainer}>
          {days.map((day) => {
            const dayClasses = groupedTimetable[day];

            return (
              <div key={day} style={styles.dayCard}>
                <div style={styles.dayHeader}>
                  <h2 style={styles.dayTitle}>{day}</h2>

                  <span style={styles.classCount}>
                    {dayClasses.length}{" "}
                    {dayClasses.length === 1
                      ? "class"
                      : "classes"}
                  </span>
                </div>

                {dayClasses.length === 0 ? (
                  <div style={styles.noClass}>
                    No classes scheduled
                  </div>
                ) : (
                  <div style={styles.classList}>
                    {dayClasses.map((item) => (
                      <div
                        key={item.id}
                        style={styles.classItem}
                      >
                        <div style={styles.time}>
                          {formatTime(item.start_time)} –{" "}
                          {formatTime(item.end_time)}
                        </div>

                        <div style={styles.classDetails}>
                          <h3 style={styles.subject}>
                            {item.subject_name || "N/A"}
                          </h3>

                          <p style={styles.className}>
                            Class:{" "}
                            {item.class_name || "N/A"}
                          </p>

                          <p style={styles.semester}>
                            Semester:{" "}
                            {item.semester_name || "N/A"}
                          </p>

                          {item.academic_year_name && (
                            <p style={styles.academicYear}>
                              Academic Year:{" "}
                              {item.academic_year_name}
                            </p>
                          )}

                          {item.room && (
                            <p style={styles.room}>
                              Room: {item.room}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatTime(time) {
  if (!time) return "N/A";

  const parts = String(time).split(":");

  if (parts.length < 2) {
    return time;
  }

  const hours = parseInt(parts[0], 10);
  const minutes = parts[1];

  if (Number.isNaN(hours)) {
    return time;
  }

  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;

  return `${displayHour}:${minutes} ${suffix}`;
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

  daysContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },

  dayCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.05)",
  },

  dayHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px",
    background: "#f9fafb",
    borderBottom: "1px solid #e5e7eb",
  },

  dayTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "700",
  },

  classCount: {
    fontSize: "13px",
    color: "#6b7280",
  },

  classList: {
    display: "flex",
    flexDirection: "column",
  },

  classItem: {
    display: "flex",
    gap: "20px",
    padding: "18px 20px",
    borderBottom: "1px solid #e5e7eb",
  },

  time: {
    minWidth: "125px",
    fontWeight: "700",
    color: "#2563eb",
    fontSize: "14px",
    paddingTop: "2px",
  },

  classDetails: {
    flex: 1,
  },

  subject: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "700",
    color: "#111827",
  },

  className: {
    margin: "6px 0 0",
    fontSize: "13px",
    color: "#4b5563",
  },

  semester: {
    margin: "4px 0 0",
    fontSize: "13px",
    color: "#6b7280",
  },

  academicYear: {
    margin: "4px 0 0",
    fontSize: "13px",
    color: "#6b7280",
  },

  room: {
    margin: "6px 0 0",
    fontSize: "13px",
    color: "#374151",
    fontWeight: "600",
  },

  noClass: {
    padding: "20px",
    color: "#9ca3af",
    fontSize: "14px",
  },

  card: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "24px",
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.05)",
  },

  empty: {
    textAlign: "center",
    padding: "20px",
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

export default StudentTimetable;