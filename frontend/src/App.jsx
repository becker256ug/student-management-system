import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000/api/students";

const emptyForm = {
  student_number: "",
  first_name: "",
  last_name: "",
  gender: "",
  date_of_birth: "",
  email: "",
  phone: "",
  address: "",
  guardian_name: "",
  guardian_phone: "",
  class_name: "",
};

function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Unable to load students.");
      }

      const data = await response.json();
      setStudents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const totalStudents = students.length;

  const maleStudents = students.filter(
    (student) => student.gender?.toLowerCase() === "male"
  ).length;

  const femaleStudents = students.filter(
    (student) => student.gender?.toLowerCase() === "female"
  ).length;

  const recentStudents = students.slice(0, 5);

  const filteredStudents = useMemo(() => {
    const searchTerm = search.toLowerCase().trim();

    if (!searchTerm) {
      return students;
    }

    return students.filter((student) => {
      return (
        student.student_number?.toLowerCase().includes(searchTerm) ||
        student.first_name?.toLowerCase().includes(searchTerm) ||
        student.last_name?.toLowerCase().includes(searchTerm) ||
        student.email?.toLowerCase().includes(searchTerm) ||
        student.class_name?.toLowerCase().includes(searchTerm)
      );
    });
  }, [students, search]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSubmitting(true);
    setSuccess("");
    setFormError("");

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Unable to register student."
        );
      }

      setSuccess("Student registered successfully!");
      setForm(emptyForm);

      await fetchStudents();

      setTimeout(() => {
        setActivePage("students");
        setSuccess("");
      }, 1200);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const navigate = (page) => {
    setActivePage(page);
    setSidebarOpen(false);
    setSuccess("");
    setFormError("");
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ""}${
      lastName?.charAt(0) || ""
    }`.toUpperCase();
  };

  return (
    <div className="app">
      {sidebarOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-logo">SM</div>

          <div>
            <h2>Student<span>Hub</span></h2>
            <p>Management System</p>
          </div>
        </div>

        <nav className="navigation">
          <p className="nav-title">MAIN MENU</p>

          <button
            className={`nav-item ${
              activePage === "dashboard" ? "active" : ""
            }`}
            onClick={() => navigate("dashboard")}
          >
            <span className="nav-icon">⌂</span>
            Dashboard
          </button>

          <button
            className={`nav-item ${
              activePage === "students" ? "active" : ""
            }`}
            onClick={() => navigate("students")}
          >
            <span className="nav-icon">♙</span>
            Students
            <span className="nav-badge">{totalStudents}</span>
          </button>

          <p className="nav-title menu-spacing">MANAGEMENT</p>

          <button
            className={`nav-item ${
              activePage === "register" ? "active" : ""
            }`}
            onClick={() => navigate("register")}
          >
            <span className="nav-icon">＋</span>
            Register Student
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="admin-card">
            <div className="admin-avatar">A</div>

            <div>
              <strong>Administrator</strong>
              <span>System Admin</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button
            className="mobile-menu"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>

          <div className="breadcrumb">
            <span>Student Management</span>
            <strong>/</strong>
            <b>
              {activePage === "dashboard"
                ? "Dashboard"
                : activePage === "students"
                ? "Students"
                : "Register Student"}
            </b>
          </div>

          <div className="topbar-right">
            <button className="notification-button">
              ♧
              <span />
            </button>

            <div className="top-admin">
              <div className="top-admin-avatar">A</div>

              <div>
                <strong>Admin</strong>
                <small>Administrator</small>
              </div>
            </div>
          </div>
        </header>

        <div className="page-content">
          {activePage === "dashboard" && (
            <Dashboard
              students={students}
              totalStudents={totalStudents}
              maleStudents={maleStudents}
              femaleStudents={femaleStudents}
              recentStudents={recentStudents}
              loading={loading}
              error={error}
              formatDate={formatDate}
              getInitials={getInitials}
              navigate={navigate}
              fetchStudents={fetchStudents}
            />
          )}

          {activePage === "students" && (
            <StudentsPage
              students={filteredStudents}
              totalStudents={totalStudents}
              loading={loading}
              error={error}
              search={search}
              setSearch={setSearch}
              formatDate={formatDate}
              getInitials={getInitials}
              fetchStudents={fetchStudents}
              navigate={navigate}
            />
          )}

          {activePage === "register" && (
            <RegisterPage
              form={form}
              handleInputChange={handleInputChange}
              handleSubmit={handleSubmit}
              submitting={submitting}
              success={success}
              formError={formError}
            />
          )}
        </div>
      </main>
    </div>
  );
}

function Dashboard({
  students,
  totalStudents,
  maleStudents,
  femaleStudents,
  recentStudents,
  loading,
  error,
  formatDate,
  getInitials,
  navigate,
  fetchStudents,
}) {
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">OVERVIEW</p>
          <h1>Good afternoon 👋</h1>
          <p className="heading-description">
            Here's what's happening with your students today.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => navigate("register")}
        >
          <span>＋</span>
          Register Student
        </button>
      </div>

      <section className="stats-grid">
        <StatCard
          title="Total Students"
          value={totalStudents}
          icon="♙"
          description="All registered students"
        />

        <StatCard
          title="Male Students"
          value={maleStudents}
          icon="♂"
          description="Registered male students"
        />

        <StatCard
          title="Female Students"
          value={femaleStudents}
          icon="♀"
          description="Registered female students"
        />

        <StatCard
          title="Recent Registrations"
          value={Math.min(students.length, 5)}
          icon="↗"
          description="Latest student records"
        />
      </section>

      <section className="dashboard-grid">
        <div className="content-card recent-card">
          <div className="card-header">
            <div>
              <h2>Recent Students</h2>
              <p>Latest registered students</p>
            </div>

            <button
              className="text-button"
              onClick={() => navigate("students")}
            >
              View all →
            </button>
          </div>

          {loading ? (
            <Loading />
          ) : error ? (
            <ErrorBox message={error} />
          ) : recentStudents.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="recent-list">
              {recentStudents.map((student) => (
                <div className="recent-student" key={student.id}>
                  <div className="student-avatar">
                    {getInitials(student.first_name, student.last_name)}
                  </div>

                  <div className="student-main">
                    <strong>
                      {student.first_name} {student.last_name}
                    </strong>

                    <span>{student.student_number}</span>
                  </div>

                  <div className="student-program">
                    <span>{student.class_name || "Not specified"}</span>
                    <small>{formatDate(student.created_at)}</small>
                  </div>

                  <span
                    className={`gender-badge ${
                      student.gender?.toLowerCase() === "female"
                        ? "female"
                        : "male"
                    }`}
                  >
                    {student.gender}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="content-card quick-card">
          <div className="card-header">
            <div>
              <h2>Quick Actions</h2>
              <p>Common tasks</p>
            </div>
          </div>

          <div className="quick-actions">
            <button onClick={() => navigate("register")}>
              <div className="quick-icon blue">＋</div>
              <div>
                <strong>Register Student</strong>
                <span>Add a new student record</span>
              </div>
              <b>→</b>
            </button>

            <button onClick={() => navigate("students")}>
              <div className="quick-icon green">♙</div>
              <div>
                <strong>View Students</strong>
                <span>Browse all student records</span>
              </div>
              <b>→</b>
            </button>

            <button onClick={fetchStudents}>
              <div className="quick-icon purple">↻</div>
              <div>
                <strong>Refresh Data</strong>
                <span>Reload database records</span>
              </div>
              <b>→</b>
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

function StatCard({ title, value, icon, description }) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <div className="stat-icon">{icon}</div>
        <span className="stat-status">Live</span>
      </div>

      <div className="stat-value">{value}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function StudentsPage({
  students,
  totalStudents,
  loading,
  error,
  search,
  setSearch,
  formatDate,
  getInitials,
  fetchStudents,
  navigate,
}) {
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">STUDENT MANAGEMENT</p>
          <h1>Students</h1>
          <p className="heading-description">
            Manage and view all registered students.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => navigate("register")}
        >
          <span>＋</span>
          Register Student
        </button>
      </div>

      <div className="content-card students-card">
        <div className="students-toolbar">
          <div>
            <h2>All Students</h2>
            <p>{totalStudents} student records</p>
          </div>

          <div className="toolbar-actions">
            <div className="search-box">
              <span>⌕</span>

              <input
                type="text"
                placeholder="Search students..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />

              {search && (
                <button onClick={() => setSearch("")}>×</button>
              )}
            </div>

            <button
              className="secondary-button"
              onClick={fetchStudents}
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorBox message={error} />
        ) : students.length === 0 ? (
          <EmptyState search={search} />
        ) : (
          <div className="table-wrapper">
            <table className="student-table">
              <thead>
                <tr>
                  <th>STUDENT</th>
                  <th>GENDER</th>
                  <th>DATE OF BIRTH</th>
                  <th>CONTACT</th>
                  <th>PROGRAM</th>
                  <th>REGISTERED</th>
                </tr>
              </thead>

              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td>
                      <div className="table-student">
                        <div className="table-avatar">
                          {getInitials(
                            student.first_name,
                            student.last_name
                          )}
                        </div>

                        <div>
                          <strong>
                            {student.first_name} {student.last_name}
                          </strong>

                          <span>{student.student_number}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`gender-badge ${
                          student.gender?.toLowerCase() === "female"
                            ? "female"
                            : "male"
                        }`}
                      >
                        {student.gender}
                      </span>
                    </td>

                    <td>{formatDate(student.date_of_birth)}</td>

                    <td>
                      <div className="contact-cell">
                        <span>{student.email}</span>
                        <small>{student.phone}</small>
                      </div>
                    </td>

                    <td>
                      <span className="program-badge">
                        {student.class_name}
                      </span>
                    </td>

                    <td>{formatDate(student.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && students.length > 0 && (
          <div className="table-footer">
            <span>
              Showing <strong>{students.length}</strong> student
              {students.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>
    </>
  );
}

function RegisterPage({
  form,
  handleInputChange,
  handleSubmit,
  submitting,
  success,
  formError,
}) {
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">STUDENT MANAGEMENT</p>
          <h1>Register Student</h1>
          <p className="heading-description">
            Create a new student record in the system.
          </p>
        </div>
      </div>

      <div className="content-card registration-card">
        {success && <div className="success-alert">✓ {success}</div>}

        {formError && <div className="error-alert">! {formError}</div>}

        <form onSubmit={handleSubmit}>
          <FormSection
            number="01"
            title="Student Information"
            description="Basic information about the student."
          >
            <div className="form-grid">
              <FormField
                label="Student Number"
                name="student_number"
                value={form.student_number}
                onChange={handleInputChange}
                required
                placeholder="e.g. STU004"
              />

              <FormField
                label="First Name"
                name="first_name"
                value={form.first_name}
                onChange={handleInputChange}
                required
                placeholder="Enter first name"
              />

              <FormField
                label="Last Name"
                name="last_name"
                value={form.last_name}
                onChange={handleInputChange}
                required
                placeholder="Enter last name"
              />

              <div className="form-field">
                <label>
                  Gender <span>*</span>
                </label>

                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <FormField
                label="Date of Birth"
                name="date_of_birth"
                type="date"
                value={form.date_of_birth}
                onChange={handleInputChange}
                required
              />

              <FormField
                label="Email Address"
                name="email"
                type="email"
                value={form.email}
                onChange={handleInputChange}
                required
                placeholder="student@example.com"
              />

              <FormField
                label="Phone Number"
                name="phone"
                value={form.phone}
                onChange={handleInputChange}
                required
                placeholder="0700000000"
              />

              <FormField
                label="Address"
                name="address"
                value={form.address}
                onChange={handleInputChange}
                required
                placeholder="Kampala, Uganda"
              />
            </div>
          </FormSection>

          <FormSection
            number="02"
            title="Guardian Information"
            description="Parent or guardian contact information."
          >
            <div className="form-grid">
              <FormField
                label="Guardian Name"
                name="guardian_name"
                value={form.guardian_name}
                onChange={handleInputChange}
                required
                placeholder="Enter guardian name"
              />

              <FormField
                label="Guardian Phone"
                name="guardian_phone"
                value={form.guardian_phone}
                onChange={handleInputChange}
                required
                placeholder="0700000000"
              />
            </div>
          </FormSection>

          <FormSection
            number="03"
            title="Academic Information"
            description="School and academic information."
          >
            <div className="form-grid">
              <FormField
                label="Class / Program"
                name="class_name"
                value={form.class_name}
                onChange={handleInputChange}
                required
                placeholder="e.g. Senior One / Bachelors"
              />
            </div>
          </FormSection>

          <div className="form-actions">
            <button
              type="submit"
              className="primary-button register-submit"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="spinner" />
                  Registering...
                </>
              ) : (
                <>
                  ✓ Register Student
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

function FormSection({ number, title, description, children }) {
  return (
    <section className="form-section">
      <div className="form-section-heading">
        <div className="section-number">{number}</div>

        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>

      {children}
    </section>
  );
}

function FormField({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder = "",
}) {
  return (
    <div className="form-field">
      <label htmlFor={name}>
        {label} {required && <span>*</span>}
      </label>

      <input
        id={name}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}

function Loading() {
  return (
    <div className="loading-state">
      <div className="large-spinner" />
      <p>Loading student records...</p>
    </div>
  );
}

function ErrorBox({ message }) {
  return (
    <div className="error-state">
      <div className="error-icon">!</div>

      <div>
        <strong>Something went wrong</strong>
        <p>{message}</p>
      </div>
    </div>
  );
}

function EmptyState({ search }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">♙</div>

      <h3>No students found</h3>

      <p>
        {search
          ? "Try changing your search term."
          : "There are no registered students yet."}
      </p>
    </div>
  );
}

export default App;