import { useEffect, useMemo, useState } from "react";

const API_BASE = "http://localhost:5000/api";

const emptyForm = {
  teacher_id: "",
  class_subject_id: "",
  semester_id: "",
  status: "active",
};

function TeacherAssignmentManagement({
  auth,
  onLogout,
}) {
  const [teachers, setTeachers] = useState([]);
  const [classSubjects, setClassSubjects] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const [form, setForm] = useState(emptyForm);

  const [editingAssignmentId, setEditingAssignmentId] =
    useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [processingId, setProcessingId] =
    useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${auth?.token || ""}`,
    }),
    [auth?.token]
  );


  /*
  |--------------------------------------------------------------------------
  | AUTH ERROR
  |--------------------------------------------------------------------------
  */

  const handleAuthError = (response) => {
    if (
      response.status === 401 ||
      response.status === 403
    ) {
      onLogout();
      return true;
    }

    return false;
  };


  /*
  |--------------------------------------------------------------------------
  | FETCH ALL DATA
  |--------------------------------------------------------------------------
  */

  const fetchAllData = async () => {
    if (!auth?.token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [
        teachersResponse,
        classSubjectsResponse,
        semestersResponse,
        assignmentsResponse,
      ] = await Promise.all([
        fetch(`${API_BASE}/teachers`, {
          headers,
        }),

        fetch(`${API_BASE}/class-subjects`, {
          headers,
        }),

        fetch(`${API_BASE}/semesters`, {
          headers,
        }),

        fetch(
          `${API_BASE}/teacher-assignments`,
          {
            headers,
          }
        ),
      ]);

      const responses = [
        teachersResponse,
        classSubjectsResponse,
        semestersResponse,
        assignmentsResponse,
      ];

      if (responses.some(handleAuthError)) {
        return;
      }

      const [
        teachersData,
        classSubjectsData,
        semestersData,
        assignmentsData,
      ] = await Promise.all(
        responses.map((response) =>
          response.json().catch(() => [])
        )
      );

      if (!teachersResponse.ok) {
        throw new Error(
          teachersData.message ||
            "Unable to load teachers."
        );
      }

      if (!classSubjectsResponse.ok) {
        throw new Error(
          classSubjectsData.message ||
            "Unable to load class subjects."
        );
      }

      if (!semestersResponse.ok) {
        throw new Error(
          semestersData.message ||
            "Unable to load semesters."
        );
      }

      if (!assignmentsResponse.ok) {
        throw new Error(
          assignmentsData.message ||
            "Unable to load teacher assignments."
        );
      }

      setTeachers(
        Array.isArray(teachersData)
          ? teachersData
          : teachersData.teachers ||
              teachersData.data ||
              []
      );

      setClassSubjects(
        Array.isArray(classSubjectsData)
          ? classSubjectsData
          : classSubjectsData.classSubjects ||
              classSubjectsData.data ||
              []
      );

      setSemesters(
        Array.isArray(semestersData)
          ? semestersData
          : semestersData.semesters ||
              semestersData.data ||
              []
      );

      setAssignments(
        Array.isArray(assignmentsData)
          ? assignmentsData
          : assignmentsData.assignments ||
              assignmentsData.data ||
              []
      );
    } catch (err) {
      console.error(
        "Teacher assignment data error:",
        err
      );

      setError(
        err.message ||
          "Unable to load teacher assignment data."
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchAllData();
  }, [auth?.token]);


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

    setError("");
    setSuccess("");
  };


  /*
  |--------------------------------------------------------------------------
  | RESET FORM
  |--------------------------------------------------------------------------
  */

  const resetForm = () => {
    setForm(emptyForm);
    setEditingAssignmentId(null);
  };


  /*
  |--------------------------------------------------------------------------
  | EDIT ASSIGNMENT
  |--------------------------------------------------------------------------
  */

  const handleEdit = (assignment) => {
    setError("");
    setSuccess("");

    setEditingAssignmentId(
      assignment.id
    );

    setForm({
      teacher_id:
        assignment.teacher_id
          ? String(
              assignment.teacher_id
            )
          : "",

      class_subject_id:
        assignment.class_subject_id
          ? String(
              assignment.class_subject_id
            )
          : "",

      semester_id:
        assignment.semester_id
          ? String(
              assignment.semester_id
            )
          : "",

      status:
        assignment.status ||
        "active",
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
    resetForm();

    setError("");
    setSuccess("");
  };


  /*
  |--------------------------------------------------------------------------
  | CREATE / UPDATE ASSIGNMENT
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      !form.teacher_id ||
      !form.class_subject_id ||
      !form.semester_id
    ) {
      setError(
        "Please select a teacher, class/subject, and semester."
      );
      return;
    }

    try {
      setSubmitting(true);

      const isEditing =
        Boolean(editingAssignmentId);

      const url = isEditing
        ? `${API_BASE}/teacher-assignments/${editingAssignmentId}`
        : `${API_BASE}/teacher-assignments`;

      const method = isEditing
        ? "PUT"
        : "POST";

      const response = await fetch(
        url,
        {
          method,
          headers,

          body: JSON.stringify({
            teacher_id:
              Number(form.teacher_id),

            class_subject_id:
              Number(
                form.class_subject_id
              ),

            semester_id:
              Number(form.semester_id),

            status:
              form.status ||
              "active",
          }),
        }
      );

      if (handleAuthError(response)) {
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
            "Unable to save teacher assignment."
        );
      }

      setSuccess(
        data.message ||
          (isEditing
            ? "Teacher assignment updated successfully."
            : "Teacher assigned successfully.")
      );

      resetForm();

      await fetchAllData();
    } catch (err) {
      console.error(
        "Save teacher assignment error:",
        err
      );

      setError(
        err.message ||
          "Unable to save teacher assignment."
      );
    } finally {
      setSubmitting(false);
    }
  };


  /*
  |--------------------------------------------------------------------------
  | ACTIVATE / DEACTIVATE
  |--------------------------------------------------------------------------
  */

  const handleStatusChange = async (
    assignment,
    nextStatus
  ) => {
    const action =
      nextStatus === "inactive"
        ? "deactivate"
        : "activate";

    const teacherName =
      assignment.teacher_name ||
      "this teacher";

    const confirmed =
      window.confirm(
        `Are you sure you want to ${action} the assignment for ${teacherName}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingId(
        assignment.id
      );

      setError("");
      setSuccess("");

      const endpoint =
        nextStatus === "inactive"
          ? "deactivate"
          : "activate";

      const response =
        await fetch(
          `${API_BASE}/teacher-assignments/${assignment.id}/${endpoint}`,
          {
            method: "PUT",
            headers,
          }
        );

      if (handleAuthError(response)) {
        return;
      }

      const data =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            `Unable to ${action} teacher assignment.`
        );
      }

      setSuccess(
        data.message ||
          `Teacher assignment ${action}d successfully.`
      );

      await fetchAllData();
    } catch (err) {
      console.error(
        "Teacher assignment status error:",
        err
      );

      setError(
        err.message ||
          `Unable to ${action} teacher assignment.`
      );
    } finally {
      setProcessingId(null);
    }
  };


  /*
  |--------------------------------------------------------------------------
  | DELETE ASSIGNMENT
  |--------------------------------------------------------------------------
  */

  const handleDelete = async (
    assignment
  ) => {
    const teacherName =
      assignment.teacher_name ||
      "this teacher";

    const confirmed =
      window.confirm(
        `Are you sure you want to permanently delete the assignment for ${teacherName}?\n\nThis action cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    /*
     * Active assignments must first
     * be deactivated.
     */
    if (
      assignment.status !==
      "inactive"
    ) {
      const deactivateConfirmed =
        window.confirm(
          `This assignment is currently active.\n\nYou must deactivate it before permanently deleting it.\n\nWould you like to deactivate it now?`
        );

      if (
        !deactivateConfirmed
      ) {
        return;
      }

      try {
        setProcessingId(
          assignment.id
        );

        setError("");
        setSuccess("");

        const response =
          await fetch(
            `${API_BASE}/teacher-assignments/${assignment.id}/deactivate`,
            {
              method: "PUT",
              headers,
            }
          );

        if (
          handleAuthError(
            response
          )
        ) {
          return;
        }

        const data =
          await response
            .json()
            .catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to deactivate assignment."
          );
        }

        setSuccess(
          "Assignment deactivated. You can now delete it permanently."
        );

        await fetchAllData();
      } catch (err) {
        console.error(
          "Deactivate before delete error:",
          err
        );

        setError(
          err.message ||
            "Unable to deactivate assignment."
        );
      } finally {
        setProcessingId(
          null
        );
      }

      return;
    }

    /*
     * Delete inactive assignment.
     */
    try {
      setProcessingId(
        assignment.id
      );

      setError("");
      setSuccess("");

      const response =
        await fetch(
          `${API_BASE}/teacher-assignments/${assignment.id}`,
          {
            method: "DELETE",
            headers,
          }
        );

      if (
        handleAuthError(response)
      ) {
        return;
      }

      const data =
        await response
          .json()
          .catch(() => ({}));

      /*
       * Backend requires deactivation.
       */
      if (
        response.status === 409 &&
        data.requiresDeactivation
      ) {
        setSuccess(
          "Please deactivate the assignment before deleting it."
        );

        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to delete teacher assignment."
        );
      }

      setSuccess(
        data.message ||
          "Teacher assignment deleted successfully."
      );

      if (
        editingAssignmentId ===
        assignment.id
      ) {
        resetForm();
      }

      await fetchAllData();
    } catch (err) {
      console.error(
        "Delete teacher assignment error:",
        err
      );

      setError(
        err.message ||
          "Unable to delete teacher assignment."
      );
    } finally {
      setProcessingId(
        null
      );
    }
  };


  /*
  |--------------------------------------------------------------------------
  | SELECTED CLASS SUBJECT
  |--------------------------------------------------------------------------
  */

  const selectedClassSubject =
    classSubjects.find(
      (item) =>
        String(item.id) ===
        String(
          form.class_subject_id
        )
    );


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
            ACADEMIC MANAGEMENT
          </p>

          <h1>
            Teacher Assignments
          </h1>

          <p className="heading-description">
            {editingAssignmentId
              ? "Update the teacher assignment."
              : "Assign teachers to classes, subjects, and semesters."}
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={fetchAllData}
          disabled={
            loading ||
            processingId !== null
          }
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


      {/* ASSIGNMENT FORM */}

      <div className="content-card registration-card">

        <div className="card-header">
          <div>
            <h2>
              {editingAssignmentId
                ? "Edit Teacher Assignment"
                : "Assign Teacher"}
            </h2>

            <p>
              {editingAssignmentId
                ? "Update the teacher, class subject, semester, or status."
                : "Select the teacher, class subject, and semester."}
            </p>
          </div>
        </div>


        {loading ? (
          <div className="loading-state">
            <div className="large-spinner" />

            <p>
              Loading assignment information...
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
          >

            {/* TEACHER */}

            <section className="form-section">

              <div className="form-section-heading">

                <div className="section-number">
                  01
                </div>

                <div>
                  <h2>
                    Teacher
                  </h2>

                  <p>
                    Choose the teacher who
                    will teach this subject.
                  </p>
                </div>

              </div>


              <div className="form-grid">

                <div className="form-field">

                  <label htmlFor="teacher_id">
                    Teacher{" "}
                    <span>*</span>
                  </label>

                  <select
                    id="teacher_id"
                    name="teacher_id"
                    value={
                      form.teacher_id
                    }
                    onChange={
                      handleInputChange
                    }
                    required
                  >

                    <option value="">
                      Select teacher
                    </option>

                    {teachers.map(
                      (teacher) => (
                        <option
                          key={
                            teacher.id
                          }
                          value={
                            teacher.id
                          }
                          disabled={
                            teacher.status ===
                            "inactive"
                          }
                        >
                          {
                            teacher.first_name
                          }{" "}
                          {
                            teacher.last_name
                          }{" "}
                          —{" "}
                          {
                            teacher.employee_number
                          }

                          {teacher.status ===
                            "inactive" &&
                            " (Inactive)"}
                        </option>
                      )
                    )}

                  </select>

                </div>

              </div>

            </section>


            {/* CLASS & SUBJECT */}

            <section className="form-section">

              <div className="form-section-heading">

                <div className="section-number">
                  02
                </div>

                <div>
                  <h2>
                    Class & Subject
                  </h2>

                  <p>
                    Select an existing
                    subject assigned to a
                    class.
                  </p>
                </div>

              </div>


              <div className="form-grid">

                <div className="form-field">

                  <label htmlFor="class_subject_id">
                    Class & Subject{" "}
                    <span>*</span>
                  </label>

                  <select
                    id="class_subject_id"
                    name="class_subject_id"
                    value={
                      form.class_subject_id
                    }
                    onChange={
                      handleInputChange
                    }
                    required
                  >

                    <option value="">
                      Select class and subject
                    </option>

                    {classSubjects.map(
                      (item) => (
                        <option
                          key={
                            item.id
                          }
                          value={
                            item.id
                          }
                        >
                          {
                            item.class_name
                          }{" "}
                          (
                          {
                            item.class_code
                          }
                          ) —{" "}
                          {
                            item.subject_name
                          }{" "}
                          (
                          {
                            item.subject_code
                          }
                          )
                        </option>
                      )
                    )}

                  </select>

                </div>


                {selectedClassSubject && (
                  <div className="form-field">

                    <label>
                      Selected Class
                    </label>

                    <input
                      type="text"
                      value={`${selectedClassSubject.class_name || ""} ${
                        selectedClassSubject.class_code
                          ? `(${selectedClassSubject.class_code})`
                          : ""
                      }`}
                      readOnly
                    />

                  </div>
                )}


                {selectedClassSubject && (
                  <div className="form-field">

                    <label>
                      Selected Subject
                    </label>

                    <input
                      type="text"
                      value={`${selectedClassSubject.subject_name || ""} ${
                        selectedClassSubject.subject_code
                          ? `(${selectedClassSubject.subject_code})`
                          : ""
                      }`}
                      readOnly
                    />

                  </div>
                )}

              </div>

            </section>


            {/* SEMESTER */}

            <section className="form-section">

              <div className="form-section-heading">

                <div className="section-number">
                  03
                </div>

                <div>
                  <h2>
                    Semester
                  </h2>

                  <p>
                    Choose the semester for
                    this teaching assignment.
                  </p>
                </div>

              </div>


              <div className="form-grid">

                <div className="form-field">

                  <label htmlFor="semester_id">
                    Semester{" "}
                    <span>*</span>
                  </label>

                  <select
                    id="semester_id"
                    name="semester_id"
                    value={
                      form.semester_id
                    }
                    onChange={
                      handleInputChange
                    }
                    required
                  >

                    <option value="">
                      Select semester
                    </option>

                    {semesters.map(
                      (semester) => (
                        <option
                          key={
                            semester.id
                          }
                          value={
                            semester.id
                          }
                        >
                          {
                            semester.name
                          }

                          {semester.academic_year
                            ? ` — ${semester.academic_year}`
                            : ""}
                        </option>
                      )
                    )}

                  </select>

                </div>


                {editingAssignmentId && (
                  <div className="form-field">

                    <label htmlFor="assignment-status">
                      Assignment Status
                    </label>

                    <select
                      id="assignment-status"
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
                )}

              </div>

            </section>


            {/* FORM ACTIONS */}

            <div className="form-actions">

              {editingAssignmentId && (
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

                    {editingAssignmentId
                      ? "Updating Assignment..."
                      : "Assigning Teacher..."}
                  </>
                ) : (
                  <>
                    ✓{" "}
                    {editingAssignmentId
                      ? "Update Assignment"
                      : "Assign Teacher"}
                  </>
                )}

              </button>

            </div>

          </form>
        )}

      </div>


      {/* CURRENT ASSIGNMENTS */}

      <section className="teacher-section">

        <div className="section-header">

          <div>

            <h2>
              Current Teacher Assignments
            </h2>

            <p>
              Teachers currently assigned
              to class subjects.
            </p>

          </div>

        </div>


        {loading ? (

          <div className="empty-state">
            Loading assignments...
          </div>

        ) : assignments.length ===
          0 ? (

          <div className="empty-state">
            No teacher assignments have
            been created yet.
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
                    Class
                  </th>

                  <th>
                    Subject
                  </th>

                  <th>
                    Semester
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

                {assignments.map(
                  (
                    assignment,
                    index
                  ) => {

                    const isProcessing =
                      processingId ===
                      assignment.id;

                    const employeeNumber =
                      teachers.find(
                        (teacher) =>
                          String(
                            teacher.id
                          ) ===
                          String(
                            assignment.teacher_id
                          )
                      )
                        ?.employee_number ||
                      "—";

                    const isInactive =
                      assignment.status ===
                      "inactive";

                    return (
                      <tr
                        key={
                          assignment.id ||
                          index
                        }
                      >

                        <td>

                          <strong>
                            {assignment.teacher_name ||
                              "—"}
                          </strong>

                        </td>


                        <td>
                          {
                            employeeNumber
                          }
                        </td>


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


                        {/* STATUS */}

                        <td>

                          <span
                            className={
                              isInactive
                                ? "status-inactive"
                                : "status-active"
                            }
                          >
                            {isInactive
                              ? "inactive"
                              : "active"}
                          </span>

                        </td>


                        {/* ACTIONS */}

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
                                  assignment
                                )
                              }
                              disabled={
                                isProcessing
                              }
                            >
                              Edit
                            </button>


                            {/* ACTIVATE */}

                            {isInactive ? (

                              <button
                                type="button"
                                className="secondary-button"
                                onClick={() =>
                                  handleStatusChange(
                                    assignment,
                                    "active"
                                  )
                                }
                                disabled={
                                  isProcessing
                                }
                              >
                                {isProcessing
                                  ? "Processing..."
                                  : "Activate"}
                              </button>

                            ) : (

                              /* DEACTIVATE */

                              <button
                                type="button"
                                className="secondary-button"
                                onClick={() =>
                                  handleStatusChange(
                                    assignment,
                                    "inactive"
                                  )
                                }
                                disabled={
                                  isProcessing
                                }
                              >
                                {isProcessing
                                  ? "Processing..."
                                  : "Deactivate"}
                              </button>

                            )}


                            {/* DELETE */}

                            <button
                              type="button"
                              className="delete-button"
                              onClick={() =>
                                handleDelete(
                                  assignment
                                )
                              }
                              disabled={
                                isProcessing
                              }
                            >

                              {isProcessing
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

export default TeacherAssignmentManagement;