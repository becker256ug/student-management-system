import { useEffect, useState } from "react";

const API_BASE = "http://localhost:5000/api";

function StudentProfile({ auth, onLogout }) {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE}/student-portal/profile`,
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load student profile."
        );
      }

      setStudent(data.student);
    } catch (err) {
      console.error("Student profile error:", err);
      setError(err.message || "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <p style={styles.loading}>Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.error}>{error}</div>

          <button onClick={fetchProfile} style={styles.retryButton}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <p>No student profile was found.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>My Profile</h1>
          <p style={styles.subtitle}>
            View your personal and student information
          </p>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.profileHeader}>
          <div style={styles.avatar}>
            {student.first_name?.charAt(0)?.toUpperCase() || "S"}
          </div>

          <div>
            <h2 style={styles.name}>
              {student.first_name} {student.last_name}
            </h2>

            <p style={styles.studentNumber}>
              Student Number: {student.student_number || "N/A"}
            </p>
          </div>
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Personal Information</h3>

          <div style={styles.grid}>
            <ProfileItem
              label="First Name"
              value={student.first_name}
            />

            <ProfileItem
              label="Last Name"
              value={student.last_name}
            />

            <ProfileItem
              label="Gender"
              value={student.gender}
            />

            <ProfileItem
              label="Date of Birth"
              value={
                student.date_of_birth
                  ? new Date(student.date_of_birth).toLocaleDateString()
                  : "N/A"
              }
            />

            <ProfileItem
              label="Phone"
              value={student.phone}
            />

            <ProfileItem
              label="Email"
              value={student.email}
            />

            <ProfileItem
              label="Address"
              value={student.address}
            />
          </div>
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Guardian Information</h3>

          <div style={styles.grid}>
            <ProfileItem
              label="Guardian Name"
              value={student.guardian_name}
            />

            <ProfileItem
              label="Guardian Phone"
              value={student.guardian_phone}
            />
          </div>
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Student Information</h3>

          <div style={styles.grid}>
            <ProfileItem
              label="Student Number"
              value={student.student_number}
            />

            <ProfileItem
              label="Student ID"
              value={student.id}
            />

            <ProfileItem
              label="User ID"
              value={student.user_id}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileItem({ label, value }) {
  return (
    <div style={styles.item}>
      <div style={styles.label}>{label}</div>

      <div style={styles.value}>
        {value !== null &&
        value !== undefined &&
        String(value).trim() !== ""
          ? value
          : "N/A"}
      </div>
    </div>
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
    marginTop: "6px",
    color: "#6b7280",
    fontSize: "14px",
  },

  card: {
    background: "#ffffff",
    borderRadius: "12px",
    padding: "24px",
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.06)",
    border: "1px solid #e5e7eb",
  },

  profileHeader: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    paddingBottom: "24px",
    borderBottom: "1px solid #e5e7eb",
  },

  avatar: {
    width: "64px",
    height: "64px",
    borderRadius: "50%",
    background: "#2563eb",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "26px",
    fontWeight: "700",
  },

  name: {
    margin: 0,
    fontSize: "22px",
    fontWeight: "700",
  },

  studentNumber: {
    margin: "6px 0 0",
    color: "#6b7280",
    fontSize: "14px",
  },

  section: {
    marginTop: "28px",
  },

  sectionTitle: {
    margin: "0 0 16px",
    fontSize: "18px",
    fontWeight: "600",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
  },

  item: {
    padding: "14px",
    background: "#f9fafb",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
  },

  label: {
    fontSize: "12px",
    color: "#6b7280",
    marginBottom: "6px",
    fontWeight: "500",
  },

  value: {
    fontSize: "15px",
    color: "#111827",
    fontWeight: "500",
    wordBreak: "break-word",
  },

  loading: {
    textAlign: "center",
    color: "#6b7280",
  },

  error: {
    padding: "12px",
    background: "#fee2e2",
    color: "#991b1b",
    borderRadius: "8px",
    marginBottom: "12px",
  },

  retryButton: {
    padding: "10px 16px",
    border: "none",
    borderRadius: "7px",
    background: "#2563eb",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: "600",
  },
};

export default StudentProfile;