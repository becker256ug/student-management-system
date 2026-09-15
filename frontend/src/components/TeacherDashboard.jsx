import { useEffect, useState } from "react";
import TeacherAttendance from "./TeacherAttendance";
import TeacherResults from "./TeacherResults";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function TeacherDashboard({ auth, onLogout }) {
  const [assignments, setAssignments] = useState([]);
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState("dashboard");

  useEffect(() => {
    const loadTeacherData = async () => {
      try {
        setLoading(true);
        setError("");

        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        };

        const [
          assignmentResponse,
          timetableResponse,
        ] = await Promise.all([
          fetch(`${API_BASE}/teacher-assignments`, {
            headers,
          }),
          fetch(`${API_BASE}/timetables`, {
            headers,
          }),
        ]);

        if (
          assignmentResponse.status === 401 ||
          assignmentResponse.status === 403 ||
          timetableResponse.status === 401 ||
          timetableResponse.status === 403
        ) {
          onLogout();
          return;
        }

        const assignmentData =
          await assignmentResponse.json().catch(() => []);

        const timetableData =
          await timetableResponse.json().catch(() => []);

        if (!assignmentResponse.ok) {
          throw new Error(
            assignmentData.message ||
              "Unable to load teaching assignments."
          );
        }

        if (!timetableResponse.ok) {
          throw new Error(
            timetableData.message ||
              "Unable to load timetable."
          );
        }

        setAssignments(
          Array.isArray(assignmentData)
            ? assignmentData
            : assignmentData.assignments ||
                assignmentData.data ||
                []
        );

        setTimetables(
          Array.isArray(timetableData)
            ? timetableData
            : timetableData.timetables ||
                timetableData.data ||
                []
        );
      } catch (err) {
        console.error(
          "Teacher dashboard error:",
          err
        );

        setError(
          err.message ||
            "Unable to load teacher information."
        );
      } finally {
        setLoading(false);
      }
    };

    if (auth?.token) {
      loadTeacherData();
    }
  }, [auth?.token, onLogout]);

  const teacherName =
    auth?.user?.first_name
      ? `${auth.user.first_name} ${
          auth.user.last_name || ""
        }`.trim()
      : auth?.user?.name || "Teacher";

  const renderDashboard = () => (
    <>
      <div className="teacher-page-heading">
        <div>
          <p className="teacher-eyebrow">
            TEACHER PORTAL
          </p>

          <h1>Welcome, {teacherName}</h1>

          <p>
            Manage your teaching assignments and view
            your teaching timetable.
          </p>
        </div>

        <button
          type="button"
          className="teacher-primary-button"
          onClick={() =>
            setActiveSection("attendance")
          }
        >
          ✓ Take Attendance
        </button>
      </div>

      {error && (
        <div className="teacher-alert teacher-error">
          ! {error}
        </div>
      )}

      <div className="teacher-stats">
        <div className="teacher-stat-card">
          <div className="teacher-stat-icon">
            📚
          </div>

          <div>
            <small>My Assignments</small>
            <strong>
              {assignments.length}
            </strong>
          </div>
        </div>

        <div className="teacher-stat-card">
          <div className="teacher-stat-icon">
            🗓
          </div>

          <div>
            <small>Timetable Entries</small>
            <strong>
              {timetables.length}
            </strong>
          </div>
        </div>

        <div className="teacher-stat-card">
          <div className="teacher-stat-icon">
            ✓
          </div>

          <div>
            <small>Attendance</small>
            <strong>Ready</strong>
          </div>
        </div>
      </div>

      <section className="teacher-section">
        <div className="section-header">
          <div>
            <h2>My Teaching Assignments</h2>

            <p>
              Classes and subjects assigned to you.
            </p>
          </div>

          <button
            type="button"
            className="teacher-text-button"
            onClick={() =>
              setActiveSection("attendance")
            }
          >
            Take attendance →
          </button>
        </div>

        {loading ? (
          <div className="teacher-empty">
            Loading assignments...
          </div>
        ) : assignments.length === 0 ? (
          <div className="teacher-empty">
            No teaching assignments have been assigned
            to you yet.
          </div>
        ) : (
          <div className="teacher-table-wrapper">
            <table className="teacher-table">
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Subject</th>
                  <th>Semester</th>
                </tr>
              </thead>

              <tbody>
                {assignments.map(
                  (assignment, index) => (
                    <tr
                      key={
                        assignment.id || index
                      }
                    >
                      <td>
                        {assignment.class_name ||
                          assignment.class_code ||
                          "—"}
                      </td>

                      <td>
                        {assignment.subject_name ||
                          assignment.subject_code ||
                          "—"}
                      </td>

                      <td>
                        {assignment.semester ||
                          assignment.semester_name ||
                          "—"}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="teacher-section">
        <div className="section-header">
          <div>
            <h2>My Timetable</h2>

            <p>
              Your scheduled teaching periods.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="teacher-empty">
            Loading timetable...
          </div>
        ) : timetables.length === 0 ? (
          <div className="teacher-empty">
            No timetable entries have been assigned
            to you yet.
          </div>
        ) : (
          <div className="teacher-table-wrapper">
            <table className="teacher-table">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Time</th>
                  <th>Class</th>
                  <th>Subject</th>
                  <th>Room</th>
                </tr>
              </thead>

              <tbody>
                {timetables.map(
                  (item, index) => (
                    <tr
                      key={
                        item.id || index
                      }
                    >
                      <td>
                        {item.day_of_week ||
                          "—"}
                      </td>

                      <td>
                        {item.start_time ||
                          "—"}{" "}
                        -{" "}
                        {item.end_time ||
                          "—"}
                      </td>

                      <td>
                        {item.class_name ||
                          item.class_code ||
                          "—"}
                      </td>

                      <td>
                        {item.subject_name ||
                          item.subject_code ||
                          "—"}
                      </td>

                      <td>
                        {item.room || "—"}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );

  return (
    <>
      <style>{teacherStyles}</style>

      <div className="teacher-app">
        <header className="teacher-topbar">
          <div className="teacher-brand">
            <div className="teacher-brand-logo">
              SM
            </div>

            <div>
              <strong>
                Student<span>Hub</span>
              </strong>

              <small>TEACHER PORTAL</small>
            </div>
          </div>

          <div className="teacher-topbar-right">
            <div className="teacher-user">
              <div className="teacher-user-avatar">
                {teacherName
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <strong>{teacherName}</strong>
                <small>Teacher</small>
              </div>
            </div>

            <button
              type="button"
              className="teacher-logout"
              onClick={onLogout}
            >
              ⇥ Logout
            </button>
          </div>
        </header>

        <div className="teacher-layout">
          <aside className="teacher-sidebar">
            <p className="teacher-nav-label">
              TEACHER MENU
            </p>

            <button
              type="button"
              className={`teacher-nav-item ${
                activeSection === "dashboard"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setActiveSection("dashboard")
              }
            >
              <span>⌂</span>
              Dashboard
            </button>

            <button
              type="button"
              className={`teacher-nav-item ${
                activeSection === "attendance"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setActiveSection("attendance")
              }
            >
              <span>✓</span>
              Attendance
            </button>

            <button
              type="button"
              className={`teacher-nav-item ${
                activeSection === "results"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setActiveSection("results")
              }
            >
              <span>▣</span>
              Results
            </button>

            <div className="teacher-sidebar-divider" />

            <div className="teacher-sidebar-info">
              <small>MY ASSIGNMENTS</small>
              <strong>
                {assignments.length}
              </strong>
              <span>
                Assigned teaching subjects
              </span>
            </div>
          </aside>

          <main className="teacher-main">
            {activeSection === "attendance" ? (
              <TeacherAttendance
                auth={auth}
                onLogout={onLogout}
              />
            ) : activeSection === "results" ? (
              <TeacherResults
                auth={auth}
                onLogout={onLogout}
              />
            ) : (
              renderDashboard()
            )}
          </main>
        </div>
      </div>
    </>
  );
}

const teacherStyles = `
.teacher-app {
  min-height: 100vh;
  background: #f5f7fb;
  color: #14213d;
  font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.teacher-topbar {
  min-height: 76px;
  background: #ffffff;
  border-bottom: 1px solid #e8edf5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  gap: 24px;
}

.teacher-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.teacher-brand-logo {
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

.teacher-brand strong {
  display: block;
  font-size: 18px;
  letter-spacing: -0.3px;
}

.teacher-brand strong span {
  color: #2563eb;
}

.teacher-brand small {
  display: block;
  color: #8a96aa;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 1px;
  margin-top: 2px;
}

.teacher-topbar-right {
  display: flex;
  align-items: center;
  gap: 18px;
}

.teacher-user {
  display: flex;
  align-items: center;
  gap: 10px;
}

.teacher-user-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #eaf2ff;
  color: #2563eb;
  display: grid;
  place-items: center;
  font-weight: 800;
}

.teacher-user strong,
.teacher-user small {
  display: block;
}

.teacher-user strong {
  font-size: 13px;
}

.teacher-user small {
  color: #8995aa;
  margin-top: 2px;
  font-size: 11px;
}

.teacher-logout {
  border: 1px solid #e2e7ef;
  background: #ffffff;
  color: #334155;
  border-radius: 9px;
  padding: 9px 14px;
  cursor: pointer;
  font-weight: 700;
}

.teacher-logout:hover {
  background: #f8fafc;
}

.teacher-layout {
  display: flex;
  min-height: calc(100vh - 76px);
}

.teacher-sidebar {
  width: 235px;
  flex: 0 0 235px;
  background: #111827;
  padding: 28px 16px;
  color: #aab5c7;
}

.teacher-nav-label {
  margin: 0 14px 12px;
  color: #718096;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.4px;
}

.teacher-nav-item {
  width: 100%;
  border: 0;
  background: transparent;
  color: #aeb8ca;
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
  padding: 12px 14px;
  margin-bottom: 6px;
  border-radius: 9px;
  cursor: pointer;
  font-weight: 650;
}

.teacher-nav-item span {
  width: 20px;
  text-align: center;
  font-size: 17px;
}

.teacher-nav-item:hover {
  background: #1b2537;
  color: #ffffff;
}

.teacher-nav-item.active {
  background: #2563eb;
  color: #ffffff;
  box-shadow: 0 8px 18px rgba(37, 99, 235, 0.2);
}

.teacher-sidebar-divider {
  height: 1px;
  background: #263144;
  margin: 25px 8px;
}

.teacher-sidebar-info {
  margin: 0 8px;
  padding: 18px;
  background: #192337;
  border: 1px solid #263144;
  border-radius: 12px;
}

.teacher-sidebar-info small,
.teacher-sidebar-info span {
  display: block;
}

.teacher-sidebar-info small {
  color: #718096;
  font-size: 9px;
  letter-spacing: 1px;
  font-weight: 800;
}

.teacher-sidebar-info strong {
  display: block;
  color: #ffffff;
  font-size: 27px;
  margin: 5px 0;
}

.teacher-sidebar-info span {
  font-size: 11px;
  color: #8b98ad;
  line-height: 1.4;
}

.teacher-main {
  flex: 1;
  min-width: 0;
  padding: 34px;
  overflow: auto;
}

.teacher-page-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 20px;
  margin-bottom: 26px;
}

.teacher-page-heading h1,
.teacher-attendance-page h1 {
  margin: 4px 0 8px;
  font-size: 31px;
  letter-spacing: -1px;
  color: #111827;
}

.teacher-page-heading p:not(.teacher-eyebrow),
.teacher-attendance-page .teacher-page-heading p:not(.teacher-eyebrow) {
  margin: 0;
  color: #7b8799;
  font-size: 14px;
}

.teacher-eyebrow {
  margin: 0;
  color: #2563eb;
  font-size: 10px;
  font-weight: 850;
  letter-spacing: 1.5px;
}

.teacher-primary-button {
  border: 0;
  background: #2563eb;
  color: #ffffff;
  padding: 12px 18px;
  border-radius: 9px;
  font-weight: 750;
  cursor: pointer;
  box-shadow: 0 9px 20px rgba(37, 99, 235, 0.18);
}

.teacher-primary-button:hover {
  background: #1d4ed8;
}

.teacher-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  margin-bottom: 22px;
}

.teacher-stat-card {
  background: #ffffff;
  border: 1px solid #e8edf5;
  border-radius: 14px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 5px 18px rgba(15, 23, 42, 0.03);
}

.teacher-stat-icon {
  width: 45px;
  height: 45px;
  border-radius: 11px;
  background: #eef5ff;
  display: grid;
  place-items: center;
  font-size: 20px;
}

.teacher-stat-card small,
.teacher-stat-card strong {
  display: block;
}

.teacher-stat-card small {
  color: #8995aa;
  font-size: 11px;
  margin-bottom: 4px;
}

.teacher-stat-card strong {
  color: #111827;
  font-size: 24px;
}

.teacher-section,
.teacher-attendance-card {
  background: #ffffff;
  border: 1px solid #e8edf5;
  border-radius: 14px;
  margin-bottom: 22px;
  box-shadow: 0 5px 18px rgba(15, 23, 42, 0.03);
  overflow: hidden;
}

.teacher-section {
  padding: 0;
}

.section-header,
.teacher-attendance-header {
  padding: 20px 22px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  border-bottom: 1px solid #edf1f6;
}

.section-header h2,
.teacher-attendance-header h2 {
  margin: 0 0 5px;
  font-size: 17px;
  color: #111827;
}

.section-header p,
.teacher-attendance-header p {
  margin: 0;
  color: #8995aa;
  font-size: 12px;
}

.teacher-text-button {
  border: 0;
  background: transparent;
  color: #2563eb;
  cursor: pointer;
  font-weight: 700;
}

.teacher-table-wrapper,
.teacher-attendance-table-wrap {
  width: 100%;
  overflow-x: auto;
}

.teacher-table,
.teacher-attendance-table {
  width: 100%;
  border-collapse: collapse;
}

.teacher-table th,
.teacher-table td,
.teacher-attendance-table th,
.teacher-attendance-table td {
  padding: 14px 18px;
  border-bottom: 1px solid #eef1f5;
  text-align: left;
  font-size: 13px;
}

.teacher-table th,
.teacher-attendance-table th {
  background: #fafbfc;
  color: #718096;
  font-size: 10px;
  letter-spacing: .5px;
  text-transform: uppercase;
}

.teacher-table td {
  color: #3d4859;
}

.teacher-table tr:last-child td,
.teacher-attendance-table tr:last-child td {
  border-bottom: 0;
}

.teacher-empty {
  padding: 55px 20px;
  text-align: center;
  color: #7b8799;
  font-size: 14px;
}

.teacher-alert {
  padding: 12px 15px;
  border-radius: 9px;
  margin-bottom: 18px;
  font-size: 13px;
  font-weight: 650;
}

.teacher-error {
  background: #fff1f2;
  border: 1px solid #fecdd3;
  color: #be123c;
}

.teacher-success {
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  color: #047857;
}

.teacher-attendance-page {
  max-width: 1250px;
}

.teacher-attendance-card {
  padding: 0;
}

.teacher-attendance-controls {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 18px;
  padding: 22px;
}

.teacher-control label {
  display: block;
  margin-bottom: 7px;
  color: #334155;
  font-size: 12px;
  font-weight: 750;
}

.teacher-control select,
.teacher-control input,
.teacher-attendance-table select,
.teacher-attendance-table input {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #dfe5ee;
  background: #ffffff;
  color: #1f2937;
  border-radius: 8px;
  padding: 10px 11px;
  outline: none;
}

.teacher-control select:focus,
.teacher-control input:focus,
.teacher-attendance-table select:focus,
.teacher-attendance-table input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.09);
}

.teacher-selected-summary {
  margin: 0 22px 22px;
  padding: 13px 15px;
  border-radius: 9px;
  background: #f5f8ff;
  color: #334155;
  display: flex;
  align-items: center;
  gap: 9px;
  flex-wrap: wrap;
  font-size: 13px;
}

.teacher-selected-summary strong {
  color: #1d4ed8;
}

.teacher-mark-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.teacher-mark-actions button {
  border: 1px solid #dfe5ee;
  background: #ffffff;
  color: #475569;
  padding: 8px 11px;
  border-radius: 7px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 700;
}

.teacher-mark-actions button:hover {
  background: #f8fafc;
}

.teacher-attendance-table td {
  vertical-align: middle;
}

.teacher-attendance-table td:nth-child(1) {
  color: #94a3b8;
  width: 35px;
}

.teacher-attendance-table td:nth-child(2) strong {
  color: #1f2937;
}

.attendance-state {
  display: inline-block;
  padding: 5px 8px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #64748b;
  font-size: 10px;
  font-weight: 750;
  white-space: nowrap;
}

.attendance-state.saved {
  background: #ecfdf5;
  color: #047857;
}

.teacher-attendance-footer {
  padding: 18px 22px;
  border-top: 1px solid #edf1f6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  color: #7b8799;
  font-size: 12px;
}

.teacher-attendance-footer .teacher-primary-button {
  min-width: 170px;
}

@media (max-width: 900px) {
  .teacher-sidebar {
    width: 190px;
    flex-basis: 190px;
  }

  .teacher-main {
    padding: 24px;
  }

  .teacher-stats {
    grid-template-columns: 1fr;
  }

  .teacher-attendance-controls {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 680px) {
  .teacher-topbar {
    padding: 0 16px;
  }

  .teacher-user {
    display: none;
  }

  .teacher-layout {
    display: block;
  }

  .teacher-sidebar {
    width: auto;
    padding: 14px;
  }

  .teacher-nav-label,
  .teacher-sidebar-divider,
  .teacher-sidebar-info {
    display: none;
  }

  .teacher-nav-item {
    display: inline-flex;
    width: auto;
    margin-right: 5px;
  }

  .teacher-main {
    padding: 18px;
  }

  .teacher-page-heading {
    display: block;
  }

  .teacher-page-heading .teacher-primary-button {
    margin-top: 15px;
  }

  .teacher-attendance-header,
  .teacher-attendance-footer,
  .section-header {
    align-items: flex-start;
    flex-direction: column;
  }
}
`;

export default TeacherDashboard;

