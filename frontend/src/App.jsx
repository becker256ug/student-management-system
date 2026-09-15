import { useEffect, useMemo, useState } from "react";
import "./App.css";

import Login from "./components/Login";
import TeacherDashboard from "./components/TeacherDashboard";
import TeacherManagement from "./components/TeacherManagement";
import TeacherAssignmentManagement from "./components/TeacherAssignmentManagement";
import EnrollmentManagement from "./components/EnrollmentManagement";
import StudentDashboard from "./components/StudentDashboard";
import ClassManagement from "./components/ClassManagement";
import SubjectManagement from "./components/SubjectManagement";
import AcademicYearManagement from "./components/AcademicYearManagement";
import ActivityLogManagement from "./components/ActivityLogManagement";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const API_URL = `${API_BASE}/students`;

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
  password: "",
};

function App() {
  const [auth, setAuth] = useState(() => {
    try {
      const savedAuth = localStorage.getItem("studentHubAuth");

      if (!savedAuth) {
        return null;
      }

      return JSON.parse(savedAuth);
    } catch (error) {
      console.error("Failed to load saved authentication:", error);
      localStorage.removeItem("studentHubAuth");
      return null;
    }
  });

  const [students, setStudents] = useState([]);
  const [teachersCount, setTeachersCount] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [activePage, setActivePage] = useState("dashboard");

  const [search, setSearch] = useState("");

  const [form, setForm] = useState(emptyForm);

  const [success, setSuccess] = useState("");
  const [formError, setFormError] = useState("");

  const [showStudentForm, setShowStudentForm] = useState(false);

  const [editingStudentId, setEditingStudentId] = useState(null);

  /*
  |--------------------------------------------------------------------------
  | SAVE AUTHENTICATION
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (auth) {
      localStorage.setItem(
        "studentHubAuth",
        JSON.stringify(auth)
      );
    } else {
      localStorage.removeItem("studentHubAuth");
    }
  }, [auth]);

  /*
  |--------------------------------------------------------------------------
  | LOAD ADMIN DATA
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!auth?.token) {
      setStudents([]);
      setTeachersCount(0);
      setLoading(false);
      return;
    }

    /*
     * Teachers and students use their own portals.
     */
    if (
      auth.user?.role === "teacher" ||
      auth.user?.role === "student"
    ) {
      setStudents([]);
      setTeachersCount(0);
      setLoading(false);
      return;
    }

    fetchStudents();
    fetchTeachersCount();
  }, [auth]);

  /*
  |--------------------------------------------------------------------------
  | FETCH STUDENTS
  |--------------------------------------------------------------------------
  */

  const fetchStudents = async () => {
    if (!auth?.token) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch students."
        );
      }

      setStudents(
        Array.isArray(data) ? data : []
      );
    } catch (err) {
      console.error(
        "Failed to fetch students:",
        err
      );

      setError(
        err.message || "Failed to load students."
      );
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | FETCH TEACHER COUNT
  |--------------------------------------------------------------------------
  */

  const fetchTeachersCount = async () => {
    if (
      !auth?.token ||
      auth.user?.role === "teacher" ||
      auth.user?.role === "student"
    ) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/teachers`,
        {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        }
      );

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setTeachersCount(data.length);
      } else if (
        Array.isArray(data.teachers)
      ) {
        setTeachersCount(
          data.teachers.length
        );
      } else {
        setTeachersCount(0);
      }
    } catch (err) {
      console.error(
        "Failed to fetch teachers:",
        err
      );

      setTeachersCount(0);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | LOGOUT
  |--------------------------------------------------------------------------
  */

  const handleLogout = () => {
    localStorage.removeItem(
      "studentHubAuth"
    );

    setAuth(null);
    setStudents([]);
    setTeachersCount(0);
    setActivePage("dashboard");
    setSearch("");
    setForm(emptyForm);
    setSuccess("");
    setFormError("");
    setError("");
    setShowStudentForm(false);
    setEditingStudentId(null);
  };

  /*
  |--------------------------------------------------------------------------
  | FORM CHANGE
  |--------------------------------------------------------------------------
  */

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | OPEN REGISTER FORM
  |--------------------------------------------------------------------------
  */

  const openRegisterForm = () => {
    setForm(emptyForm);
    setEditingStudentId(null);
    setFormError("");
    setSuccess("");
    setError("");

    setActivePage("register");
    setShowStudentForm(true);
  };

  /*
  |--------------------------------------------------------------------------
  | OPEN EDIT FORM
  |--------------------------------------------------------------------------
  */

  const handleEditStudent = async (student) => {
    setFormError("");
    setSuccess("");
    setError("");

    let dateOfBirth =
      student.date_of_birth || "";

    if (dateOfBirth) {
      dateOfBirth = String(
        dateOfBirth
      ).split("T")[0];
    }

    setForm({
      student_number:
        student.student_number || "",

      first_name:
        student.first_name || "",

      last_name:
        student.last_name || "",

      gender:
        student.gender || "",

      date_of_birth:
        dateOfBirth,

      email:
        student.email || "",

      phone:
        student.phone || "",

      address:
        student.address || "",

      guardian_name:
        student.guardian_name || "",

      guardian_phone:
        student.guardian_phone || "",

      password: "",
    });

    setEditingStudentId(student.id);
    setActivePage("edit");
    setShowStudentForm(true);
  };

  /*
  |--------------------------------------------------------------------------
  | REGISTER STUDENT
  |--------------------------------------------------------------------------
  */

  const handleRegisterStudent = async (
    event
  ) => {
    event.preventDefault();

    setSuccess("");
    setFormError("");
    setError("");

    if (!auth?.token) {
      setFormError(
        "You are not authenticated."
      );
      return;
    }

    try {
      const response = await fetch(
        API_URL,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${auth.token}`,
          },

          body: JSON.stringify(form),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to register student."
        );
      }

      setSuccess(
        data.message ||
          "Student registered successfully."
      );

      setForm(emptyForm);
      setShowStudentForm(false);

      await fetchStudents();

      setActivePage("students");
    } catch (err) {
      console.error(
        "Failed to register student:",
        err
      );

      setFormError(
        err.message ||
          "Failed to register student."
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | UPDATE STUDENT
  |--------------------------------------------------------------------------
  */

  const handleUpdateStudent = async (
    event
  ) => {
    event.preventDefault();

    setSuccess("");
    setFormError("");
    setError("");

    if (!auth?.token) {
      setFormError(
        "You are not authenticated."
      );
      return;
    }

    if (!editingStudentId) {
      setFormError(
        "No student selected for editing."
      );
      return;
    }

    try {
      const fullName =
        `${form.first_name} ${form.last_name}`.trim();

      const updateData = {
        name: fullName,

        email:
          form.email.trim(),

        student_number:
          form.student_number.trim(),

        first_name:
          form.first_name.trim(),

        last_name:
          form.last_name.trim(),

        gender:
          form.gender,

        date_of_birth:
          form.date_of_birth,

        phone:
          form.phone.trim(),

        address:
          form.address.trim(),

        guardian_name:
          form.guardian_name.trim(),

        guardian_phone:
          form.guardian_phone.trim(),
      };

      if (
        form.password &&
        form.password.trim()
      ) {
        updateData.password =
          form.password.trim();
      }

      const response = await fetch(
        `${API_URL}/${editingStudentId}`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${auth.token}`,
          },

          body: JSON.stringify(
            updateData
          ),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update student."
        );
      }

      setSuccess(
        data.message ||
          "Student updated successfully."
      );

      setForm(emptyForm);
      setEditingStudentId(null);
      setShowStudentForm(false);

      await fetchStudents();

      setActivePage("students");
    } catch (err) {
      console.error(
        "Failed to update student:",
        err
      );

      setFormError(
        err.message ||
          "Failed to update student."
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | DELETE STUDENT
  |--------------------------------------------------------------------------
  */

  const handleDeleteStudent = async (
    student
  ) => {
    const studentName =
      `${student.first_name || ""} ${
        student.last_name || ""
      }`.trim();

    const confirmed =
      window.confirm(
        `Are you sure you want to permanently delete ${
          studentName || "this student"
        }?\n\nThis action cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    setSuccess("");
    setError("");
    setFormError("");

    try {
      const response = await fetch(
        `${API_URL}/${student.id}`,
        {
          method: "DELETE",

          headers: {
            Authorization:
              `Bearer ${auth.token}`,
          },
        }
      );

      const data =
        await response.json();

      if (response.status === 409) {
        setError(
          data.message ||
            "This student has related records and cannot be permanently deleted. Deactivate the student instead."
        );

        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to delete student."
        );
      }

      setSuccess(
        data.message ||
          "Student deleted successfully."
      );

      await fetchStudents();
    } catch (err) {
      console.error(
        "Failed to delete student:",
        err
      );

      setError(
        err.message ||
          "Failed to delete student."
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | ACTIVATE / DEACTIVATE STUDENT
  |--------------------------------------------------------------------------
  */

  const handleStudentStatus = async (
    student
  ) => {
    const currentStatus =
      String(
        student.account_status ||
          "active"
      ).toLowerCase();

    const newStatus =
      currentStatus === "active"
        ? "inactive"
        : "active";

    const studentName =
      `${student.first_name || ""} ${
        student.last_name || ""
      }`.trim();

    const actionText =
      newStatus === "inactive"
        ? "deactivate"
        : "activate";

    const confirmed =
      window.confirm(
        `Are you sure you want to ${actionText} ${
          studentName || "this student"
        }?`
      );

    if (!confirmed) {
      return;
    }

    setSuccess("");
    setError("");
    setFormError("");

    try {
      const response = await fetch(
        `${API_URL}/${student.id}/status`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${auth.token}`,
          },

          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            `Failed to ${actionText} student.`
        );
      }

      setSuccess(
        data.message ||
          `Student ${actionText}d successfully.`
      );

      await fetchStudents();
    } catch (err) {
      console.error(
        "Failed to update student status:",
        err
      );

      setError(
        err.message ||
          `Failed to ${actionText} student.`
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | CANCEL EDIT / REGISTER
  |--------------------------------------------------------------------------
  */

  const handleCancelForm = () => {
    setForm(emptyForm);
    setFormError("");
    setEditingStudentId(null);
    setShowStudentForm(false);
    setActivePage("students");
  };

  /*
  |--------------------------------------------------------------------------
  | SEARCH
  |--------------------------------------------------------------------------
  */

  const filteredStudents =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      if (!query) {
        return students;
      }

      return students.filter(
        (student) => {
          const values = [
            student.student_number,
            student.first_name,
            student.last_name,
            student.email,
            student.phone,
            student.gender,
          ];

          return values.some(
            (value) =>
              String(value || "")
                .toLowerCase()
                .includes(query)
          );
        }
      );
    }, [students, search]);

  /*
  |--------------------------------------------------------------------------
  | DASHBOARD STATISTICS
  |--------------------------------------------------------------------------
  */

  const totalStudents =
    students.length;

  const activeStudents =
    students.filter((student) => {
      const status =
        String(
          student.account_status ||
            "active"
        ).toLowerCase();

      return status === "active";
    }).length;

  const inactiveStudents =
    Math.max(
      totalStudents - activeStudents,
      0
    );

  const maleStudents =
    students.filter(
      (student) =>
        String(
          student.gender || ""
        ).toLowerCase() === "male"
    ).length;

  const femaleStudents =
    students.filter(
      (student) =>
        String(
          student.gender || ""
        ).toLowerCase() === "female"
    ).length;

  const activeRate =
    totalStudents > 0
      ? Math.round(
          (activeStudents /
            totalStudents) *
            100
        )
      : 0;

  const maleRate =
    totalStudents > 0
      ? Math.round(
          (maleStudents /
            totalStudents) *
            100
        )
      : 0;

  const femaleRate =
    totalStudents > 0
      ? Math.round(
          (femaleStudents /
            totalStudents) *
            100
        )
      : 0;

  /*
  |--------------------------------------------------------------------------
  | ROLE-BASED PORTALS
  |--------------------------------------------------------------------------
  */

  if (
    auth?.user?.role === "teacher"
  ) {
    return (
      <TeacherDashboard
        auth={auth}
        onLogout={handleLogout}
      />
    );
  }

  if (
    auth?.user?.role === "student"
  ) {
    return (
      <StudentDashboard
        auth={auth}
        onLogout={handleLogout}
      />
    );
  }

  /*
  |--------------------------------------------------------------------------
  | LOGIN
  |--------------------------------------------------------------------------
  */

  if (!auth?.token) {
    return (
      <Login
        onLogin={(loginData) => {
          setAuth(loginData);
        }}
      />
    );
  }

  /*
  |--------------------------------------------------------------------------
  | ADMIN INFORMATION
  |--------------------------------------------------------------------------
  */

  const adminName =
    auth?.user?.name ||
    auth?.user?.first_name ||
    "Administrator";

  const adminRole =
    auth?.user?.role ||
    "admin";

  /*
  |--------------------------------------------------------------------------
  | PAGE TITLE
  |--------------------------------------------------------------------------
  */

  const pageTitle =
    activePage === "dashboard"
      ? "Dashboard"
      : activePage === "students"
      ? "Students"
      : activePage === "register"
      ? "Register Student"
      : activePage === "edit"
      ? "Edit Student"
      : activePage === "teachers"
      ? "Teacher Management"
      : activePage === "assignments"
      ? "Teacher Assignments"
      : activePage === "classes"
      ? "Class Management"
      : activePage === "subjects"
      ? "Course Units"
      : activePage === "academic-years"
      ? "Academic Years"
      : activePage === "enrollment"
      ? "Student Enrollment"
      : activePage === "activity-logs"
      ? "Activity Logs"
      : "Dashboard";

  /*
  |--------------------------------------------------------------------------
  | PAGE SUBTITLE
  |--------------------------------------------------------------------------
  */

  const pageSubtitle =
    activePage === "dashboard"
      ? "Welcome to your student management dashboard."
      : activePage === "students"
      ? "View and manage registered students."
      : activePage === "register"
      ? "Register a new student into the system."
      : activePage === "edit"
      ? "Update the student's information."
      : activePage === "teachers"
      ? "Manage teachers and teacher accounts."
      : activePage === "assignments"
      ? "Assign teachers to classes and subjects."
      : activePage === "classes"
      ? "Create and manage school classes."
      : activePage === "subjects"
      ? "Manage subjects and course units."
      : activePage === "academic-years"
      ? "Create and manage academic years."
      : activePage === "enrollment"
      ? "Manage student class enrollment."
      : activePage === "activity-logs"
      ? "Monitor administrator activity across the system."
      : "";

  return (
    <div className="app-shell">

      {/* =====================================================
          SIDEBAR
      ====================================================== */}

      <aside className="sidebar">

        <div className="sidebar-brand">

          <div className="brand-logo">
            CFCI
          </div>

          <div>
            <div className="brand-title">
              FORENSICS DEPARTMENT
            </div>

            <div className="brand-subtitle">
              Management System
            </div>
          </div>

        </div>

        <nav className="sidebar-nav">

          {/* DASHBOARD */}

          <button
            type="button"
            className={`nav-item ${
              activePage === "dashboard"
                ? "active"
                : ""
            }`}
            onClick={() => {
              setActivePage("dashboard");
              setSuccess("");
              setFormError("");
              setError("");
            }}
          >
            <span className="nav-icon">
              ⌂
            </span>

            <span>
              Dashboard
            </span>
          </button>

          {/* STUDENTS */}

          <button
            type="button"
            className={`nav-item ${
              activePage === "students"
                ? "active"
                : ""
            }`}
            onClick={() => {
              setActivePage("students");
              setSuccess("");
              setFormError("");
              setError("");
            }}
          >
            <span className="nav-icon">
              ◉
            </span>

            <span>
              Students
            </span>
          </button>

          {/* REGISTER */}

          <button
            type="button"
            className={`nav-item ${
              activePage === "register"
                ? "active"
                : ""
            }`}
            onClick={
              openRegisterForm
            }
          >
            <span className="nav-icon">
              +
            </span>

            <span>
              Register Student
            </span>
          </button>

          {/* TEACHERS */}

          <button
            type="button"
            className={`nav-item ${
              activePage === "teachers"
                ? "active"
                : ""
            }`}
            onClick={() => {
              setActivePage("teachers");
              setSuccess("");
              setFormError("");
              setError("");
            }}
          >
            <span className="nav-icon">
              ◉
            </span>

            <span>
              Teachers
            </span>
          </button>

          {/* ASSIGNMENTS */}

          <button
            type="button"
            className={`nav-item ${
              activePage === "assignments"
                ? "active"
                : ""
            }`}
            onClick={() => {
              setActivePage("assignments");
              setSuccess("");
              setFormError("");
              setError("");
            }}
          >
            <span className="nav-icon">
              ⇄
            </span>

            <span>
              Teacher Assignments
            </span>
          </button>

          {/* CLASSES */}

          <button
            type="button"
            className={`nav-item ${
              activePage === "classes"
                ? "active"
                : ""
            }`}
            onClick={() => {
              setActivePage("classes");
              setSuccess("");
              setFormError("");
              setError("");
            }}
          >
            <span className="nav-icon">
              ▣
            </span>

            <span>
              Classes
            </span>
          </button>

          {/* COURSE UNITS */}

          <button
            type="button"
            className={`nav-item ${
              activePage === "subjects"
                ? "active"
                : ""
            }`}
            onClick={() => {
              setActivePage("subjects");
              setSuccess("");
              setFormError("");
              setError("");
            }}
          >
            <span className="nav-icon">
              ▣
            </span>

            <span>
              Course Units
            </span>
          </button>

          {/* ACADEMIC YEARS */}

          <button
            type="button"
            className={`nav-item ${
              activePage === "academic-years"
                ? "active"
                : ""
            }`}
            onClick={() => {
              setActivePage("academic-years");
              setSuccess("");
              setFormError("");
              setError("");
            }}
          >
            <span className="nav-icon">
              ▣
            </span>

            <span>
              Academic Years
            </span>
          </button>

          {/* ENROLLMENT */}

          <button
            type="button"
            className={`nav-item ${
              activePage === "enrollment"
                ? "active"
                : ""
            }`}
            onClick={() => {
              setActivePage("enrollment");
              setSuccess("");
              setFormError("");
              setError("");
            }}
          >
            <span className="nav-icon">
              ✓
            </span>

            <span>
              Student Enrollment
            </span>
          </button>

          {/* ACTIVITY LOGS - ADMIN ONLY */}

          {auth?.user?.role === "admin" && (
            <button
              type="button"
              className={`nav-item ${
                activePage === "activity-logs"
                  ? "active"
                  : ""
              }`}
              onClick={() => {
                setActivePage("activity-logs");
                setSuccess("");
                setFormError("");
                setError("");
              }}
            >
              <span className="nav-icon">
                ◷
              </span>

              <span>
                Activity Logs
              </span>
            </button>
          )}

        </nav>

        {/* SIDEBAR BOTTOM */}

        <div className="sidebar-bottom">

          <div className="admin-card">

            <div className="admin-avatar">
              {adminName
                .charAt(0)
                .toUpperCase()}
            </div>

            <div className="admin-info">

              <strong>
                {adminName}
              </strong>

              <span>
                {adminRole}
              </span>

            </div>

          </div>

          <button
            type="button"
            className="logout-button"
            onClick={() => {
              const confirmed =
                window.confirm(
                  "Are you sure you want to logout?"
                );

              if (confirmed) {
                handleLogout();
              }
            }}
          >

            <span
              className="logout-icon"
              aria-hidden="true"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10 17L15 12L10 7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <path
                  d="M15 12H3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />

                <path
                  d="M21 3V21"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </span>

            <span>
              Logout
            </span>

          </button>

        </div>

      </aside>

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <main className="main-content">

        {/* TOP BAR */}

        <header className="topbar">

          <div>

            <h1>
              {pageTitle}
            </h1>

            <p>
              {pageSubtitle}
            </p>

          </div>

          <div className="topbar-user">

            <div className="topbar-avatar">
              {adminName
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>

              <strong>
                {adminName}
              </strong>

              <span>
                {adminRole}
              </span>

            </div>

          </div>

        </header>

        {/* ERROR */}

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div className="alert alert-success">
            {success}
          </div>
        )}

        {/* =====================================================
            DASHBOARD
        ====================================================== */}

        {activePage === "dashboard" && (
          <section className="page-content dashboard-page">

            <div className="page-heading">

              <div>

                <span className="eyebrow">
                  OVERVIEW
                </span>

                <h1>
                  Dashboard
                </h1>

                <p className="heading-description">
                  Monitor student activity, staff capacity and key school statistics
                  from one central workspace.
                </p>

              </div>

              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  setActivePage("students");
                  setSearch("");
                  setSuccess("");
                  setFormError("");
                  setError("");
                }}
              >
                View Student Records
              </button>

            </div>

            <div className="stats-grid dashboard-stats">

              <div className="stat-card stat-card-blue">

                <div className="stat-top">

                  <div className="stat-icon">
                    ◉
                  </div>

                  <span className="stat-status">
                    Students
                  </span>

                </div>

                <div className="stat-value">
                  {totalStudents}
                </div>

                <h3>
                  Total Students
                </h3>

                <p>
                  All registered student accounts
                </p>

              </div>

              <div className="stat-card stat-card-green">

                <div className="stat-top">

                  <div className="stat-icon">
                    ✓
                  </div>

                  <span className="stat-status">
                    Active
                  </span>

                </div>

                <div className="stat-value">
                  {activeStudents}
                </div>

                <h3>
                  Active Students
                </h3>

                <p>
                  {activeRate}% of registered students
                </p>

              </div>

              <div className="stat-card stat-card-amber">

                <div className="stat-top">

                  <div className="stat-icon">
                    ◌
                  </div>

                  <span className="stat-status">
                    Inactive
                  </span>

                </div>

                <div className="stat-value">
                  {inactiveStudents}
                </div>

                <h3>
                  Inactive Students
                </h3>

                <p>
                  Accounts currently inactive
                </p>

              </div>

              <div className="stat-card stat-card-purple">

                <div className="stat-top">

                  <div className="stat-icon">
                    ◈
                  </div>

                  <span className="stat-status">
                    Staff
                  </span>

                </div>

                <div className="stat-value">
                  {teachersCount}
                </div>

                <h3>
                  Teachers
                </h3>

                <p>
                  Registered teaching staff
                </p>

              </div>

            </div>

            <div className="dashboard-grid dashboard-analytics-grid">

              <div className="content-card dashboard-overview-card">

                <div className="content-card-header dashboard-card-header">

                  <div>

                    <h2>
                      Student Overview
                    </h2>

                    <p>
                      Current student population and account activity
                    </p>

                  </div>

                  <span className="dashboard-period">
                    Current
                  </span>

                </div>

                <div className="overview-body">

                  <div className="overview-highlight">

                    <div className="overview-ring">

                      <div
                        className="overview-ring-fill"
                        style={{
                          background: `conic-gradient(var(--primary) ${activeRate}%, #e9eef5 ${activeRate}% 100%)`,
                        }}
                      >

                        <div className="overview-ring-center">

                          <strong>
                            {activeRate}%
                          </strong>

                          <span>
                            Active
                          </span>

                        </div>

                      </div>

                    </div>

                    <div className="overview-copy">

                      <strong>
                        Student activity
                      </strong>

                      <span>
                        {activeStudents} of {totalStudents} registered students
                        are currently active.
                      </span>

                      <div className="overview-legend">

                        <span>
                          <i className="legend-dot active-dot"></i>
                          Active
                        </span>

                        <span>
                          <i className="legend-dot inactive-dot"></i>
                          Inactive
                        </span>

                      </div>

                    </div>

                  </div>

                  <div className="metric-bars">

                    <div className="metric-bar-row">

                      <div className="metric-bar-label">

                        <span>
                          Active students
                        </span>

                        <strong>
                          {activeStudents}
                        </strong>

                      </div>

                      <div className="metric-track">

                        <span
                          className="metric-fill active-fill"
                          style={{
                            width: `${activeRate}%`,
                          }}
                        ></span>

                      </div>

                    </div>

                    <div className="metric-bar-row">

                      <div className="metric-bar-label">

                        <span>
                          Inactive students
                        </span>

                        <strong>
                          {inactiveStudents}
                        </strong>

                      </div>

                      <div className="metric-track">

                        <span
                          className="metric-fill inactive-fill"
                          style={{
                            width: `${
                              totalStudents > 0
                                ? Math.round(
                                    (inactiveStudents /
                                      totalStudents) *
                                      100
                                  )
                                : 0
                            }%`,
                          }}
                        ></span>

                      </div>

                    </div>

                    <div className="metric-bar-row">

                      <div className="metric-bar-label">

                        <span>
                          Teachers
                        </span>

                        <strong>
                          {teachersCount}
                        </strong>

                      </div>

                      <div className="metric-track">

                        <span
                          className="metric-fill teacher-fill"
                          style={{
                            width: `${
                              teachersCount > 0
                                ? 100
                                : 0
                            }%`,
                          }}
                        ></span>

                      </div>

                    </div>

                  </div>

                </div>

              </div>

              <div className="content-card dashboard-demographics-card">

                <div className="content-card-header dashboard-card-header">

                  <div>

                    <h2>
                      Student Demographics
                    </h2>

                    <p>
                      Gender distribution
                    </p>

                  </div>

                </div>

                <div className="demographics-body">

                  <div className="demographic-total">

                    <span>
                      Total population
                    </span>

                    <strong>
                      {totalStudents}
                    </strong>

                  </div>

                  <div className="demographic-row">

                    <div className="demographic-label">

                      <span className="demographic-icon male-icon">
                        M
                      </span>

                      <div>

                        <strong>
                          Male
                        </strong>

                        <small>
                          {maleRate}% of students
                        </small>

                      </div>

                    </div>

                    <strong>
                      {maleStudents}
                    </strong>

                  </div>

                  <div className="demographic-row">

                    <div className="demographic-label">

                      <span className="demographic-icon female-icon">
                        F
                      </span>

                      <div>

                        <strong>
                          Female
                        </strong>

                        <small>
                          {femaleRate}% of students
                        </small>

                      </div>

                    </div>

                    <strong>
                      {femaleStudents}
                    </strong>

                  </div>

                  <div className="demographic-progress">

                    <span
                      style={{
                        width: `${Math.min(
                          maleRate,
                          100
                        )}%`,
                      }}
                    ></span>

                    <span
                      style={{
                        width: `${Math.min(
                          femaleRate,
                          100
                        )}%`,
                      }}
                    ></span>

                  </div>

                  <div className="system-health">

                    <div className="health-icon">
                      ✓
                    </div>

                    <div>

                      <strong>
                        System status
                      </strong>

                      <span>
                        All core services are active
                      </span>

                    </div>

                    <b>
                      Active
                    </b>

                  </div>

                </div>

              </div>

            </div>

            <div className="content-card dashboard-table-card">

              <div className="content-card-header dashboard-card-header">

                <div>

                  <h2>
                    Recent Students
                  </h2>

                  <p>
                    Latest registered student records
                  </p>

                </div>

                <button
                  type="button"
                  className="text-button dashboard-view-all"
                  onClick={() => {
                    setActivePage("students");
                    setSearch("");
                  }}
                >
                  View all students →
                </button>

              </div>

              {loading ? (
                <div className="empty-state">

                  <div className="large-spinner"></div>

                  <p>
                    Loading student records...
                  </p>

                </div>
              ) : students.length === 0 ? (
                <div className="empty-state">

                  <div className="empty-icon">
                    ◉
                  </div>

                  <h3>
                    No students registered
                  </h3>

                  <p>
                    Register the first student to start building your student records.
                  </p>

                </div>
              ) : (
                <div className="table-wrapper">

                  <table className="student-table dashboard-student-table">

                    <thead>

                      <tr>

                        <th>
                          Student
                        </th>

                        <th>
                          Student Number
                        </th>

                        <th>
                          Gender
                        </th>

                        <th>
                          Email
                        </th>

                        <th>
                          Phone
                        </th>

                        <th>
                          Status
                        </th>

                        <th>
                          Actions
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {students
                        .slice(0, 5)
                        .map((student) => {

                          const status =
                            String(
                              student.account_status ||
                                "active"
                            ).toLowerCase();

                          const studentName =
                            `${
                              student.first_name ||
                              ""
                            } ${
                              student.last_name ||
                              ""
                            }`.trim() ||
                            "Unnamed Student";

                          const initials =
                            studentName
                              .split(" ")
                              .filter(Boolean)
                              .slice(0, 2)
                              .map(
                                (part) =>
                                  part
                                    .charAt(0)
                                    .toUpperCase()
                              )
                              .join("");

                          return (
                            <tr
                              key={
                                student.id
                              }
                            >

                              <td>

                                <div className="table-student">

                                  <div className="table-avatar">
                                    {initials}
                                  </div>

                                  <div>

                                    <strong>
                                      {studentName}
                                    </strong>

                                    <span>
                                      {
                                        student.email ||
                                        "No email provided"
                                      }
                                    </span>

                                  </div>

                                </div>

                              </td>

                              <td>

                                <span className="student-number-cell">
                                  {
                                    student.student_number ||
                                    "—"
                                  }
                                </span>

                              </td>

                              <td>

                                <span
                                  className={`gender-badge ${
                                    String(
                                      student.gender ||
                                        ""
                                    ).toLowerCase() ===
                                    "female"
                                      ? "female"
                                      : ""
                                  }`}
                                >
                                  {
                                    student.gender ||
                                    "Not specified"
                                  }
                                </span>

                              </td>

                              <td>

                                <span className="table-primary-text">
                                  {
                                    student.email ||
                                    "—"
                                  }
                                </span>

                              </td>

                              <td>

                                <span className="table-primary-text">
                                  {
                                    student.phone ||
                                    "—"
                                  }
                                </span>

                              </td>

                              <td>

                                <span
                                  className={
                                    status ===
                                    "active"
                                      ? "status-active"
                                      : "status-inactive"
                                  }
                                >
                                  {status}
                                </span>

                              </td>

                              <td>

                                <div className="table-actions">

                                  <button
                                    type="button"
                                    className="table-action-button edit-action"
                                    onClick={() =>
                                      handleEditStudent(
                                        student
                                      )
                                    }
                                  >
                                    Edit
                                  </button>

                                  <button
                                    type="button"
                                    className="table-action-button delete-action"
                                    onClick={() =>
                                      handleDeleteStudent(
                                        student
                                      )
                                    }
                                  >
                                    Delete
                                  </button>

                                </div>

                              </td>

                            </tr>
                          );
                        })}

                    </tbody>

                  </table>

                </div>
              )}

              {students.length > 5 && (
                <div className="table-footer dashboard-table-footer">
                  Showing 5 of {students.length} registered students
                </div>
              )}

            </div>

          </section>
        )}

        {/* =====================================================
            STUDENTS
        ====================================================== */}

        {activePage ===
          "students" && (
          <section className="page-content">

            <div className="content-card">

              <div className="content-card-header">

                <div>

                  <h2>
                    Student Records
                  </h2>

                  <p>
                    Search and manage
                    student records.
                  </p>

                </div>

                <button
                  type="button"
                  className="primary-button"
                  onClick={
                    openRegisterForm
                  }
                >
                  + Register Student
                </button>

              </div>

              <div className="search-row">

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search by student number, name, email..."
                />

              </div>

              {loading ? (
                <div className="empty-state">
                  Loading students...
                </div>
              ) : filteredStudents.length ===
                0 ? (
                <div className="empty-state">
                  No matching students
                  found.
                </div>
              ) : (
                <div className="table-wrapper">

                  <table>

                    <thead>

                      <tr>

                        <th>
                          Student Number
                        </th>

                        <th>
                          Name
                        </th>

                        <th>
                          Gender
                        </th>

                        <th>
                          Date of Birth
                        </th>

                        <th>
                          Email
                        </th>

                        <th>
                          Phone
                        </th>

                        <th>
                          Status
                        </th>

                        <th>
                          Actions
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {filteredStudents.map(
                        (student) => {

                          const status =
                            String(
                              student.account_status ||
                                "active"
                            ).toLowerCase();

                          return (
                            <tr
                              key={
                                student.id
                              }
                            >

                              <td>
                                {
                                  student.student_number
                                }
                              </td>

                              <td>
                                {
                                  student.first_name
                                }{" "}
                                {
                                  student.last_name
                                }
                              </td>

                              <td>
                                {
                                  student.gender ||
                                  "—"
                                }
                              </td>

                              <td>
                                {student.date_of_birth
                                  ? String(
                                      student.date_of_birth
                                    ).split(
                                      "T"
                                    )[0]
                                  : "—"}
                              </td>

                              <td>
                                {student.email ||
                                  "—"}
                              </td>

                              <td>
                                {student.phone ||
                                  "—"}
                              </td>

                              <td>

                                <span
                                  className={
                                    status ===
                                    "active"
                                      ? "status-active"
                                      : "status-inactive"
                                  }
                                >
                                  {status}
                                </span>

                              </td>

                              <td>

                                <div
                                  style={{
                                    display:
                                      "flex",
                                    gap:
                                      "8px",
                                    flexWrap:
                                      "wrap",
                                  }}
                                >

                                  <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={() =>
                                      handleEditStudent(
                                        student
                                      )
                                    }
                                  >
                                    Edit
                                  </button>

                                  <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={() =>
                                      handleStudentStatus(
                                        student
                                      )
                                    }
                                  >
                                    {status ===
                                    "active"
                                      ? "Deactivate"
                                      : "Activate"}
                                  </button>

                                  <button
                                    type="button"
                                    className="danger-button"
                                    onClick={() =>
                                      handleDeleteStudent(
                                        student
                                      )
                                    }
                                  >
                                    Delete
                                  </button>

                                </div>

                              </td>

                            </tr>
                          );
                        }
                      )}

                    </tbody>

                  </table>

                </div>
              )}

            </div>

          </section>
        )}

        {/* =====================================================
            REGISTER STUDENT
        ====================================================== */}

        {activePage ===
          "register" && (
          <section className="page-content">

            <div className="content-card">

              <div className="content-card-header">

                <div>

                  <h2>
                    Register Student
                  </h2>

                  <p>
                    Create a new student
                    record.
                  </p>

                </div>

              </div>

              {formError && (
                <div className="alert alert-error">
                  {formError}
                </div>
              )}

              {showStudentForm && (
                <form
                  className="student-form"
                  onSubmit={
                    handleRegisterStudent
                  }
                >

                  <div className="form-grid">

                    <div className="form-group">

                      <label>
                        Student Number
                      </label>

                      <input
                        type="text"
                        name="student_number"
                        value={
                          form.student_number
                        }
                        onChange={
                          handleFormChange
                        }
                        required
                        placeholder="e.g. STU003"
                      />

                    </div>

                    <div className="form-group">

                      <label>
                        Gender
                      </label>

                      <select
                        name="gender"
                        value={
                          form.gender
                        }
                        onChange={
                          handleFormChange
                        }
                        required
                      >

                        <option value="">
                          Select gender
                        </option>

                        <option value="Male">
                          Male
                        </option>

                        <option value="Female">
                          Female
                        </option>

                      </select>

                    </div>

                    <div className="form-group">

                      <label>
                        First Name
                      </label>

                      <input
                        type="text"
                        name="first_name"
                        value={
                          form.first_name
                        }
                        onChange={
                          handleFormChange
                        }
                        required
                        placeholder="First name"
                      />

                    </div>

                    <div className="form-group">

                      <label>
                        Last Name
                      </label>

                      <input
                        type="text"
                        name="last_name"
                        value={
                          form.last_name
                        }
                        onChange={
                          handleFormChange
                        }
                        required
                        placeholder="Last name"
                      />

                    </div>

                    <div className="form-group">

                      <label>
                        Date of Birth
                      </label>

                      <input
                        type="date"
                        name="date_of_birth"
                        value={
                          form.date_of_birth
                        }
                        onChange={
                          handleFormChange
                        }
                        required
                      />

                    </div>

                    <div className="form-group">

                      <label>
                        Email
                      </label>

                      <input
                        type="email"
                        name="email"
                        value={
                          form.email
                        }
                        onChange={
                          handleFormChange
                        }
                        required
                        placeholder="student@example.com"
                      />

                    </div>

                    <div className="form-group">

                      <label>
                        Phone
                      </label>

                      <input
                        type="text"
                        name="phone"
                        value={
                          form.phone
                        }
                        onChange={
                          handleFormChange
                        }
                        placeholder="Phone number"
                      />

                    </div>

                    <div className="form-group">

                      <label>
                        Password
                      </label>

                      <input
                        type="password"
                        name="password"
                        value={
                          form.password
                        }
                        onChange={
                          handleFormChange
                        }
                        required
                        minLength="6"
                        placeholder="Student login password"
                      />

                    </div>

                    <div className="form-group form-group-full">

                      <label>
                        Address
                      </label>

                      <textarea
                        name="address"
                        value={
                          form.address
                        }
                        onChange={
                          handleFormChange
                        }
                        rows="3"
                        placeholder="Student address"
                      />

                    </div>

                  </div>

                  <div className="form-actions">

                    <button
                      type="submit"
                      className="primary-button"
                    >
                      Register Student
                    </button>

                    <button
                      type="button"
                      className="secondary-button"
                      onClick={
                        handleCancelForm
                      }
                    >
                      Cancel
                    </button>

                  </div>

                </form>
              )}

              {!showStudentForm && (
                <div className="empty-state">

                  <p>
                    Click below to
                    register a new
                    student.
                  </p>

                  <button
                    type="button"
                    className="primary-button"
                    onClick={
                      openRegisterForm
                    }
                  >
                    + Register Student
                  </button>

                </div>
              )}

            </div>

          </section>
        )}

        {/* =====================================================
            EDIT STUDENT
        ====================================================== */}

        {activePage === "edit" && (
          <section className="page-content">

            <div className="content-card">

              <div className="content-card-header">

                <div>

                  <h2>
                    Edit Student
                  </h2>

                  <p>
                    Update the student's
                    information.
                  </p>

                </div>

              </div>

              {formError && (
                <div className="alert alert-error">
                  {formError}
                </div>
              )}

              {showStudentForm && (
                <form
                  className="student-form"
                  onSubmit={
                    handleUpdateStudent
                  }
                >

                  <div className="form-grid">

                    <div className="form-group">

                      <label>
                        Student Number
                      </label>

                      <input
                        type="text"
                        name="student_number"
                        value={
                          form.student_number
                        }
                        onChange={
                          handleFormChange
                        }
                        required
                      />

                    </div>

                    <div className="form-group">

                      <label>
                        Gender
                      </label>

                      <select
                        name="gender"
                        value={
                          form.gender
                        }
                        onChange={
                          handleFormChange
                        }
                        required
                      >

                        <option value="">
                          Select gender
                        </option>

                        <option value="Male">
                          Male
                        </option>

                        <option value="Female">
                          Female
                        </option>

                      </select>

                    </div>

                    <div className="form-group">

                      <label>
                        First Name
                      </label>

                      <input
                        type="text"
                        name="first_name"
                        value={
                          form.first_name
                        }
                        onChange={
                          handleFormChange
                        }
                        required
                      />

                    </div>

                    <div className="form-group">

                      <label>
                        Last Name
                      </label>

                      <input
                        type="text"
                        name="last_name"
                        value={
                          form.last_name
                        }
                        onChange={
                          handleFormChange
                        }
                        required
                      />

                    </div>

                    <div className="form-group">

                      <label>
                        Date of Birth
                      </label>

                      <input
                        type="date"
                        name="date_of_birth"
                        value={
                          form.date_of_birth
                        }
                        onChange={
                          handleFormChange
                        }
                        required
                      />

                    </div>

                    <div className="form-group">

                      <label>
                        Email
                      </label>

                      <input
                        type="email"
                        name="email"
                        value={
                          form.email
                        }
                        onChange={
                          handleFormChange
                        }
                        required
                      />

                    </div>

                    <div className="form-group">

                      <label>
                        Phone
                      </label>

                      <input
                        type="text"
                        name="phone"
                        value={
                          form.phone
                        }
                        onChange={
                          handleFormChange
                        }
                      />

                    </div>

                    <div className="form-group">

                      <label>
                        New Password
                      </label>

                      <input
                        type="password"
                        name="password"
                        value={
                          form.password
                        }
                        onChange={
                          handleFormChange
                        }
                        minLength="6"
                        placeholder="Leave blank to keep current password"
                      />

                    </div>

                    <div className="form-group form-group-full">

                      <label>
                        Address
                      </label>

                      <textarea
                        name="address"
                        value={
                          form.address
                        }
                        onChange={
                          handleFormChange
                        }
                        rows="3"
                      />

                    </div>

                    <div className="form-group">

                      <label>
                        Guardian Name
                      </label>

                      <input
                        type="text"
                        name="guardian_name"
                        value={
                          form.guardian_name
                        }
                        onChange={
                          handleFormChange
                        }
                      />

                    </div>

                    <div className="form-group">

                      <label>
                        Guardian Phone
                      </label>

                      <input
                        type="text"
                        name="guardian_phone"
                        value={
                          form.guardian_phone
                        }
                        onChange={
                          handleFormChange
                        }
                      />

                    </div>

                  </div>

                  <div className="form-actions">

                    <button
                      type="submit"
                      className="primary-button"
                    >
                      Update Student
                    </button>

                    <button
                      type="button"
                      className="secondary-button"
                      onClick={
                        handleCancelForm
                      }
                    >
                      Cancel
                    </button>

                  </div>

                </form>
              )}

            </div>

          </section>
        )}

        {/* =====================================================
            TEACHERS
        ====================================================== */}

        {activePage ===
          "teachers" && (
          <section className="page-content">

            <TeacherManagement
              auth={auth}
            />

          </section>
        )}

        {/* =====================================================
            TEACHER ASSIGNMENTS
        ====================================================== */}

        {activePage ===
          "assignments" && (
          <section className="page-content">

            <TeacherAssignmentManagement
              auth={auth}
            />

          </section>
        )}

        {/* =====================================================
            CLASSES
        ====================================================== */}

        {activePage ===
          "classes" && (
          <section className="page-content">

            <ClassManagement
              auth={auth}
            />

          </section>
        )}

        {/* =====================================================
            COURSE UNITS
        ====================================================== */}

        {activePage ===
          "subjects" && (
          <section className="page-content">

            <SubjectManagement
              auth={auth}
            />

          </section>
        )}

        {/* =====================================================
            ACADEMIC YEARS
        ====================================================== */}

        {activePage ===
          "academic-years" && (
          <section className="page-content">

            <AcademicYearManagement
              auth={auth}
            />

          </section>
        )}

        {/* =====================================================
            STUDENT ENROLLMENT
        ====================================================== */}

        {activePage ===
          "enrollment" && (
          <section className="page-content">

            <EnrollmentManagement
              auth={auth}
            />

          </section>
        )}

        {/* =====================================================
            ACTIVITY LOGS
        ====================================================== */}

        {activePage === "activity-logs" &&
          auth?.user?.role === "admin" && (
          <section className="page-content">

            <ActivityLogManagement
              auth={auth}
            />

          </section>
        )}

      </main>

    </div>
  );
}

export default App;
