const bcrypt = require("bcryptjs");
const db = require("./config/db");

const name = "Administrator";
const email = "admin@school.com";
const plainPassword = "Admin@2026";
const role = "admin";

async function createAdmin() {
  try {
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const sql = `
      INSERT INTO users (name, email, password, role)
      VALUES (?, ?, ?, ?)
    `;

    db.query(
      sql,
      [name, email, hashedPassword, role],
      (err, result) => {
        if (err) {
          console.error("Error creating admin:", err);
          process.exit(1);
        }

        console.log("Admin created successfully!");
        console.log("Email:", email);
        console.log("Password:", plainPassword);
        console.log("Role:", role);

        process.exit(0);
      }
    );
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

createAdmin();