import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const emptyTeacherForm = {
  name: "",
  email: "",
  password: "",
  employee_number: "",
  first_name: "",
  last_name: "",
  gender: "",
  date_of_birth: "",
  phone: "",
  address: "",
  specialization: "",
  hire_date: "",
  status: "active",
};

function TeacherManagement({ auth, onLogout }) {
  const [teachers, setTeachers] = useState([]);
  const [form, setForm] = useState(emptyTeacherForm);

  const [editingTeacherId, setEditingTeacherId] =
    useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [statusChangingId, setStatusChangingId] =
    useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /*
  |--------------------------------------------------------------------------
  | FETCH TEACHERS
  |--------------------------------------------------------------------------
  */

  const fetchTeachers = async () => {
    if (!auth?.token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE}/teachers`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth.token}`,
          },
        }
      );

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        onLogout();
        return;
      }

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to load teachers."
        );
      }

      const teacherList = Array.isArray(data)
        ? data
        : data.teachers ||
          data.data ||
          [];

      setTeachers(teacherList);
    } catch (err) {
      console.error(
        "Fetch teachers error:",
        err
      );

      setError(
        err.message ||
          "Unable to load teachers."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, [auth]);


  /*
  |--------------------------------------------------------------------------
  | INPUT CHANGE
  |--------------------------------------------------------------------------
  */

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };


  /*
  |--------------------------------------------------------------------------
  | EDIT TEACHER
  |--------------------------------------------------------------------------
  */

  const handleEdit = (teacher) => {
    setError("");
    setSuccess("");

    setEditingTeacherId(teacher.id);

    setForm({
      name:
        teacher.name ||
        `${teacher.first_name || ""} ${
          teacher.last_name || ""
        }`.trim(),

      email:
        teacher.email || "",

      password: "",

      employee_number:
        teacher.employee_number || "",

      first_name:
        teacher.first_name || "",

      last_name:
        teacher.last_name || "",

      gender:
        teacher.gender || "",

      date_of_birth:
        teacher.date_of_birth
          ? String(
              teacher.date_of_birth
            ).substring(0, 10)
          : "",

      phone:
        teacher.phone || "",

      address:
        teacher.address || "",

      specialization:
        teacher.specialization || "",

      hire_date:
        teacher.hire_date
          ? String(
              teacher.hire_date
            ).substring(0, 10)
          : "",

      status:
        teacher.status || "active",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };


  /*
  |--------------------------------------------------------------------------
  | CANCEL EDIT
  |--------------------------------------------------------------------------
  */

  const handleCancelEdit = () => {
    setEditingTeacherId(null);
    setForm(emptyTeacherForm);
    setError("");
    setSuccess("");
  };


  /*
  |--------------------------------------------------------------------------
  | CREATE / UPDATE TEACHER
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!auth?.token) {
      setError(
        "You must be logged in as an administrator."
      );
      return;
    }

    const requiredFields = [
      "name",
      "email",
      "employee_number",
      "first_name",
      "last_name",
      "gender",
    ];

    const missingField =
      requiredFields.some(
        (field) =>
          !String(
            form[field] || ""
          ).trim()
      );

    if (missingField) {
      setError(
        "Please complete all required teacher fields."
      );
      return;
    }

    /*
     * Password required when creating.
     */

    if (
      !editingTeacherId &&
      form.password.length < 6
    ) {
      setError(
        "Teacher password must be at least 6 characters."
      );
      return;
    }

    /*
     * Password optional when editing.
     */

    if (
      editingTeacherId &&
      form.password &&
      form.password.length < 6
    ) {
      setError(
        "Teacher password must be at least 6 characters."
      );
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        name:
          form.name.trim(),

        email:
          form.email.trim(),

        employee_number:
          form.employee_number.trim(),

        first_name:
          form.first_name.trim(),

        last_name:
          form.last_name.trim(),

        gender:
          form.gender,

        date_of_birth:
          form.date_of_birth || null,

        phone:
          form.phone.trim() || null,

        address:
          form.address.trim() || null,

        specialization:
          form.specialization.trim() || null,

        hire_date:
          form.hire_date || null,

        status:
          form.status || "active",
      };

      /*
       * Only send password when provided.
       */

      if (
        form.password.trim()
      ) {
        payload.password =
          form.password;
      }

      const url = editingTeacherId
        ? `${API_BASE}/teachers/${editingTeacherId}`
        : `${API_BASE}/teachers`;

      const method = editingTeacherId
        ? "PUT"
        : "POST";

      const response = await fetch(
        url,
        {
          method,

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${auth.token}`,
          },

          body:
            JSON.stringify(payload),
        }
      );

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        onLogout();
        return;
      }

      const data =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Unable to save teacher."
        );
      }

      setSuccess(
        data.message ||
          (editingTeacherId
            ? "Teacher updated successfully."
            : "Teacher created successfully.")
      );

      setForm(
        emptyTeacherForm
      );

      setEditingTeacherId(
        null
      );

      await fetchTeachers();
    } catch (err) {
      console.error(
        "Save teacher error:",
        err
      );

      setError(
        err.message ||
          "Unable to save teacher."
      );
    } finally {
      setSubmitting(false);
    }
  };


  /*
  |--------------------------------------------------------------------------
  | ACTIVATE / DEACTIVATE TEACHER
  |--------------------------------------------------------------------------
  */

  const handleStatusChange = async (
    teacher,
    nextStatus
  ) => {
    const teacherName =
      `${teacher.first_name || ""} ${
        teacher.last_name || ""
      }`.trim() ||
      teacher.name ||
      "this teacher";

    const action =
      nextStatus === "inactive"
        ? "deactivate"
        : "activate";

    const confirmed =
      window.confirm(
        `Are you sure you want to ${action} ${teacherName}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setStatusChangingId(
        teacher.id
      );

      setError("");
      setSuccess("");

      const endpoint =
        nextStatus === "inactive"
          ? "deactivate"
          : "activate";

      const response =
        await fetch(
          `${API_BASE}/teachers/${teacher.id}/${endpoint}`,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${auth.token}`,
            },
          }
        );

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        onLogout();
        return;
      }

      const data =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            `Unable to ${action} teacher.`
        );
      }

      setSuccess(
        data.message ||
          `Teacher ${action}d successfully.`
      );

      /*
       * If this teacher is currently being
       * edited, update the form status too.
       */

      if (
        editingTeacherId ===
        teacher.id
      ) {
        setForm((previous) => ({
          ...previous,
          status: nextStatus,
        }));
      }

      await fetchTeachers();
    } catch (err) {
      console.error(
        `${action} teacher error:`,
        err
      );

      setError(
        err.message ||
          `Unable to ${action} teacher.`
      );
    } finally {
      setStatusChangingId(null);
    }
  };


  /*
  |--------------------------------------------------------------------------
  | DELETE TEACHER
  |--------------------------------------------------------------------------
  */

  const handleDelete = async (
    teacher
  ) => {
    const teacherName =
      `${teacher.first_name || ""} ${
        teacher.last_name || ""
      }`.trim() ||
      teacher.name ||
      "this teacher";

    /*
     * First confirmation.
     */

    const confirmed =
      window.confirm(
        `Are you sure you want to permanently delete ${teacherName}?`
      );

    if (!confirmed) {
      return;
    }

    /*
     * Explain permanent deletion.
     */

    const secondConfirmed =
      window.confirm(
        `Permanent deletion will remove the teacher account and profile.${
          teacher.status === "inactive"
            ? "\n\nIf assignment records exist, they will also be removed."
            : ""
        }\n\nContinue?`
      );

    if (!secondConfirmed) {
      return;
    }

    try {
      setDeletingId(
        teacher.id
      );

      setError("");
      setSuccess("");

      const response =
        await fetch(
          `${API_BASE}/teachers/${teacher.id}`,
          {
            method: "DELETE",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${auth.token}`,
            },
          }
        );

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        onLogout();
        return;
      }

      const data =
        await response
          .json()
          .catch(() => ({}));

      /*
       * IMPORTANT:
       * Active teacher with assignments
       * cannot be permanently deleted.
       *
       * Ask whether admin wants to
       * deactivate the teacher now.
       */

      if (
        response.status === 409 &&
        data.requiresDeactivation
      ) {
        const deactivateConfirmed =
          window.confirm(
            `${teacherName} has assignment records and must be deactivated before permanent deletion.\n\nDo you want to deactivate this teacher now?`
          );

        if (
          deactivateConfirmed
        ) {
          await deactivateTeacherAfterDeleteRequest(
            teacher
          );
        }

        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to delete teacher."
        );
      }

      setSuccess(
        data.message ||
          "Teacher deleted successfully."
      );

      /*
       * If currently editing this teacher,
       * clear the form.
       */

      if (
        editingTeacherId ===
        teacher.id
      ) {
        setEditingTeacherId(
          null
        );

        setForm(
          emptyTeacherForm
        );
      }

      await fetchTeachers();
    } catch (err) {
      console.error(
        "Delete teacher error:",
        err
      );

      setError(
        err.message ||
          "Unable to delete teacher."
      );
    } finally {
      setDeletingId(null);
    }
  };


  /*
  |--------------------------------------------------------------------------
  | DEACTIVATE AFTER DELETE REQUEST
  |--------------------------------------------------------------------------
  */

  const deactivateTeacherAfterDeleteRequest =
    async (teacher) => {
      try {
        const response =
          await fetch(
            `${API_BASE}/teachers/${teacher.id}/deactivate`,
            {
              method: "PUT",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${auth.token}`,
              },
            }
          );

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          onLogout();
          return;
        }

        const data =
          await response
            .json()
            .catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to deactivate teacher."
          );
        }

        setSuccess(
          `${teacher.first_name || teacher.name || "Teacher"} has been deactivated. You can now click Delete again to permanently remove the teacher and assignment records.`
        );

        /*
         * Update edit form if needed.
         */

        if (
          editingTeacherId ===
          teacher.id
        ) {
          setForm((previous) => ({
            ...previous,
            status: "inactive",
          }));
        }

        await fetchTeachers();
      } catch (err) {
        console.error(
          "Automatic deactivation error:",
          err
        );

        setError(
          err.message ||
            "Unable to deactivate teacher."
        );
      }
    };


  /*
  |--------------------------------------------------------------------------
  | DATE FORMAT
  |--------------------------------------------------------------------------
  */

  const formatDate = (date) => {
    if (!date) {
      return "—";
    }

    const parsedDate =
      new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return "—";
    }

    return parsedDate.toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };


  /*
  |--------------------------------------------------------------------------
  | PAGE
  |--------------------------------------------------------------------------
  */

  return (
    <div>

      {/* PAGE HEADER */}

      <div className="page-heading">

        <div>

          <p className="eyebrow">
            TEACHER MANAGEMENT
          </p>

          <h1>
            {editingTeacherId
              ? "Edit Teacher"
              : "Teachers"}
          </h1>

          <p className="heading-description">
            {editingTeacherId
              ? "Update the teacher's information."
              : "Create and manage teacher accounts."}
          </p>

        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={fetchTeachers}
          disabled={loading}
        >
          ↻ Refresh
        </button>

      </div>


      {/* ALERTS */}

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


      {/* FORM */}

      <div className="content-card registration-card">

        <div className="card-header">

          <div>

            <h2>
              {editingTeacherId
                ? "Edit Teacher"
                : "Add Teacher"}
            </h2>

            <p>
              {editingTeacherId
                ? "Update the teacher's information."
                : "Create a teacher account for system access."}
            </p>

          </div>

        </div>


        <form
          onSubmit={handleSubmit}
        >

          {/* ACCOUNT INFORMATION */}

          <section className="form-section">

            <div className="form-section-heading">

              <div className="section-number">
                01
              </div>

              <div>

                <h2>
                  Account Information
                </h2>

                <p>
                  These details are used
                  for teacher login.
                </p>

              </div>

            </div>


            <div className="form-grid">

              <TeacherField
                label="Account Name"
                name="name"
                value={form.name}
                onChange={
                  handleInputChange
                }
                required
                placeholder="e.g. John Doe"
              />

              <TeacherField
                label="Email Address"
                name="email"
                type="email"
                value={form.email}
                onChange={
                  handleInputChange
                }
                required
                placeholder="teacher@example.com"
              />

              <TeacherField
                label={
                  editingTeacherId
                    ? "New Password (optional)"
                    : "Password"
                }
                name="password"
                type="password"
                value={
                  form.password
                }
                onChange={
                  handleInputChange
                }
                required={
                  !editingTeacherId
                }
                placeholder={
                  editingTeacherId
                    ? "Leave blank to keep current password"
                    : "Minimum 6 characters"
                }
              />

            </div>

          </section>


          {/* TEACHER INFORMATION */}

          <section className="form-section">

            <div className="form-section-heading">

              <div className="section-number">
                02
              </div>

              <div>

                <h2>
                  Teacher Information
                </h2>

                <p>
                  Basic information about
                  the teacher.
                </p>

              </div>

            </div>


            <div className="form-grid">

              <TeacherField
                label="Employee Number"
                name="employee_number"
                value={
                  form.employee_number
                }
                onChange={
                  handleInputChange
                }
                required
                placeholder="e.g. TCH001"
              />

              <TeacherField
                label="First Name"
                name="first_name"
                value={
                  form.first_name
                }
                onChange={
                  handleInputChange
                }
                required
                placeholder="Enter first name"
              />

              <TeacherField
                label="Last Name"
                name="last_name"
                value={
                  form.last_name
                }
                onChange={
                  handleInputChange
                }
                required
                placeholder="Enter last name"
              />


              <div className="form-field">

                <label htmlFor="teacher-gender">
                  Gender{" "}
                  <span>*</span>
                </label>

                <select
                  id="teacher-gender"
                  name="gender"
                  value={
                    form.gender
                  }
                  onChange={
                    handleInputChange
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

                  <option value="Other">
                    Other
                  </option>

                </select>

              </div>


              <TeacherField
                label="Date of Birth"
                name="date_of_birth"
                type="date"
                value={
                  form.date_of_birth
                }
                onChange={
                  handleInputChange
                }
              />


              <TeacherField
                label="Phone"
                name="phone"
                value={
                  form.phone
                }
                onChange={
                  handleInputChange
                }
                placeholder="Phone number"
              />


              <TeacherField
                label="Specialization"
                name="specialization"
                value={
                  form.specialization
                }
                onChange={
                  handleInputChange
                }
                placeholder="e.g. Mathematics"
              />


              <TeacherField
                label="Hire Date"
                name="hire_date"
                type="date"
                value={
                  form.hire_date
                }
                onChange={
                  handleInputChange
                }
              />


              <div className="form-field">

                <label htmlFor="teacher-status">
                  Account Status
                </label>

                <select
                  id="teacher-status"
                  name="status"
                  value={
                    form.status
                  }
                  onChange={
                    handleInputChange
                  }
                >

                  <option value="active">
                    Active
                  </option>

                  <option value="inactive">
                    Inactive
                  </option>

                </select>

              </div>


              <div className="form-field">

                <label htmlFor="teacher-address">
                  Address
                </label>

                <textarea
                  id="teacher-address"
                  name="address"
                  value={
                    form.address
                  }
                  onChange={
                    handleInputChange
                  }
                  rows="3"
                  placeholder="Teacher address"
                />

              </div>

            </div>

          </section>


          {/* ACTIONS */}

          <div className="form-actions">

            {editingTeacherId && (
              <button
                type="button"
                className="secondary-button"
                onClick={
                  handleCancelEdit
                }
                disabled={
                  submitting
                }
              >
                Cancel
              </button>
            )}


            <button
              type="submit"
              className="primary-button register-submit"
              disabled={
                submitting
              }
            >

              {submitting ? (
                <>
                  <span className="spinner" />

                  {editingTeacherId
                    ? "Updating Teacher..."
                    : "Creating Teacher..."}
                </>
              ) : (
                <>
                  ✓{" "}
                  {editingTeacherId
                    ? "Update Teacher"
                    : "Create Teacher"}
                </>
              )}

            </button>

          </div>

        </form>

      </div>


      {/* TEACHER LIST */}

      <section className="teacher-section">

        <div className="section-header">

          <div>

            <h2>
              Registered Teachers
            </h2>

            <p>
              Teachers currently registered
              in the system.
            </p>

          </div>

        </div>


        {loading ? (

          <div className="empty-state">
            Loading teachers...
          </div>

        ) : teachers.length === 0 ? (

          <div className="empty-state">
            No teachers have been
            registered yet.
          </div>

        ) : (

          <div className="teacher-table-wrapper">

            <table className="teacher-table">

              <thead>

                <tr>

                  <th>
                    Teacher
                  </th>

                  <th>
                    Employee Number
                  </th>

                  <th>
                    Email
                  </th>

                  <th>
                    Gender
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Created
                  </th>

                  <th>
                    Actions
                  </th>

                </tr>

              </thead>


              <tbody>

                {teachers.map(
                  (teacher, index) => {

                    const isInactive =
                      teacher.status ===
                      "inactive";

                    const isDeleting =
                      deletingId ===
                      teacher.id;

                    const isChangingStatus =
                      statusChangingId ===
                      teacher.id;

                    return (
                      <tr
                        key={
                          teacher.id ||
                          index
                        }
                      >

                        <td>

                          <strong>

                            {teacher.first_name ||
                              teacher.name ||
                              "—"}

                            {" "}

                            {teacher.last_name ||
                              ""}

                          </strong>

                        </td>


                        <td>
                          {teacher.employee_number ||
                            "—"}
                        </td>


                        <td>
                          {teacher.email ||
                            "—"}
                        </td>


                        <td>
                          {teacher.gender ||
                            "—"}
                        </td>


                        <td>

                          <span
                            className={
                              isInactive
                                ? "status-inactive"
                                : "status-active"
                            }
                          >
                            {isInactive
                              ? "Inactive"
                              : "Active"}
                          </span>

                        </td>


                        <td>
                          {formatDate(
                            teacher.created_at
                          )}
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

                            {/* EDIT */}

                            <button
                              type="button"
                              className="secondary-button"
                              onClick={() =>
                                handleEdit(
                                  teacher
                                )
                              }
                              disabled={
                                isDeleting ||
                                isChangingStatus
                              }
                            >
                              Edit
                            </button>


                            {/* ACTIVATE */}

                            {isInactive ? (

                              <button
                                type="button"
                                className="primary-button"
                                onClick={() =>
                                  handleStatusChange(
                                    teacher,
                                    "active"
                                  )
                                }
                                disabled={
                                  isDeleting ||
                                  isChangingStatus
                                }
                              >
                                {isChangingStatus
                                  ? "Activating..."
                                  : "Activate"}
                              </button>

                            ) : (

                              /* DEACTIVATE */

                              <button
                                type="button"
                                className="secondary-button"
                                onClick={() =>
                                  handleStatusChange(
                                    teacher,
                                    "inactive"
                                  )
                                }
                                disabled={
                                  isDeleting ||
                                  isChangingStatus
                                }
                              >
                                {isChangingStatus
                                  ? "Deactivating..."
                                  : "Deactivate"}
                              </button>

                            )}


                            {/* DELETE */}

                            <button
                              type="button"
                              className="delete-button"
                              onClick={() =>
                                handleDelete(
                                  teacher
                                )
                              }
                              disabled={
                                isDeleting ||
                                isChangingStatus
                              }
                            >

                              {isDeleting
                                ? "Processing..."
                                : "Delete"}

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

      </section>

    </div>
  );
}


/*
|--------------------------------------------------------------------------
| TEACHER FORM FIELD
|--------------------------------------------------------------------------
*/

function TeacherField({
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

      <label
        htmlFor={`teacher-${name}`}
      >

        {label}{" "}

        {required && (
          <span>*</span>
        )}

      </label>


      <input
        id={`teacher-${name}`}
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


export default TeacherManagement;
