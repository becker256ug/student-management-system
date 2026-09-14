const pool = require("../config/db");

/*
 * Create an activity log
 *
 * This helper is used by other controllers to record
 * important system actions.
 */
const createActivityLog = async ({
  userId,
  action,
  module,
  description,
  recordId = null,
  ipAddress = null,
}) => {
  try {
    await pool.execute(
      `
        INSERT INTO activity_logs
        (
          user_id,
          action,
          module,
          description,
          record_id,
          ip_address
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        userId,
        action,
        module,
        description,
        recordId,
        ipAddress,
      ]
    );
  } catch (error) {
    /*
     * Activity logging should never break the main
     * StudentHub operation if logging itself fails.
     */
    console.error(
      "Activity log creation failed:",
      error.message
    );
  }
};

/*
 * Get activity logs
 *
 * ADMIN ONLY
 */
const getActivityLogs = async (req, res) => {
  try {
    const [logs] = await pool.execute(`
      SELECT
        al.id,
        al.user_id,
        u.name AS user_name,
        u.email AS user_email,
        al.action,
        al.module,
        al.description,
        al.record_id,
        al.ip_address,
        al.created_at
      FROM activity_logs al
      INNER JOIN users u
        ON al.user_id = u.id
      ORDER BY al.created_at DESC
    `);

    res.json(logs);
  } catch (error) {
    console.error(
      "Get activity logs error:",
      error.message
    );

    res.status(500).json({
      message: "Failed to retrieve activity logs",
    });
  }
};

module.exports = {
  createActivityLog,
  getActivityLogs,
};