const bcrypt = require("bcryptjs");
const db = require("./config/db");

const name = "Administrator";
const email = "admin@school.com";
const plainPassword = "Admin@2026";
const role = "admin";

async function createAdmin() {
  try {
    // Check whether the admin already exists
    const [existingUsers] = await db.query(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (existingUsers.length > 0) {
      console.log("Admin user already exists.");
      process.exit(0);
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Insert admin into the existing users table
    const [result] = await db.query(
      `
        INSERT INTO users
          (name, email, password_hash, role, status)
        VALUES
          (?, ?, ?, ?, 'active')
      `,
      [name, email, hashedPassword, role]
    );

    console.log("✅ Admin created successfully!");
    console.log("ID:", result.insertId);
    console.log("Email:", email);
    console.log("Password:", plainPassword);
    console.log("Role:", role);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin:", error.message);
    process.exit(1);
  }
}

createAdmin();
