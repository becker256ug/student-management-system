import { useEffect, useState } from "react";

import StudentProfile from "./StudentProfile";
import StudentResults from "./StudentResults";
import StudentReportCard from "./StudentReportCard";
import StudentAttendance from "./StudentAttendance";
import StudentTimetable from "./StudentTimetable";
import StudentFees from "./StudentFees";

const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function StudentDashboard({ auth, onLogout }) {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState("dashboard");

  useEffect(() => {
    const loadStudentData = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          API_BASE + "/enrollments",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + auth.token,
            },
          }
        );

        if (response.status === 401 || response.status === 403) {
          onLogout();
          return;
        }

        const data = await response.json().catch(() => []);

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to load your student information."
          );
        }

        let enrollmentList = [];

        if (Array.isArray(data)) {
          enrollmentList = data;
        } else if (Array.isArray(data.enrollments)) {
          enrollmentList = data.enrollments;
        } else if (Array.isArray(data.data)) {
          enrollmentList = data.data;
        }

        setEnrollments(enrollmentList);
      } catch (err) {
        console.error("Student dashboard error:", err);

        setError(
          err.message ||
            "Unable to load student information."
        );
      } finally {
        setLoading(false);
      }
    };

    if (auth && auth.token) {
      loadStudentData();
    } else {
      setLoading(false);
    }
  }, [auth, onLogout]);

  const firstName =
    auth &&
    auth.user &&
    auth.user.first_name
      ? auth.user.first_name
      : "";

  const lastName =
    auth &&
    auth.user &&
    auth.user.last_name
      ? auth.user.last_name
      : "";

  const studentName =
    firstName || lastName
      ? (firstName + " " + lastName).trim()
      : auth &&
        auth.user &&
        auth.user.name
      ? auth.user.name
      : "Student";

  const studentEmail =
    auth &&
    auth.user &&
    auth.user.email
      ? auth.user.email
      : "";

  const latestEnrollment =
    enrollments.length > 0
      ? enrollments[0]
      : null;

  const handleLogout = () => {
    const confirmed = window.confirm(
      "Are you sure you want to logout?"
    );

    if (confirmed) {
      onLogout();
    }
  };

  const renderDashboard = () => {
    return (
      <div>
        <div className="student-page-heading">
          <div>
            <p className="student-eyebrow">
              STUDENT PORTAL
            </p>

            <h1>
              Welcome, {studentName}
            </h1>

            <p>
              View your academic information,
              enrollment and school activities.
            </p>
          </div>
        </div>

        {error ? (
          <div className="student-alert student-error">
            <strong>!</strong>

            <span>{error}</span>
          </div>
        ) : null}

        <div className="student-stats">
          <div className="student-stat-card">
            <div className="student-stat-icon">
              🎓
            </div>

            <div>
              <small>My Enrollment</small>

              <strong>
                {enrollments.length}
              </strong>
            </div>
          </div>

          <div className="student-stat-card">
            <div className="student-stat-icon">
              🏫
            </div>

            <div>
              <small>My Class</small>

              <strong>
                {latestEnrollment &&
                latestEnrollment.class_name
                  ? latestEnrollment.class_name
                  : latestEnrollment &&
                    latestEnrollment.class_code
                  ? latestEnrollment.class_code
                  : "—"}
              </strong>
            </div>
          </div>

          <div className="student-stat-card">
            <div className="student-stat-icon">
              📅
            </div>

            <div>
              <small>Semester</small>

              <strong>
                {latestEnrollment &&
                latestEnrollment.semester_name
                  ? latestEnrollment.semester_name
                  : latestEnrollment &&
                    latestEnrollment.semester
                  ? latestEnrollment.semester
                  : "—"}
              </strong>
            </div>
          </div>

          <div className="student-stat-card">
            <div className="student-stat-icon">
              ✓
            </div>

            <div>
              <small>Status</small>

              <strong>
                {latestEnrollment &&
                latestEnrollment.status
                  ? latestEnrollment.status
                  : "Active"}
              </strong>
            </div>
          </div>
        </div>

        <div className="student-content-grid">
          <section className="student-section">
            <div className="student-section-header">
              <div>
                <h2>My Enrollment</h2>

                <p>
                  Your current school enrollment
                  information.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="student-empty">
                Loading your enrollment...
              </div>
            ) : enrollments.length === 0 ? (
              <div className="student-empty">
                <div className="student-empty-icon">
                  🎓
                </div>

                <strong>
                  No enrollment found
                </strong>

                <span>
                  Your enrollment information will
                  appear here once you are enrolled.
                </span>
              </div>
            ) : (
              <div className="student-table-wrapper">
                <table className="student-portal-table">
                  <thead>
                    <tr>
                      <th>Class</th>
                      <th>Semester</th>
                      <th>Academic Year</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {enrollments.map(
                      (enrollment, index) => {
                        let rowKey = index;

                        if (enrollment.id) {
                          rowKey = enrollment.id;
                        } else if (
                          enrollment.enrollment_id
                        ) {
                          rowKey =
                            enrollment.enrollment_id;
                        }

                        let statusClass = "";

                        if (
                          enrollment.status ===
                          "active"
                        ) {
                          statusClass = "active";
                        }

                        return (
                          <tr key={rowKey}>
                            <td>
                              <strong>
                                {enrollment.class_name ||
                                  enrollment.class_code ||
                                  "—"}
                              </strong>
                            </td>

                            <td>
                              {enrollment.semester_name ||
                                enrollment.semester ||
                                "—"}
                            </td>

                            <td>
                              {enrollment.academic_year_name ||
                                enrollment.academic_year ||
                                "—"}
                            </td>

                            <td>
                              {enrollment.enrollment_date ||
                                "—"}
                            </td>

                            <td>
                              <span
                                className={
                                  "student-status " +
                                  statusClass
                                }
                              >
                                {enrollment.status ||
                                  "Active"}
                              </span>
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="student-profile-card">
            <div className="student-profile-avatar">
              {studentName
                .charAt(0)
                .toUpperCase()}
            </div>

            <h2>{studentName}</h2>

            <p>{studentEmail}</p>

            <div className="student-profile-line">
              <span>Student Number</span>

              <strong>
                {(latestEnrollment &&
                  latestEnrollment.student_number) ||
                  (auth &&
                    auth.user &&
                    auth.user.student_number) ||
                  "—"}
              </strong>
            </div>

            <div className="student-profile-line">
              <span>Class</span>

              <strong>
                {(latestEnrollment &&
                  latestEnrollment.class_name) ||
                  "—"}
              </strong>
            </div>

            <button
              type="button"
              className="student-profile-button"
              onClick={() =>
                setActiveSection("profile")
              }
            >
              View My Profile →
            </button>
          </section>
        </div>

        <section className="student-quick-section">
          <div className="student-section-header">
            <div>
              <h2>Student Services</h2>

              <p>
                Access your academic information.
              </p>
            </div>
          </div>

          <div className="student-quick-grid">
            <button
              type="button"
              onClick={() =>
                setActiveSection("profile")
              }
            >
              <span>👤</span>

              <strong>My Profile</strong>

              <small>
                View personal information
              </small>
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveSection("results")
              }
            >
              <span>📊</span>

              <strong>My Results</strong>

              <small>
                View academic results
              </small>
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveSection("report-card")
              }
            >
              <span>📄</span>

              <strong>Report Card</strong>

              <small>
                View and print report card
              </small>
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveSection("attendance")
              }
            >
              <span>✓</span>

              <strong>My Attendance</strong>

              <small>
                View attendance records
              </small>
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveSection("timetable")
              }
            >
              <span>🗓</span>

              <strong>My Timetable</strong>

              <small>
                View class timetable
              </small>
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveSection("fees")
              }
            >
              <span>💳</span>

              <strong>My Fees</strong>

              <small>
                View fees and payments
              </small>
            </button>
          </div>
        </section>
      </div>
    );
  };

  const renderActiveSection = () => {
    if (activeSection === "profile") {
      return (
        <StudentProfile
          auth={auth}
          onLogout={onLogout}
        />
      );
    }

    if (activeSection === "results") {
      return (
        <StudentResults
          auth={auth}
          onLogout={onLogout}
        />
      );
    }

    if (activeSection === "report-card") {
      return (
        <StudentReportCard
          auth={auth}
          onLogout={onLogout}
        />
      );
    }

    if (activeSection === "attendance") {
      return (
        <StudentAttendance
          auth={auth}
          onLogout={onLogout}
        />
      );
    }

    if (activeSection === "timetable") {
      return (
        <StudentTimetable
          auth={auth}
          onLogout={onLogout}
        />
      );
    }

    if (activeSection === "fees") {
      return (
        <StudentFees
          auth={auth}
          onLogout={onLogout}
        />
      );
    }

    return renderDashboard();
  };

  return (
    <div className="student-app">
      <style>{studentStyles}</style>

      <header className="student-topbar">
        <div className="student-brand">
          <div className="student-brand-logo">
            SM
          </div>

          <div>
            <strong>
              Student<span>Hub</span>
            </strong>

            <small>
              STUDENT MANAGEMENT SYSTEM
            </small>
          </div>
        </div>

        <div className="student-topbar-right">
          <div className="student-user">
            <div className="student-user-avatar">
              {studentName
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <strong>{studentName}</strong>

              <small>Student</small>
            </div>
          </div>

          <button
            type="button"
            className="student-logout"
            onClick={handleLogout}
          >
            <span>↪</span>
            Logout
          </button>
        </div>
      </header>

      <div className="student-layout">
        <aside className="student-sidebar">
          <p className="student-nav-label">
            MAIN MENU
          </p>

          <button
            type="button"
            className={
              activeSection === "dashboard"
                ? "student-nav-item active"
                : "student-nav-item"
            }
            onClick={() =>
              setActiveSection("dashboard")
            }
          >
            <span>⌂</span>
            Dashboard
          </button>

          <button
            type="button"
            className={
              activeSection === "profile"
                ? "student-nav-item active"
                : "student-nav-item"
            }
            onClick={() =>
              setActiveSection("profile")
            }
          >
            <span>👤</span>
            My Profile
          </button>

          <button
            type="button"
            className={
              activeSection === "results"
                ? "student-nav-item active"
                : "student-nav-item"
            }
            onClick={() =>
              setActiveSection("results")
            }
          >
            <span>📊</span>
            My Results
          </button>

          <button
            type="button"
            className={
              activeSection === "report-card"
                ? "student-nav-item active"
                : "student-nav-item"
            }
            onClick={() =>
              setActiveSection("report-card")
            }
          >
            <span>📄</span>
            Report Card
          </button>

          <button
            type="button"
            className={
              activeSection === "attendance"
                ? "student-nav-item active"
                : "student-nav-item"
            }
            onClick={() =>
              setActiveSection("attendance")
            }
          >
            <span>✓</span>
            My Attendance
          </button>

          <button
            type="button"
            className={
              activeSection === "timetable"
                ? "student-nav-item active"
                : "student-nav-item"
            }
            onClick={() =>
              setActiveSection("timetable")
            }
          >
            <span>🗓</span>
            My Timetable
          </button>

          <button
            type="button"
            className={
              activeSection === "fees"
                ? "student-nav-item active"
                : "student-nav-item"
            }
            onClick={() =>
              setActiveSection("fees")
            }
          >
            <span>💳</span>
            My Fees
          </button>

          <div className="student-sidebar-divider"></div>

          <div className="student-sidebar-info">
            <small>ACCOUNT TYPE</small>

            <strong>STUDENT</strong>

            <span>
              Personal academic portal
            </span>
          </div>
        </aside>

        <main className="student-main">
          {renderActiveSection()}
        </main>
      </div>
    </div>
  );
}

