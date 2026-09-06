const express = require("express");
const cors = require("cors");

require("dotenv").config();

const studentRoutes = require("./routes/studentRoutes");
const authRoutes = require("./routes/authRoutes");
const teacherRoutes = require("./routes/teacherRoutes");
const classRoutes = require("./routes/classRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const academicYearRoutes = require("./routes/academicYearRoutes");
const semesterRoutes = require("./routes/semesterRoutes");
const enrollmentRoutes = require("./routes/enrollmentRoutes");
const classSubjectRoutes = require("./routes/classSubjectRoutes");
const teacherAssignmentRoutes = require("./routes/teacherAssignmentRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const resultRoutes = require("./routes/resultRoutes");
const feeTypeRoutes = require("./routes/feeTypeRoutes");
const studentFeeRoutes = require("./routes/studentFeeRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const timetableRoutes = require("./routes/timetableRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/students", studentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/academic-years", academicYearRoutes);
app.use("/api/semesters", semesterRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/class-subjects", classSubjectRoutes);
app.use("/api/teacher-assignments", teacherAssignmentRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/fee-types", feeTypeRoutes);
app.use("/api/student-fees", studentFeeRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/timetables", timetableRoutes);


app.get("/", (req, res) => {
  res.json({
    message: "Student Management API is running",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});