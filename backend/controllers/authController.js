const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

const {
  createActivityLog,
} = require("./activityLogController");

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required",
    });
  }

  try {
    const [rows] = await db.query(
      "SELECT id, name, email, password_hash, role, status FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const user = rows[0];

    if (user.status !== "active") {
      return res.status(403).json({
        message: "Your account is inactive",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured");

      return res.status(500).json({
        message: "Server configuration error",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "8h",
      }
    );

    /*
     * Record administrator login activity.
     *
     * Only users with the admin role are logged.
     * Teacher and student logins are not added to
     * the administrator activity log.
     */
    if (user.role === "admin") {
      await createActivityLog({
        userId: user.id,
        action: "LOGIN",
        module: "Authentication",
        description: "Administrator logged in",
        recordId: user.id,
        ipAddress:
          req.headers["x-forwarded-for"] ||
          req.socket.remoteAddress ||
          null,
      });
    }

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(
      "Login database/authentication error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  login,
};