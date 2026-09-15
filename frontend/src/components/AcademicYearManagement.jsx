import { useEffect, useState } from "react";

const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/academic-years`;

function AcademicYearManagement({ auth }) {
  const [academicYears, setAcademicYears] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    name: "",
    start_date: "",
    end_date: "",
    status: "active",
  });

  /*
  |--------------------------------------------------------------------------
  | FETCH ACADEMIC YEARS
  |--------------------------------------------------------------------------
  */

  const fetchAcademicYears = async () => {
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
          data.message || "Failed to fetch academic years."
        );
      }

      setAcademicYears(
        Array.isArray(data) ? data : []
      );
    } catch (err) {
      console.error(
        "Failed to fetch academic years:",
        err
      );

      setError(
        err.message ||
          "Failed to load academic years."
      );
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | LOAD DATA
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    fetchAcademicYears();
  }, [auth]);

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
  | OPEN FORM
  |--------------------------------------------------------------------------
  */

  const openForm = () => {
    setForm({
      name: "",
      start_date: "",
      end_date: "",
      status: "active",
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  };

  /*
  |--------------------------------------------------------------------------
  | CANCEL FORM
  |--------------------------------------------------------------------------
  */

  const cancelForm = () => {
    setForm({
      name: "",
      start_date: "",
      end_date: "",
      status: "active",
    });

    setError("");
    setShowForm(false);
  };

  /*
  |--------------------------------------------------------------------------
  | CREATE ACADEMIC YEAR
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!auth?.token) {
      setError("You are not authenticated.");
      return;
    }

    if (!form.name.trim()) {
      setError("Academic year name is required.");
      return;
    }

    if (!form.start_date) {
      setError("Start date is required.");
      return;
    }

    if (!form.end_date) {
      setError("End date is required.");
      return;
    }

    if (form.end_date < form.start_date) {
      setError(
        "End date cannot be earlier than the start date."
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(API_URL, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          Authorization:
            `Bearer ${auth.token}`,
        },

        body: JSON.stringify({
          name: form.name.trim(),
          start_date: form.start_date,
          end_date: form.end_date,
          status: form.status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to create academic year."
        );
      }

      setSuccess(
        data.message ||
          "Academic year created successfully."
      );

      setForm({
        name: "",
        start_date: "",
        end_date: "",
        status: "active",
      });

      setShowForm(false);

      await fetchAcademicYears();
    } catch (err) {
      console.error(
        "Failed to create academic year:",
        err
      );

      setError(
        err.message ||
          "Failed to create academic year."
      );
    } finally {
      setSaving(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | CURRENT ACTIVE YEAR
  |--------------------------------------------------------------------------
  */

  const activeAcademicYear =
    academicYears.find(
      (academicYear) =>
        String(
          academicYear.status || ""
        ).toLowerCase() === "active"
    );

  return (
    <div>

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="content-card">

        <div className="content-card-header">

          <div>

            <h2>
              Academic Years
            </h2>

            <p>
              Create and manage academic years for the school.
            </p>

          </div>

          <button
            type="button"
            className="primary-button"
            onClick={openForm}
          >
            + Add Academic Year
          </button>

        </div>

        {/* =====================================================
            ALERTS
        ====================================================== */}

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

        {/* =====================================================
            ACTIVE ACADEMIC YEAR
        ====================================================== */}

        {activeAcademicYear && (
          <div
            style={{
              marginBottom: "24px",
              padding: "18px",
              borderRadius: "12px",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >

            <div>

              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "#15803d",
                  marginBottom: "4px",
                }}
              >
                Current Academic Year
              </div>

              <strong
                style={{
                  fontSize: "20px",
                  color: "#166534",
                }}
              >
                {activeAcademicYear.name}
              </strong>

            </div>

            <span className="status-active">
              Active
            </span>

          </div>
        )}

        {/* =====================================================
            FORM
        ====================================================== */}

        {showForm && (
          <form
            onSubmit={handleSubmit}
            style={{
              marginBottom: "28px",
              padding: "24px",
              borderRadius: "12px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
            }}
          >

            <h3
              style={{
                marginTop: 0,
                marginBottom: "20px",
              }}
            >
              Add Academic Year
            </h3>

            <div className="form-grid">

              <div className="form-group">

                <label>
                  Academic Year
                </label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  placeholder="e.g. 2026/2027"
                  required
                />

              </div>

              <div className="form-group">

                <label>
                  Status
                </label>

                <select
                  name="status"
                  value={form.status}
                  onChange={handleFormChange}
                >

                  <option value="active">
                    Active
                  </option>

                  <option value="inactive">
                    Inactive
                  </option>

                </select>

              </div>

              <div className="form-group">

                <label>
                  Start Date
                </label>

                <input
                  type="date"
                  name="start_date"
                  value={form.start_date}
                  onChange={handleFormChange}
                  required
                />

              </div>

              <div className="form-group">

                <label>
                  End Date
                </label>

                <input
                  type="date"
                  name="end_date"
                  value={form.end_date}
                  onChange={handleFormChange}
                  required
                />

              </div>

            </div>

            <div
              className="form-actions"
              style={{
                marginTop: "20px",
              }}
            >

              <button
                type="submit"
                className="primary-button"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : "Save Academic Year"}
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={cancelForm}
                disabled={saving}
              >
                Cancel
              </button>

            </div>

          </form>
        )}

        {/* =====================================================
            ACADEMIC YEAR LIST
        ====================================================== */}

        {loading ? (
          <div className="empty-state">
            Loading academic years...
          </div>
        ) : academicYears.length === 0 ? (
          <div className="empty-state">

            <div className="empty-icon">
              ▣
            </div>

            <h3>
              No academic years found
            </h3>

            <p>
              Create your first academic year to get started.
            </p>

            <button
              type="button"
              className="primary-button"
              onClick={openForm}
            >
              + Add Academic Year
            </button>

          </div>
        ) : (
          <div className="table-wrapper">

            <table>

              <thead>

                <tr>

                  <th>
                    Academic Year
                  </th>

                  <th>
                    Start Date
                  </th>

                  <th>
                    End Date
                  </th>

                  <th>
                    Status
                  </th>

                </tr>

              </thead>

              <tbody>

                {academicYears.map(
                  (academicYear) => {

                    const status =
                      String(
                        academicYear.status ||
                          "inactive"
                      ).toLowerCase();

                    return (
                      <tr
                        key={
                          academicYear.id
                        }
                      >

                        <td>
                          <strong>
                            {
                              academicYear.name
                            }
                          </strong>
                        </td>

                        <td>
                          {academicYear.start_date
                            ? String(
                                academicYear.start_date
                              ).split("T")[0]
                            : "—"}
                        </td>

                        <td>
                          {academicYear.end_date
                            ? String(
                                academicYear.end_date
                              ).split("T")[0]
                            : "—"}
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

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
}

export default AcademicYearManagement;
