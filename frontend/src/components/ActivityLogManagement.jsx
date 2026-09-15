import { useEffect, useState } from "react";

const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/activity-logs`;

function ActivityLogManagement({ auth }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchLogs = async () => {
    if (!auth?.token) {
      setError("You are not authenticated.");
      setLoading(false);
      return;
    }

    if (auth.user?.role !== "admin") {
      setError("Access denied. Only administrators can view activity logs.");
      setLoading(false);
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
          data.message || "Failed to fetch activity logs."
        );
      }

      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch activity logs:", err);

      setError(
        err.message || "Failed to load activity logs."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [auth]);

  if (auth?.user?.role !== "admin") {
    return (
      <div className="content-card">
        <div className="empty-state">
          <h3>Access Denied</h3>
          <p>
            Only administrators can view activity logs.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="content-card">
      <div className="content-card-header">
        <div>
          <h2>Activity Logs</h2>
          <p>
            Monitor important administrator actions across the system.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={fetchLogs}
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="empty-state">
          Loading activity logs...
        </div>
      ) : logs.length === 0 ? (
        <div className="empty-state">
          <h3>No activity logs found</h3>
          <p>
            Administrator activity will appear here when actions are recorded.
          </p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Administrator</th>
                <th>Action</th>
                <th>Module</th>
                <th>Description</th>
                <th>Record ID</th>
                <th>IP Address</th>
              </tr>
            </thead>

            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>
                    {log.created_at
                      ? new Date(log.created_at).toLocaleString()
                      : "—"}
                  </td>

                  <td>
                    <strong>
                      {log.user_name || "Administrator"}
                    </strong>

                    <div
                      style={{
                        fontSize: "12px",
                        opacity: 0.7,
                        marginTop: "3px",
                      }}
                    >
                      {log.user_email || "—"}
                    </div>
                  </td>

                  <td>
                    <span className="status-active">
                      {log.action || "—"}
                    </span>
                  </td>

                  <td>
                    {log.module || "—"}
                  </td>

                  <td>
                    {log.description || "—"}
                  </td>

                  <td>
                    {log.record_id ?? "—"}
                  </td>

                  <td>
                    {log.ip_address || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ActivityLogManagement;