const studentStyles = `
.student-app {
  min-height: 100vh;
  background: #f5f7fb;
  color: #14213d;
  font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.student-topbar {
  min-height: 76px;
  background: #ffffff;
  border-bottom: 1px solid #e8edf5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  gap: 24px;
}

.student-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.student-brand-logo {
  width: 42px;
  height: 42px;
  border-radius: 11px;
  background: #2563eb;
  color: #ffffff;
  display: grid;
  place-items: center;
  font-weight: 800;
  box-shadow: 0 7px 18px rgba(37, 99, 235, 0.2);
}

.student-brand strong {
  display: block;
  font-size: 18px;
  letter-spacing: -0.3px;
}

.student-brand strong span {
  color: #2563eb;
}

.student-brand small {
  display: block;
  color: #8a96aa;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 1px;
  margin-top: 2px;
}

.student-topbar-right {
  display: flex;
  align-items: center;
  gap: 18px;
}

.student-user {
  display: flex;
  align-items: center;
  gap: 10px;
}

.student-user-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #eaf2ff;
  color: #2563eb;
  display: grid;
  place-items: center;
  font-weight: 800;
}

.student-user strong,
.student-user small {
  display: block;
}

.student-user strong {
  font-size: 13px;
}

.student-user small {
  color: #8995aa;
  margin-top: 2px;
  font-size: 11px;
}

.student-logout {
  border: 1px solid #fecaca;
  background: #fff5f5;
  color: #dc2626;
  border-radius: 9px;
  padding: 9px 14px;
  cursor: pointer;
  font-weight: 700;
  transition: 0.2s ease;
}

.student-logout:hover {
  background: #fee2e2;
  border-color: #fca5a5;
}

.student-layout {
  display: flex;
  min-height: calc(100vh - 76px);
}

.student-sidebar {
  width: 235px;
  flex: 0 0 235px;
  background: #111827;
  color: #ffffff;
  padding: 28px 14px;
}

.student-nav-label {
  margin: 0 12px 12px;
  color: #64748b;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 1.5px;
}

.student-nav-item {
  width: 100%;
  min-height: 45px;
  margin-bottom: 5px;
  padding: 0 13px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 11px;
  text-align: left;
  font-size: 12px;
  font-weight: 650;
  cursor: pointer;
  transition: 0.2s ease;
}

.student-nav-item span {
  width: 21px;
  display: inline-flex;
  justify-content: center;
}

.student-nav-item:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #ffffff;
}

.student-nav-item.active {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #ffffff;
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.24);
}

.student-sidebar-divider {
  margin: 24px 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.student-sidebar-info {
  padding: 12px;
}

.student-sidebar-info small {
  display: block;
  color: #64748b;
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 1.2px;
}

.student-sidebar-info strong {
  display: block;
  margin-top: 7px;
  color: #f8fafc;
  font-size: 11px;
}

.student-sidebar-info span {
  display: block;
  margin-top: 4px;
  color: #94a3b8;
  font-size: 9px;
}

.student-main {
  flex: 1;
  min-width: 0;
  padding: 34px;
}

.student-page-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 27px;
}

.student-eyebrow {
  margin: 0 0 7px;
  color: #2563eb;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 1.7px;
}

.student-page-heading h1 {
  margin: 0;
  color: #111827;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.8px;
}

.student-page-heading p:last-child {
  margin: 7px 0 0;
  color: #7b8494;
  font-size: 12px;
}

.student-alert {
  margin-bottom: 20px;
  padding: 13px 15px;
  border-radius: 9px;
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 11px;
  font-weight: 650;
}

.student-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
}

.student-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.student-stat-card {
  min-height: 105px;
  padding: 17px;
  background: #ffffff;
  border: 1px solid #e8edf5;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.035);
  display: flex;
  align-items: center;
  gap: 13px;
}

.student-stat-icon {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: 10px;
  background: #eff6ff;
  display: grid;
  place-items: center;
  font-size: 18px;
}

.student-stat-card small {
  display: block;
  color: #8995aa;
  font-size: 9px;
  font-weight: 700;
}

.student-stat-card strong {
  display: block;
  margin-top: 6px;
  color: #172033;
  font-size: 16px;
  font-weight: 800;
}

.student-content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(260px, 0.8fr);
  gap: 18px;
}

.student-section,
.student-profile-card,
.student-quick-section {
  background: #ffffff;
  border: 1px solid #e8edf5;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.035);
}

.student-section {
  overflow: hidden;
}

.student-section-header {
  min-height: 70px;
  padding: 18px 21px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #edf1f6;
}

.student-section-header h2 {
  margin: 0;
  color: #172033;
  font-size: 14px;
  font-weight: 750;
}

.student-section-header p {
  margin: 4px 0 0;
  color: #8995aa;
  font-size: 10px;
}

.student-table-wrapper {
  width: 100%;
  overflow-x: auto;
}

.student-portal-table {
  width: 100%;
  min-width: 650px;
  border-collapse: collapse;
}

.student-portal-table th {
  padding: 12px 18px;
  background: #f8fafc;
  color: #94a3b8;
  font-size: 8px;
  font-weight: 800;
  text-align: left;
  text-transform: uppercase;
  letter-spacing: 0.7px;
}

.student-portal-table td {
  padding: 14px 18px;
  border-top: 1px solid #f0f2f5;
  color: #64748b;
  font-size: 10px;
}

.student-portal-table td strong {
  color: #273246;
}

.student-status {
  display: inline-block;
  padding: 5px 9px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #64748b;
  font-size: 8px;
  font-weight: 750;
  text-transform: capitalize;
}

.student-status.active {
  background: #ecfdf5;
  color: #047857;
}

.student-profile-card {
  padding: 26px;
  text-align: center;
}

.student-profile-avatar {
  width: 66px;
  height: 66px;
  margin: 0 auto 14px;
  border-radius: 50%;
  background: #eaf2ff;
  color: #2563eb;
  display: grid;
  place-items: center;
  font-size: 22px;
  font-weight: 800;
}

.student-profile-card h2 {
  margin: 0;
  color: #172033;
  font-size: 16px;
}

.student-profile-card > p {
  margin: 5px 0 22px;
  color: #8995aa;
  font-size: 10px;
}

.student-profile-line {
  padding: 12px 0;
  border-top: 1px solid #edf1f6;
  text-align: left;
}

.student-profile-line span {
  display: block;
  color: #8995aa;
  font-size: 9px;
}

.student-profile-line strong {
  display: block;
  margin-top: 4px;
  color: #334155;
  font-size: 10px;
}

.student-profile-button {
  width: 100%;
  margin-top: 12px;
  border: 0;
  border-radius: 9px;
  background: #2563eb;
  color: #ffffff;
  padding: 10px 14px;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
}

.student-profile-button:hover {
  background: #1d4ed8;
}

.student-quick-section {
  margin-top: 20px;
  overflow: hidden;
}

.student-quick-grid {
  padding: 15px;
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 10px;
}

.student-quick-grid button {
  min-height: 105px;
  padding: 14px;
  border: 1px solid #edf1f6;
  border-radius: 10px;
  background: #ffffff;
  text-align: left;
  cursor: pointer;
  transition: 0.2s ease;
}

.student-quick-grid button:hover {
  border-color: #bfdbfe;
  background: #f8fbff;
  transform: translateY(-1px);
}

.student-quick-grid button > span {
  display: block;
  font-size: 20px;
}

.student-quick-grid strong {
  display: block;
  margin-top: 10px;
  color: #334155;
  font-size: 10px;
}

.student-quick-grid small {
  display: block;
  margin-top: 4px;
  color: #94a3b8;
  font-size: 8px;
}

.student-empty {
  min-height: 180px;
  padding: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #8995aa;
  font-size: 10px;
}

.student-empty-icon {
  font-size: 30px;
  margin-bottom: 10px;
}

.student-empty strong {
  color: #334155;
  font-size: 12px;
}

.student-empty span {
  margin-top: 5px;
}

@media (max-width: 1200px) {
  .student-quick-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 1100px) {
  .student-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .student-content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 800px) {
  .student-topbar {
    padding: 0 18px;
  }

  .student-user {
    display: none;
  }

  .student-layout {
    display: block;
  }

  .student-sidebar {
    width: auto;
    padding: 14px;
  }

  .student-nav-label,
  .student-sidebar-divider,
  .student-sidebar-info {
    display: none;
  }

  .student-nav-item {
    display: inline-flex;
    width: auto;
    margin-right: 5px;
  }

  .student-main {
    padding: 20px 18px;
  }

  .student-quick-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .student-stats {
    grid-template-columns: 1fr;
  }

  .student-quick-grid {
    grid-template-columns: 1fr;
  }

  .student-page-heading h1 {
    font-size: 23px;
  }

  .student-brand small {
    display: none;
  }

  .student-logout {
    padding: 8px 10px;
  }
}
`;

export default StudentDashboard;
