import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api/classes";

const emptyForm = {
  name: "",
  code: "",
  description: "",
  status: "active",
};

function ClassManagement({ auth }) {
  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState(emptyForm);

  const [editingClassId, setEditingClassId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [statusChangingId, setStatusChangingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = auth?.token;

  /*
  |--------------------------------------------------------------------------
  | LOAD CLASSES
  |--------------------------------------------------------------------------
  */
  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load classes.");
      }

      setClasses(data);
    } catch (err) {
      console.error("Fetch classes error:", err);
      setError(err.message || "Failed to load classes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchClasses();
    }
  }, [token]);

  /*
  |--------------------------------------------------------------------------
  | FORM CHANGE
  |--------------------------------------------------------------------------
  */
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | START EDITING
  |--------------------------------------------------------------------------
  */
  const handleEdit = (classItem) => {
    setEditingClassId(classItem.id);

    setForm({
      name: classItem.name || "",
      code: classItem.code || "",
      description: classItem.description || "",
      status: classItem.status || "active",
    });

    setError("");
    setSuccess("");

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
    setEditingClassId(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
  };

  /*
  |--------------------------------------------------------------------------
  | CREATE / UPDATE CLASS
  |--------------------------------------------------------------------------
  */
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!form.name.trim() || !form.code.trim()) {
      setError("Class name and code are required.");
      return;
    }

    try {
      setSaving(true);

      const url = editingClassId
        ? `${API_URL}/${editingClassId}`
        : API_URL;

      const method = editingClassId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name.trim(),
          code: form.code.trim(),
          description: form.description.trim(),
          status: form.status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            (editingClassId
              ? "Failed to update class."
              : "Failed to create class.")
        );
      }

      setSuccess(
        editingClassId
          ? "Class updated successfully."
          : "Class created successfully."
      );

      setEditingClassId(null);
      setForm(emptyForm);

      await fetchClasses();
    } catch (err) {
      console.error("Save class error:", err);
      setError(err.message || "Failed to save class.");
    } finally {
      setSaving(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | ACTIVATE / DEACTIVATE
  |--------------------------------------------------------------------------
  */
  const handleStatusChange = async (classItem) => {
    const isActive = classItem.status === "active";

    const action = isActive ? "deactivate" : "activate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} "${classItem.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setStatusChangingId(classItem.id);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/${classItem.id}/${action}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            `Failed to ${action} class.`
        );
      }

      setSuccess(data.message || `Class ${action}d successfully.`);

      await fetchClasses();
    } catch (err) {
      console.error("Change class status error:", err);
      setError(
        err.message ||
          `Failed to ${action} class.`
      );
    } finally {
      setStatusChangingId(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | DELETE CLASS
  |--------------------------------------------------------------------------
  */
  const handleDelete = async (classItem) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${classItem.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(classItem.id);
      setError("");
      setSuccess("");

      let response = await fetch(
        `${API_URL}/${classItem.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      let data = await response.json();

      /*
      |--------------------------------------------------------------------------
      | CLASS HAS RELATED RECORDS
      |--------------------------------------------------------------------------
      */
      if (
        response.status === 409 &&
        data.requiresDeactivation
      ) {
        const deactivateNow = window.confirm(
          "This class has related subject records and cannot be permanently deleted while active.\n\nDo you want to deactivate this class now?"
        );

        if (deactivateNow) {
          const deactivateResponse = await fetch(
            `${API_URL}/${classItem.id}/deactivate`,
            {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          const deactivateData =
            await deactivateResponse.json();

          if (!deactivateResponse.ok) {
            throw new Error(
              deactivateData.message ||
                "Failed to deactivate class."
            );
          }

          setSuccess(
            "Class deactivated successfully. It has been preserved because it has related records."
          );

          await fetchClasses();
          return;
        }

        setError(data.message || "Class cannot be deleted.");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to delete class."
        );
      }

      setSuccess(
        data.message || "Class deleted successfully."
      );

      await fetchClasses();
    } catch (err) {
      console.error("Delete class error:", err);
      setError(
        err.message || "Failed to delete class."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="management-page">
      <div className="page-header">
        <div>
          <h1>Class Management</h1>
          <p>
            Create, edit, activate, deactivate and manage
            school classes.
          </p>
        </div>
      </div>

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

      {/* FORM */}
      <div className="management-card">
        <div className="card-header">
          <div>
            <h2>
              {editingClassId
                ? "Edit Class"
                : "Register New Class"}
            </h2>

            <p>
              {editingClassId
                ? "Update the class information below."
                : "Enter the details for the new class."}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Class Name</label>

              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Senior One"
              />
            </div>

            <div className="form-group">
              <label>Class Code</label>

              <input
                type="text"
                name="code"
                value={form.code}
                onChange={handleChange}
                placeholder="e.g. S1"
              />
            </div>

            <div className="form-group form-group-full">
              <label>Description</label>

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Enter class description"
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>Status</label>

              <select
                name="status"
                value={form.status}
                onChange={handleChange}
              >
                <option value="active">
                  Active
                </option>

                <option value="inactive">
                  Inactive
                </option>
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="primary-button"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingClassId
                ? "Update Class"
                : "Create Class"}
            </button>

            {editingClassId && (
              <button
                type="button"
                className="secondary-button"
                onClick={handleCancelEdit}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* CLASS LIST */}
      <div className="management-card">
        <div className="card-header">
          <div>
            <h2>Classes</h2>

            <p>
              {classes.length} class
              {classes.length !== 1 ? "es" : ""} registered
            </p>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            Loading classes...
          </div>
        ) : classes.length === 0 ? (
          <div className="empty-state">
            No classes have been registered yet.
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="management-table">
              <thead>
                <tr>
                  <th>Class Name</th>
                  <th>Code</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {classes.map((classItem) => {
                  const isActive =
                    classItem.status === "active";

                  return (
                    <tr key={classItem.id}>
                      <td>
                        <strong>
                          {classItem.name}
                        </strong>
                      </td>

                      <td>
                        {classItem.code}
                      </td>

                      <td>
                        {classItem.description ||
                          "—"}
                      </td>

                      <td>
                        <span
                          className={`status-badge ${
                            isActive
                              ? "status-active"
                              : "status-inactive"
                          }`}
                        >
                          {isActive
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>

                      <td>
                        <div className="action-buttons">
                          <button
                            type="button"
                            className="action-button edit-button"
                            onClick={() =>
                              handleEdit(classItem)
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className={`action-button ${
                              isActive
                                ? "deactivate-button"
                                : "activate-button"
                            }`}
                            onClick={() =>
                              handleStatusChange(
                                classItem
                              )
                            }
                            disabled={
                              statusChangingId ===
                              classItem.id
                            }
                          >
                            {statusChangingId ===
                            classItem.id
                              ? "..."
                              : isActive
                              ? "Deactivate"
                              : "Activate"}
                          </button>

                          <button
                            type="button"
                            className="action-button delete-button"
                            onClick={() =>
                              handleDelete(classItem)
                            }
                            disabled={
                              deletingId ===
                              classItem.id
                            }
                          >
                            {deletingId ===
                            classItem.id
                              ? "Deleting..."
                              : "Delete"}
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
      </div>
    </div>
  );
}

export default ClassManagement;