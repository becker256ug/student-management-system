import { useEffect, useMemo, useState } from "react";

const API_URL = "http://localhost:5000/api/subjects";

const emptyForm = {
  name: "",
  code: "",
  description: "",
  status: "active",
};

function SubjectManagement({ auth }) {
  const [subjects, setSubjects] = useState([]);

  const [form, setForm] = useState(emptyForm);

  const [editingId, setEditingId] = useState(null);

  const [showForm, setShowForm] = useState(false);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  /*
  =========================================================
  LOAD COURSE UNITS
  =========================================================
  */
  const fetchSubjects = async () => {
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
          data.message ||
            "Failed to fetch course units."
        );
      }

      setSubjects(
        Array.isArray(data) ? data : []
      );
    } catch (err) {
      console.error(
        "Failed to fetch course units:",
        err
      );

      setError(
        err.message ||
          "Failed to load course units."
      );
    } finally {
      setLoading(false);
    }
  };

  /*
  =========================================================
  LOAD DATA WHEN COMPONENT OPENS
  =========================================================
  */
  useEffect(() => {
    fetchSubjects();
  }, [auth?.token]);

  /*
  =========================================================
  FORM INPUT
  =========================================================
  */
  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  /*
  =========================================================
  OPEN ADD FORM
  =========================================================
  */
  const openAddForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  /*
  =========================================================
  OPEN EDIT FORM
  =========================================================
  */
  const openEditForm = (subject) => {
    setForm({
      name: subject.name || "",
      code: subject.code || "",
      description:
        subject.description || "",
      status:
        subject.status || "active",
    });

    setEditingId(subject.id);
    setShowForm(true);

    setError("");
    setSuccess("");
  };

  /*
  =========================================================
  CLOSE FORM
  =========================================================
  */
  const closeForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setError("");
  };

  /*
  =========================================================
  CREATE COURSE UNIT
  =========================================================
  */
  const handleCreate = async (event) => {
    event.preventDefault();

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({
          name: form.name.trim(),
          code: form.code.trim().toUpperCase(),
          description:
            form.description.trim(),
          status: form.status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to create course unit."
        );
      }

      setSuccess(
        data.message ||
          "Course unit created successfully."
      );

      setForm(emptyForm);
      setShowForm(false);

      await fetchSubjects();
    } catch (err) {
      console.error(
        "Create course unit error:",
        err
      );

      setError(
        err.message ||
          "Failed to create course unit."
      );
    } finally {
      setSubmitting(false);
    }
  };

  /*
  =========================================================
  UPDATE COURSE UNIT
  =========================================================
  */
  const handleUpdate = async (event) => {
    event.preventDefault();

    if (!editingId) {
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_URL}/${editingId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth.token}`,
          },
          body: JSON.stringify({
            name: form.name.trim(),
            code: form.code.trim().toUpperCase(),
            description:
              form.description.trim(),
            status: form.status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update course unit."
        );
      }

      setSuccess(
        data.message ||
          "Course unit updated successfully."
      );

      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);

      await fetchSubjects();
    } catch (err) {
      console.error(
        "Update course unit error:",
        err
      );

      setError(
        err.message ||
          "Failed to update course unit."
      );
    } finally {
      setSubmitting(false);
    }
  };

  /*
  =========================================================
  ACTIVATE / DEACTIVATE
  =========================================================
  */
  const handleStatusChange = async (subject) => {
    const currentStatus =
      String(
        subject.status || "active"
      ).toLowerCase();

    const newStatus =
      currentStatus === "active"
        ? "inactive"
        : "active";

    const action =
      newStatus === "active"
        ? "activate"
        : "deactivate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} "${subject.name}"?`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_URL}/${subject.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth.token}`,
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            `Failed to ${action} course unit.`
        );
      }

      setSuccess(
        data.message ||
          `Course unit ${action}d successfully.`
      );

      await fetchSubjects();
    } catch (err) {
      console.error(
        "Course unit status error:",
        err
      );

      setError(
        err.message ||
          `Failed to ${action} course unit.`
      );
    }
  };

  /*
  =========================================================
  DELETE COURSE UNIT
  =========================================================
  */
  const handleDelete = async (subject) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${subject.name}"?\n\nThis cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_URL}/${subject.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to delete course unit."
        );
      }

      setSuccess(
        data.message ||
          "Course unit deleted successfully."
      );

      await fetchSubjects();
    } catch (err) {
      console.error(
        "Delete course unit error:",
        err
      );

      setError(
        err.message ||
          "Failed to delete course unit."
      );
    }
  };

  /*
  =========================================================
  SEARCH
  =========================================================
  */
  const filteredSubjects = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    if (!query) {
      return subjects;
    }

    return subjects.filter((subject) => {
      const values = [
        subject.name,
        subject.code,
        subject.description,
        subject.status,
      ];

      return values.some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [subjects, search]);

  return (
    <div className="content-card">
      {/* =================================================
          HEADER
      ================================================= */}
      <div className="content-card-header">
        <div>
          <h2>Course Units</h2>

          <p>
            Manage subjects and course units used
            throughout the academic system.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={openAddForm}
        >
          + Add Course Unit
        </button>
      </div>

      {/* =================================================
          ALERTS
      ================================================= */}
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}

      {/* =================================================
          FORM
      ================================================= */}
      {showForm && (
        <form
          className="student-form"
          onSubmit={
            editingId
              ? handleUpdate
              : handleCreate
          }
        >
          <div className="content-card-header">
            <div>
              <h2>
                {editingId
                  ? "Edit Course Unit"
                  : "Add Course Unit"}
              </h2>

              <p>
                {editingId
                  ? "Update the course unit information."
                  : "Create a new course unit."}
              </p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>
                Course Unit Name
              </label>

              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleInputChange}
                required
                placeholder="e.g. Mathematics"
              />
            </div>

            <div className="form-group">
              <label>
                Course Unit Code
              </label>

              <input
                type="text"
                name="code"
                value={form.code}
                onChange={handleInputChange}
                required
                placeholder="e.g. MATH"
              />
            </div>

            <div className="form-group">
              <label>
                Status
              </label>

              <select
                name="status"
                value={form.status}
                onChange={handleInputChange}
              >
                <option value="active">
                  Active
                </option>

                <option value="inactive">
                  Inactive
                </option>
              </select>
            </div>

            <div className="form-group form-group-full">
              <label>
                Description
              </label>

              <textarea
                name="description"
                value={form.description}
                onChange={handleInputChange}
                rows="3"
                placeholder="Optional description of this course unit"
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="primary-button"
              disabled={submitting}
            >
              {submitting
                ? "Saving..."
                : editingId
                ? "Update Course Unit"
                : "Add Course Unit"}
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={closeForm}
              disabled={submitting}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* =================================================
          SEARCH
      ================================================= */}
      <div className="search-row">
        <input
          type="text"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="Search by course unit name, code..."
        />
      </div>

      {/* =================================================
          TABLE
      ================================================= */}
      {loading ? (
        <div className="empty-state">
          Loading course units...
        </div>
      ) : filteredSubjects.length === 0 ? (
        <div className="empty-state">
          {subjects.length === 0
            ? "No course units have been created yet."
            : "No matching course units found."}
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Course Unit</th>
                <th>Code</th>
                <th>Description</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredSubjects.map(
                (subject) => {
                  const status =
                    String(
                      subject.status ||
                        "active"
                    ).toLowerCase();

                  return (
                    <tr
                      key={subject.id}
                    >
                      <td>
                        <strong>
                          {subject.name}
                        </strong>
                      </td>

                      <td>
                        {subject.code}
                      </td>

                      <td>
                        {subject.description ||
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
                            gap: "8px",
                            flexWrap:
                              "wrap",
                          }}
                        >
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() =>
                              openEditForm(
                                subject
                              )
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() =>
                              handleStatusChange(
                                subject
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
                              handleDelete(
                                subject
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
  );
}

export default SubjectManagement;