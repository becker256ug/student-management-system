import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function EnrollmentManagement({ auth, onLogout }) {
  const [students, setStudents] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [classes, setClasses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    student_id: "",
    semester_id: "",
    class_id: "",
    enrollment_date: new Date()
      .toISOString()
      .split("T")[0],
    status: "active",
  });

  // =========================================================
  // AUTH HEADER
  // =========================================================

  const getHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${auth.token}`,
  });

  // =========================================================
  // FETCH DATA
  // =========================================================

  useEffect(() => {
    if (!auth?.token) {
      return;
    }

    loadEnrollmentData();
  }, [auth]);

  const loadEnrollmentData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        studentsResponse,
        semestersResponse,
        classesResponse,
        enrollmentsResponse,
      ] = await Promise.all([
        fetch(`${API_BASE}/students`, {
          headers: getHeaders(),
        }),

        fetch(`${API_BASE}/semesters`, {
          headers: getHeaders(),
        }),

        fetch(`${API_BASE}/classes`, {
          headers: getHeaders(),
        }),

        fetch(`${API_BASE}/enrollments`, {
          headers: getHeaders(),
        }),
      ]);

      if (
        studentsResponse.status === 401 ||
        studentsResponse.status === 403 ||
        semestersResponse.status === 401 ||
        semestersResponse.status === 403 ||
        classesResponse.status === 401 ||
        classesResponse.status === 403 ||
        enrollmentsResponse.status === 401 ||
        enrollmentsResponse.status === 403
      ) {
        onLogout();
        return;
      }

      const studentsData =
        await studentsResponse.json().catch(() => []);

      const semestersData =
        await semestersResponse.json().catch(() => []);

      const classesData =
        await classesResponse.json().catch(() => []);

      const enrollmentsData =
        await enrollmentsResponse.json().catch(() => []);

      if (!studentsResponse.ok) {
        throw new Error(
          studentsData.message ||
            "Unable to load students."
        );
      }

      if (!semestersResponse.ok) {
        throw new Error(
          semestersData.message ||
            "Unable to load semesters."
        );
      }

      if (!classesResponse.ok) {
        throw new Error(
          classesData.message ||
            "Unable to load classes."
        );
      }

      if (!enrollmentsResponse.ok) {
        throw new Error(
          enrollmentsData.message ||
            "Unable to load enrollments."
        );
      }

      setStudents(
        Array.isArray(studentsData)
          ? studentsData
          : studentsData.students ||
              studentsData.data ||
              []
      );

      setSemesters(
        Array.isArray(semestersData)
          ? semestersData
          : semestersData.semesters ||
              semestersData.data ||
              []
      );

      setClasses(
        Array.isArray(classesData)
          ? classesData
          : classesData.classes ||
              classesData.data ||
              []
      );

      setEnrollments(
        Array.isArray(enrollmentsData)
          ? enrollmentsData
          : enrollmentsData.enrollments ||
              enrollmentsData.data ||
              []
      );
    } catch (err) {
      console.error(
        "Load enrollment data error:",
        err
      );

      setError(
        err.message ||
          "Unable to load enrollment data."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // FORM INPUT
  // =========================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setSuccess("");
    setError("");
  };

  // =========================================================
  // CREATE ENROLLMENT
  // =========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSuccess("");
    setError("");

    if (
      !form.student_id ||
      !form.semester_id ||
      !form.class_id ||
      !form.enrollment_date
    ) {
      setError(
        "Please select a student, semester, class and enrollment date."
      );

      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(
        `${API_BASE}/enrollments`,
        {
          method: "POST",
          headers: getHeaders(),

          body: JSON.stringify({
            student_id: Number(form.student_id),
            semester_id: Number(form.semester_id),
            class_id: Number(form.class_id),
            enrollment_date:
              form.enrollment_date,
            status: form.status,
          }),
        }
      );

      const data =
        await response.json().catch(() => ({}));

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        onLogout();
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to enroll student."
        );
      }

      setSuccess(
        data.message ||
          "Student enrolled successfully."
      );

      setForm({
        student_id: "",
        semester_id: "",
        class_id: "",
        enrollment_date: new Date()
          .toISOString()
          .split("T")[0],
        status: "active",
      });

      await loadEnrollmentData();
    } catch (err) {
      console.error(
        "Create enrollment error:",
        err
      );

      setError(
        err.message ||
          "Unable to enroll student."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================
  // DATE FORMATTER
  // =========================================================

  const formatDate = (date) => {
    if (!date) {
      return "—";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return parsedDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="content-card">
        <div className="loading-state">
          <div className="large-spinner" />

          <p>
            Loading enrollment data...
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            STUDENT MANAGEMENT
          </p>

          <h1>
            Student Enrollment
          </h1>

          <p className="heading-description">
            Enroll registered students into
            their class and semester.
          </p>
        </div>
      </div>

      {/* =====================================================
          ENROLLMENT FORM
      ===================================================== */}

      <div className="content-card registration-card">
        {success && (
          <div className="success-alert">
            ✓ {success}
          </div>
        )}

        {error && (
          <div className="error-alert">
            ! {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <div className="form-section-heading">
              <div className="section-number">
                01
              </div>

              <div>
                <h2>
                  Enrollment Information
                </h2>

                <p>
                  Select the student, semester,
                  class and enrollment details.
                </p>
              </div>
            </div>

            <div className="form-grid">

              {/* STUDENT */}

              <div className="form-field">
                <label htmlFor="student_id">
                  Student <span>*</span>
                </label>

                <select
                  id="student_id"
                  name="student_id"
                  value={form.student_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    Select student
                  </option>

                  {students.map((student) => (
                    <option
                      key={student.id}
                      value={student.id}
                    >
                      {student.student_number} —{" "}
                      {student.first_name}{" "}
                      {student.last_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* SEMESTER */}

              <div className="form-field">
                <label htmlFor="semester_id">
                  Semester <span>*</span>
                </label>

                <select
                  id="semester_id"
                  name="semester_id"
                  value={form.semester_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    Select semester
                  </option>

                  {semesters.map((semester) => (
                    <option
                      key={semester.id}
                      value={semester.id}
                    >
                      {semester.academic_year
                        ? `${semester.academic_year} — ${semester.name}`
                        : semester.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* CLASS */}

              <div className="form-field">
                <label htmlFor="class_id">
                  Class <span>*</span>
                </label>

                <select
                  id="class_id"
                  name="class_id"
                  value={form.class_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    Select class
                  </option>

                  {classes.map((schoolClass) => (
                    <option
                      key={schoolClass.id}
                      value={schoolClass.id}
                    >
                      {schoolClass.code
                        ? `${schoolClass.code} — ${schoolClass.name}`
                        : schoolClass.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* DATE */}

              <div className="form-field">
                <label htmlFor="enrollment_date">
                  Enrollment Date <span>*</span>
                </label>

                <input
                  id="enrollment_date"
                  type="date"
                  name="enrollment_date"
                  value={form.enrollment_date}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* STATUS */}

              <div className="form-field">
                <label htmlFor="status">
                  Status
                </label>

                <select
                  id="status"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                >
                  <option value="active">
                    Active
                  </option>

                  <option value="completed">
                    Completed
                  </option>

                  <option value="withdrawn">
                    Withdrawn
                  </option>
                </select>
              </div>

            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="primary-button register-submit"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="spinner" />
                  Enrolling...
                </>
              ) : (
                <>
                  ✓ Enroll Student
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* =====================================================
          ENROLLMENT LIST
      ===================================================== */}

      <div className="content-card students-card">
        <div className="students-toolbar">
          <div>
            <h2>
              Current Enrollments
            </h2>

            <p>
              {enrollments.length} enrollment
              {enrollments.length !== 1
                ? "s"
                : ""}
            </p>
          </div>

          <button
            className="secondary-button"
            onClick={loadEnrollmentData}
          >
            ↻ Refresh
          </button>
        </div>

        {enrollments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              ♙
            </div>

            <h3>
              No enrollments found
            </h3>

            <p>
              No students have been enrolled
              yet.
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="student-table">
              <thead>
                <tr>
                  <th>
                    STUDENT
                  </th>

                  <th>
                    ACADEMIC YEAR
                  </th>

                  <th>
                    SEMESTER
                  </th>

                  <th>
                    CLASS
                  </th>

                  <th>
                    ENROLLMENT DATE
                  </th>

                  <th>
                    STATUS
                  </th>
                </tr>
              </thead>

              <tbody>
                {enrollments.map(
                  (enrollment) => (
                    <tr
                      key={enrollment.id}
                    >
                      <td>
                        <div className="table-student">
                          <div className="table-avatar">
                            {(
                              enrollment.student_name ||
                              "ST"
                            )
                              .split(" ")
                              .map(
                                (part) =>
                                  part.charAt(0)
                              )
                              .slice(0, 2)
                              .join("")
                              .toUpperCase()}
                          </div>

                          <div>
                            <strong>
                              {
                                enrollment.student_name
                              }
                            </strong>

                            <span>
                              {
                                enrollment.student_number
                              }
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        {enrollment.academic_year ||
                          "—"}
                      </td>

                      <td>
                        {enrollment.semester ||
                          "—"}
                      </td>

                      <td>
                        {enrollment.class_code
                          ? `${enrollment.class_code} — ${enrollment.class_name}`
                          : enrollment.class_name ||
                            "—"}
                      </td>

                      <td>
                        {formatDate(
                          enrollment.enrollment_date
                        )}
                      </td>

                      <td>
                        <span
                          className={`gender-badge ${
                            enrollment.status ===
                            "active"
                              ? "female"
                              : enrollment.status ===
                                "completed"
                              ? "male"
                              : ""
                          }`}
                        >
                          {enrollment.status ||
                            "—"}
                        </span>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

export default EnrollmentManagement;
