require("dotenv").config();

const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const { connectRedis } = require("./config/redis");

const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const teacherRoutes = require("./routes/teacherRoutes");
const teacherAssignmentRoutes = require("./routes/teacherAssignmentRoutes");
const classRoutes = require("./routes/classRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const classSubjectRoutes = require("./routes/classSubjectRoutes");
const enrollmentRoutes = require("./routes/enrollmentRoutes");
const academicYearRoutes = require("./routes/academicYearRoutes");
const semesterRoutes = require("./routes/semesterRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const resultRoutes = require("./routes/resultRoutes");
const feeTypeRoutes = require("./routes/feeTypeRoutes");
const studentFeeRoutes = require("./routes/studentFeeRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const timetableRoutes = require("./routes/timetableRoutes");
const activityLogRoutes = require("./routes/activityLogRoutes");
const studentPortalRoutes = require("./routes/studentPortalRoutes");

const app = express();

const PORT = process.env.PORT || 5000;

/*
 * ---------------------------------------------------------
 * CORS
 * ---------------------------------------------------------
 */

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

/*
 * ---------------------------------------------------------
 * BODY PARSING
 * ---------------------------------------------------------
 */

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

/*
 * ---------------------------------------------------------
 * GENERAL API RATE LIMITER
 * ---------------------------------------------------------
 *
 * Protects the API from excessive requests.
 *
 * 300 requests per 15 minutes per IP.
 *
 * Login has its own stricter limiter in authRoutes.js.
 */

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    message:
      "Too many requests from this IP. Please try again later.",
  },

  skip: (req) => {
    /*
     * Login has a stricter dedicated limiter.
     * Do not apply the general limiter to login.
     */
    return req.path === "/auth/login";
  },
});

/*
 * Apply the general limiter to all API requests.
 */
app.use("/api", apiLimiter);

/*
 * ---------------------------------------------------------
 * API ROUTES
 * ---------------------------------------------------------
 */

app.use("/api/auth", authRoutes);

app.use("/api/students", studentRoutes);

app.use("/api/teachers", teacherRoutes);

app.use(
  "/api/teacher-assignments",
  teacherAssignmentRoutes
);

app.use("/api/classes", classRoutes);

app.use("/api/subjects", subjectRoutes);

app.use("/api/class-subjects", classSubjectRoutes);

app.use("/api/enrollments", enrollmentRoutes);

app.use("/api/academic-years", academicYearRoutes);

app.use("/api/semesters", semesterRoutes);

app.use("/api/attendance", attendanceRoutes);

app.use("/api/results", resultRoutes);

app.use("/api/fee-types", feeTypeRoutes);

app.use("/api/student-fees", studentFeeRoutes);

app.use("/api/payments", paymentRoutes);

app.use("/api/timetables", timetableRoutes);
app.use("/api/activity-logs", activityLogRoutes);
app.use("/api/student-portal", studentPortalRoutes);

/*
 * ---------------------------------------------------------
 * HEALTH CHECK
 * ---------------------------------------------------------
 */

app.get("/", (req, res) => {
  res.json({
    message: "StudentHub API is running",
    status: "OK",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    message: "StudentHub API is healthy",
    status: "OK",
  });
});

/*
 * ---------------------------------------------------------
 * 404 HANDLER
 * ---------------------------------------------------------
 */

app.use((req, res) => {
  res.status(404).json({
    message: "API endpoint not found",
  });
});

/*
 * ---------------------------------------------------------
 * GLOBAL ERROR HANDLER
 * ---------------------------------------------------------
 */

app.use((err, req, res, next) => {
  console.error("Server error:", err);

  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

/*
 * ---------------------------------------------------------
 * START SERVER
 * ---------------------------------------------------------
 */

const startServer = async () => {
  try {
    /*
     * Connect to Redis before starting the server.
     */
    await connectRedis();

    app.listen(PORT, () => {
      console.log(`StudentHub backend running on port ${PORT}`);
      console.log(
        `StudentHub API: http://localhost:${PORT}/api`
      );
    });
  } catch (error) {
    console.error(
      "Failed to start StudentHub server:",
      error.message
    );
  }
};

startServer();