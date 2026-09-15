import { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const STATUS_OPTIONS = [
  "present",
  "absent",
  "late",
  "excused",
];

function TeacherAttendance({ auth, onLogout }) {
  const [assignments, setAssignments] = useState([]);

  const [selectedAssignment, setSelectedAssignment] =
    useState("");

  const [attendanceDate, setAttendanceDate] =
    useState(getToday());

  const [students, setStudents] = useState([]);

  const [attendance, setAttendance] = useState({});

  const [loadingAssignments, setLoadingAssignments] =
    useState(true);

  const [loadingStudents, setLoadingStudents] =
    useState(false);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Authentication headers
  |--------------------------------------------------------------------------
  */
  const getHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${auth?.token}`,
  });

  /*
  |--------------------------------------------------------------------------
  | Load teacher assignments
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    const loadAssignments = async () => {
      if (!auth?.token) {
        return;
      }

      try {
        setLoadingAssignments(true);
        setError("");

        const response = await fetch(
          `${API_BASE}/teacher-assignments`,
          {
            method: "GET",
            headers: getHeaders(),
          }
        );

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          onLogout();
          return;
        }

        const data = await response
          .json()
          .catch(() => []);

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to load your teaching assignments."
          );
        }

        const assignmentList = Array.isArray(data)
          ? data
          : data.assignments ||
            data.data ||
            [];

        setAssignments(assignmentList);

        /*
        |--------------------------------------------------------------------------
        | Automatically select first assignment
        |--------------------------------------------------------------------------
        */
        if (
          assignmentList.length > 0 &&
          !selectedAssignment
        ) {
          setSelectedAssignment(
            String(assignmentList[0].id)
          );
        }
      } catch (err) {
        console.error(
          "Load teacher assignments error:",
          err
        );

        setError(
          err.message ||
            "Unable to load teaching assignments."
        );
      } finally {
        setLoadingAssignments(false);
      }
    };

    loadAssignments();
  }, [auth?.token]);

  /*
  |--------------------------------------------------------------------------
  | Currently selected assignment
  |--------------------------------------------------------------------------
  */
  const selectedAssignmentData = useMemo(() => {
    if (!selectedAssignment) {
      return null;
    }

    return (
      assignments.find(
        (assignment) =>
          String(assignment.id) ===
          String(selectedAssignment)
      ) || null
    );
  }, [
    assignments,
    selectedAssignment,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Load students whenever assignment or date changes
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    const loadStudents = async () => {
      if (
        !selectedAssignmentData ||
        !auth?.token
      ) {
        setStudents([]);
        setAttendance({});
        return;
      }

      /*
      |--------------------------------------------------------------------------
      | We need these IDs from the assignment
      |--------------------------------------------------------------------------
      */
      const classSubjectId =
        selectedAssignmentData.class_subject_id;

      const semesterId =
        selectedAssignmentData.semester_id;

      if (
        !classSubjectId ||
        !semesterId
      ) {
        setError(
          "The selected teaching assignment is missing class subject or semester information."
        );

        setStudents([]);
        return;
      }

      try {
        setLoadingStudents(true);
        setError("");
        setSuccess("");

        /*
        |--------------------------------------------------------------------------
        | Get students
        |--------------------------------------------------------------------------
        */
        const studentResponse =
          await fetch(
            `${API_BASE}/attendance/teacher/students?class_subject_id=${encodeURIComponent(
              classSubjectId
            )}&semester_id=${encodeURIComponent(
              semesterId
            )}`,
            {
              method: "GET",
              headers: getHeaders(),
            }
          );

        if (
          studentResponse.status === 401 ||
          studentResponse.status === 403
        ) {
          onLogout();
          return;
        }

        const studentData =
          await studentResponse
            .json()
            .catch(() => []);

        if (!studentResponse.ok) {
          throw new Error(
            studentData.message ||
              "Unable to load students."
          );
        }

        const studentList = Array.isArray(
          studentData
        )
          ? studentData
          : studentData.students ||
            studentData.data ||
            [];

        setStudents(studentList);

        /*
        |--------------------------------------------------------------------------
        | Get existing attendance for this date
        |--------------------------------------------------------------------------
        */
        const recordResponse =
          await fetch(
            `${API_BASE}/attendance/teacher/records?class_subject_id=${encodeURIComponent(
              classSubjectId
            )}&semester_id=${encodeURIComponent(
              semesterId
            )}&attendance_date=${encodeURIComponent(
              attendanceDate
            )}`,
            {
              method: "GET",
              headers: getHeaders(),
            }
          );

        if (
          recordResponse.status === 401 ||
          recordResponse.status === 403
        ) {
          onLogout();
          return;
        }

        const recordData =
          await recordResponse
            .json()
            .catch(() => []);

        if (!recordResponse.ok) {
          throw new Error(
            recordData.message ||
              "Unable to load existing attendance."
          );
        }

        const recordList =
          Array.isArray(recordData)
            ? recordData
            : recordData.records ||
              recordData.data ||
              [];

        /*
        |--------------------------------------------------------------------------
        | Convert records into an object
        |--------------------------------------------------------------------------
        */
        const existingAttendance = {};

        recordList.forEach((record) => {
          existingAttendance[
            String(record.enrollment_id)
          ] = {
            status:
              record.status || "present",
            remarks:
              record.remarks || "",
            saved: true,
            id: record.id,
          };
        });

        /*
        |--------------------------------------------------------------------------
        | Give new students a default Present status
        |--------------------------------------------------------------------------
        */
        studentList.forEach((student) => {
          const enrollmentId = String(
            student.enrollment_id
          );

          if (
            !existingAttendance[
              enrollmentId
            ]
          ) {
            existingAttendance[
              enrollmentId
            ] = {
              status: "present",
              remarks: "",
              saved: false,
            };
          }
        });

        setAttendance(
          existingAttendance
        );
      } catch (err) {
        console.error(
          "Load attendance students error:",
          err
        );

        setError(
          err.message ||
            "Unable to load attendance information."
        );
      } finally {
        setLoadingStudents(false);
      }
    };

    loadStudents();
  }, [
    selectedAssignmentData,
    attendanceDate,
    auth?.token,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Change assignment
  |--------------------------------------------------------------------------
  */
  const handleAssignmentChange = (
    event
  ) => {
    setSelectedAssignment(
      event.target.value
    );

    setSuccess("");
    setError("");
  };

  /*
  |--------------------------------------------------------------------------
  | Change attendance date
  |--------------------------------------------------------------------------
  */
  const handleDateChange = (event) => {
    setAttendanceDate(
      event.target.value
    );

    setSuccess("");
    setError("");
  };

  /*
  |--------------------------------------------------------------------------
  | Change student attendance status
  |--------------------------------------------------------------------------
  */
  const handleStatusChange = (
    enrollmentId,
    status
  ) => {
    const key = String(enrollmentId);

    setAttendance((previous) => ({
      ...previous,
      [key]: {
        ...(previous[key] || {}),
        status,
        saved: false,
      },
    }));

    setSuccess("");
  };

  /*
  |--------------------------------------------------------------------------
  | Change student remarks
  |--------------------------------------------------------------------------
  */
  const handleRemarksChange = (
    enrollmentId,
    remarks
  ) => {
    const key = String(enrollmentId);

    setAttendance((previous) => ({
      ...previous,
      [key]: {
        ...(previous[key] || {}),
        remarks,
        saved: false,
      },
    }));

    setSuccess("");
  };

  /*
  |--------------------------------------------------------------------------
  | Mark everyone
  |--------------------------------------------------------------------------
  */
  const markEveryone = (status) => {
    const updated = {};

    students.forEach((student) => {
      const key = String(
        student.enrollment_id
      );

      updated[key] = {
        ...(attendance[key] || {}),
        status,
        saved: false,
      };
    });

    setAttendance(updated);
    setSuccess("");
  };

  /*
  |--------------------------------------------------------------------------
  | Save attendance
  |--------------------------------------------------------------------------
  */
  const handleSaveAttendance = async () => {
    if (
      !selectedAssignmentData ||
      students.length === 0
    ) {
      setError(
        "Please select a teaching assignment with students."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      /*
      |--------------------------------------------------------------------------
      | Save only records that have not already been saved
      |--------------------------------------------------------------------------
      */
      const recordsToSave = students.filter(
        (student) => {
          const record =
            attendance[
              String(student.enrollment_id)
            ];

          return !record?.saved;
        }
      );

      if (recordsToSave.length === 0) {
        setSuccess(
          "There are no new attendance records to save."
        );
        return;
      }

      /*
      |--------------------------------------------------------------------------
      | Submit records one by one
      |--------------------------------------------------------------------------
      */
      const results = [];

      for (
        const student of recordsToSave
      ) {
        const record =
          attendance[
            String(
              student.enrollment_id
            )
          ];

        const response =
          await fetch(
            `${API_BASE}/attendance`,
            {
              method: "POST",
              headers: getHeaders(),
              body: JSON.stringify({
                enrollment_id:
                  student.enrollment_id,

                class_subject_id:
                  selectedAssignmentData.class_subject_id,

                attendance_date:
                  attendanceDate,

                status:
                  record?.status ||
                  "present",

                remarks:
                  record?.remarks ||
                  null,
              }),
            }
          );

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          onLogout();
          return;
        }

        const data =
          await response
            .json()
            .catch(() => ({}));

        if (!response.ok) {
          /*
          |--------------------------------------------------------------------------
          | If the record already exists, don't crash the entire save
          |--------------------------------------------------------------------------
          */
          if (
            response.status === 409
          ) {
            results.push({
              enrollmentId:
                student.enrollment_id,
              saved: true,
              id:
                data.attendanceId ||
                null,
            });

            continue;
          }

          throw new Error(
            data.message ||
              `Unable to save attendance for ${
                student.student_name ||
                `${student.first_name || ""} ${
                  student.last_name || ""
                }`
              }.`
          );
        }

        results.push({
          enrollmentId:
            student.enrollment_id,
          saved: true,
          id:
            data.attendanceId ||
            null,
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Update local saved state
      |--------------------------------------------------------------------------
      */
      setAttendance((previous) => {
        const updated = {
          ...previous,
        };

        results.forEach((result) => {
          const key = String(
            result.enrollmentId
          );

          updated[key] = {
            ...(updated[key] || {}),
            saved: true,
            id: result.id,
          };
        });

        return updated;
      });

      setSuccess(
        "Attendance saved successfully."
      );
    } catch (err) {
      console.error(
        "Save attendance error:",
        err
      );

      setError(
        err.message ||
          "Unable to save attendance."
      );
    } finally {
      setSaving(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Count statuses
  |--------------------------------------------------------------------------
  */
  const statusCounts = useMemo(() => {
    const counts = {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
    };

    students.forEach((student) => {
      const status =
        attendance[
          String(
            student.enrollment_id
          )
        ]?.status;

      if (counts[status] !== undefined) {
        counts[status]++;
      }
    });

    return counts;
  }, [students, attendance]);

  /*
  |--------------------------------------------------------------------------
  | Teacher name
  |--------------------------------------------------------------------------
  */
  const teacherName =
    auth?.user?.name ||
    "Teacher";

  return (
    <>
      <style>{attendanceStyles}</style>

      <div className="teacher-attendance-page">
        <div className="teacher-page-heading">
          <div>
            <p className="teacher-eyebrow">
              ATTENDANCE
            </p>

            <h1>
              Take Attendance
            </h1>

            <p>
              Record daily attendance for
              your assigned students.
            </p>
          </div>
        </div>

        {error && (
          <div className="teacher-alert teacher-error">
            ! {error}
          </div>
        )}

        {success && (
          <div className="teacher-alert teacher-success">
            ✓ {success}
          </div>
        )}

        <section className="teacher-attendance-card">
          <div className="teacher-attendance-header">
            <div>
              <h2>
                Attendance Details
              </h2>

              <p>
                Select the class, subject
                and date.
              </p>
            </div>
          </div>

          <div className="teacher-attendance-controls">
            <div className="teacher-control">
              <label htmlFor="teacher-assignment">
                Class & Subject
              </label>

              <select
                id="teacher-assignment"
                value={selectedAssignment}
                onChange={
                  handleAssignmentChange
                }
                disabled={
                  loadingAssignments
                }
              >
                <option value="">
                  {loadingAssignments
                    ? "Loading assignments..."
                    : "Select class and subject"}
                </option>

                {assignments.map(
                  (assignment) => (
                    <option
                      key={assignment.id}
                      value={assignment.id}
                    >
                      {getAssignmentLabel(
                        assignment
                      )}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="teacher-control">
              <label htmlFor="attendance-date">
                Attendance Date
              </label>

              <input
                id="attendance-date"
                type="date"
                value={attendanceDate}
                onChange={
                  handleDateChange
                }
              />
            </div>
          </div>

          {selectedAssignmentData && (
            <div className="teacher-selected-summary">
              <strong>
                {selectedAssignmentData.class_name ||
                  selectedAssignmentData.class_code ||
                  "Class"}
              </strong>

              <span>•</span>

              <span>
                {selectedAssignmentData.subject_name ||
                  selectedAssignmentData.subject_code ||
                  "Subject"}
              </span>

              <span>•</span>

              <span>
                {selectedAssignmentData.semester_name ||
                  selectedAssignmentData.semester ||
                  "Semester"}
              </span>

              <span>•</span>

              <span>
                Teacher: {teacherName}
              </span>
            </div>
          )}

          <div className="attendance-summary">
            <div>
              <span>Total</span>
              <strong>
                {students.length}
              </strong>
            </div>

            <div>
              <span>Present</span>
              <strong>
                {statusCounts.present}
              </strong>
            </div>

            <div>
              <span>Absent</span>
              <strong>
                {statusCounts.absent}
              </strong>
            </div>

            <div>
              <span>Late</span>
              <strong>
                {statusCounts.late}
              </strong>
            </div>

            <div>
              <span>Excused</span>
              <strong>
                {statusCounts.excused}
              </strong>
            </div>
          </div>

          {loadingStudents ? (
            <div className="teacher-empty">
              Loading students...
            </div>
          ) : !selectedAssignment ? (
            <div className="teacher-empty">
              Select a class and subject to
              load students.
            </div>
          ) : students.length === 0 ? (
            <div className="teacher-empty">
              No students are enrolled in
              this class for the selected
              semester.
            </div>
          ) : (
            <>
              <div className="attendance-toolbar">
                <div>
                  <strong>
                    {students.length}{" "}
                    Students
                  </strong>

                  <span>
                    Mark attendance below.
                  </span>
                </div>

                <div className="teacher-mark-actions">
                  <button
                    type="button"
                    onClick={() =>
                      markEveryone(
                        "present"
                      )
                    }
                  >
                    ✓ All Present
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      markEveryone(
                        "absent"
                      )
                    }
                  >
                    ✕ All Absent
                  </button>
                </div>
              </div>

              <div className="teacher-attendance-table-wrap">
                <table className="teacher-attendance-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Student</th>
                      <th>Student Number</th>
                      <th>Attendance</th>
                      <th>Remarks</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {students.map(
                      (
                        student,
                        index
                      ) => {
                        const key =
                          String(
                            student.enrollment_id
                          );

                        const record =
                          attendance[
                            key
                          ] || {
                            status:
                              "present",
                            remarks:
                              "",
                            saved:
                              false,
                          };

                        const fullName =
                          student.student_name ||
                          `${student.first_name || ""} ${
                            student.last_name || ""
                          }`.trim() ||
                          "Unknown Student";

                        return (
                          <tr
                            key={
                              student.enrollment_id ||
                              student.student_id ||
                              index
                            }
                          >
                            <td>
                              {index + 1}
                            </td>

                            <td>
                              <strong>
                                {fullName}
                              </strong>
                            </td>

                            <td>
                              {student.student_number ||
                                "—"}
                            </td>

                            <td>
                              <select
                                value={
                                  record.status ||
                                  "present"
                                }
                                onChange={(
                                  event
                                ) =>
                                  handleStatusChange(
                                    student.enrollment_id,
                                    event
                                      .target
                                      .value
                                  )
                                }
                              >
                                {STATUS_OPTIONS.map(
                                  (
                                    status
                                  ) => (
                                    <option
                                      key={
                                        status
                                      }
                                      value={
                                        status
                                      }
                                    >
                                      {capitalize(
                                        status
                                      )}
                                    </option>
                                  )
                                )}
                              </select>
                            </td>

                            <td>
                              <input
                                type="text"
                                value={
                                  record.remarks ||
                                  ""
                                }
                                placeholder="Optional"
                                onChange={(
                                  event
                                ) =>
                                  handleRemarksChange(
                                    student.enrollment_id,
                                    event
                                      .target
                                      .value
                                  )
                                }
                              />
                            </td>

                            <td>
                              <span
                                className={`attendance-state ${
                                  record.saved
                                    ? "saved"
                                    : ""
                                }`}
                              >
                                {record.saved
                                  ? "Saved"
                                  : "Not saved"}
                              </span>
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>

              <div className="teacher-attendance-footer">
                <span>
                  Attendance date:{" "}
                  <strong>
                    {formatDisplayDate(
                      attendanceDate
                    )}
                  </strong>
                </span>

                <button
                  type="button"
                  className="teacher-primary-button"
                  onClick={
                    handleSaveAttendance
                  }
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : "✓ Save Attendance"}
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function getToday() {
  const date = new Date();

  const year =
    date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function capitalize(value) {
  if (!value) {
    return "";
  }

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
}

function formatDisplayDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(
    `${value}T00:00:00`
  );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function getAssignmentLabel(
  assignment
) {
  const className =
    assignment.class_name ||
    assignment.class_code ||
    "Class";

  const subjectName =
    assignment.subject_name ||
    assignment.subject_code ||
    "Subject";

  const semester =
    assignment.semester_name ||
    assignment.semester ||
    "";

  return semester
    ? `${className} — ${subjectName} — ${semester}`
    : `${className} — ${subjectName}`;
}

/*
|--------------------------------------------------------------------------
| Attendance styles
|--------------------------------------------------------------------------
*/

const attendanceStyles = `
.teacher-attendance-page {
  max-width: 1400px;
}

.teacher-page-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 20px;
  margin-bottom: 24px;
}

.teacher-page-heading h1 {
  margin: 4px 0 8px;
  color: #111827;
  font-size: 31px;
  letter-spacing: -1px;
}

.teacher-page-heading p:not(.teacher-eyebrow) {
  margin: 0;
  color: #7b8799;
  font-size: 14px;
}

.teacher-eyebrow {
  margin: 0;
  color: #2563eb;
  font-size: 10px;
  font-weight: 850;
  letter-spacing: 1.5px;
}

.teacher-alert {
  padding: 12px 15px;
  border-radius: 9px;
  margin-bottom: 18px;
  font-size: 13px;
  font-weight: 650;
}

.teacher-error {
  background: #fff1f2;
  border: 1px solid #fecdd3;
  color: #be123c;
}

.teacher-success {
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  color: #047857;
}

.teacher-attendance-card {
  background: #ffffff;
  border: 1px solid #e8edf5;
  border-radius: 14px;
  box-shadow: 0 5px 18px rgba(15, 23, 42, 0.03);
  overflow: hidden;
}

.teacher-attendance-header {
  padding: 20px 22px;
  border-bottom: 1px solid #edf1f6;
}

.teacher-attendance-header h2 {
  margin: 0 0 5px;
  font-size: 17px;
  color: #111827;
}

.teacher-attendance-header p {
  margin: 0;
  color: #8995aa;
  font-size: 12px;
}

.teacher-attendance-controls {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 18px;
  padding: 22px;
}

.teacher-control label {
  display: block;
  margin-bottom: 7px;
  color: #334155;
  font-size: 12px;
  font-weight: 750;
}

.teacher-control select,
.teacher-control input,
.teacher-attendance-table select,
.teacher-attendance-table input {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #dfe5ee;
  background: #ffffff;
  color: #1f2937;
  border-radius: 8px;
  padding: 10px 11px;
  outline: none;
  font: inherit;
}

.teacher-control select:focus,
.teacher-control input:focus,
.teacher-attendance-table select:focus,
.teacher-attendance-table input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.09);
}

.teacher-selected-summary {
  margin: 0 22px 18px;
  padding: 13px 15px;
  border-radius: 9px;
  background: #f5f8ff;
  color: #475569;
  display: flex;
  align-items: center;
  gap: 9px;
  flex-wrap: wrap;
  font-size: 13px;
}

.teacher-selected-summary strong {
  color: #1d4ed8;
}

.attendance-summary {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  padding: 0 22px 20px;
}

.attendance-summary > div {
  border: 1px solid #edf1f6;
  background: #fafbfc;
  border-radius: 10px;
  padding: 12px 14px;
}

.attendance-summary span,
.attendance-summary strong {
  display: block;
}

.attendance-summary span {
  color: #8995aa;
  font-size: 10px;
  margin-bottom: 3px;
}

.attendance-summary strong {
  color: #111827;
  font-size: 20px;
}

.attendance-toolbar {
  padding: 16px 22px;
  background: #fafbfc;
  border-top: 1px solid #edf1f6;
  border-bottom: 1px solid #edf1f6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
}

.attendance-toolbar strong,
.attendance-toolbar span {
  display: block;
}

.attendance-toolbar strong {
  color: #1f2937;
  font-size: 13px;
}

.attendance-toolbar span {
  margin-top: 3px;
  color: #8995aa;
  font-size: 11px;
}

.teacher-mark-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.teacher-mark-actions button {
  border: 1px solid #dfe5ee;
  background: #ffffff;
  color: #475569;
  padding: 8px 11px;
  border-radius: 7px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 700;
}

.teacher-mark-actions button:hover {
  background: #f1f5f9;
}

.teacher-attendance-table-wrap {
  width: 100%;
  overflow-x: auto;
}

.teacher-attendance-table {
  width: 100%;
  border-collapse: collapse;
}

.teacher-attendance-table th,
.teacher-attendance-table td {
  padding: 13px 16px;
  border-bottom: 1px solid #eef1f5;
  text-align: left;
  font-size: 13px;
  vertical-align: middle;
}

.teacher-attendance-table th {
  background: #ffffff;
  color: #718096;
  font-size: 10px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.teacher-attendance-table td {
  color: #475569;
}

.teacher-attendance-table td:nth-child(1) {
  color: #94a3b8;
  width: 35px;
}

.teacher-attendance-table td:nth-child(2) strong {
  color: #1f2937;
}

.teacher-attendance-table select {
  min-width: 120px;
  padding: 8px 9px;
}

.teacher-attendance-table input {
  min-width: 160px;
  padding: 8px 9px;
}

.attendance-state {
  display: inline-block;
  padding: 5px 8px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #64748b;
  font-size: 10px;
  font-weight: 750;
  white-space: nowrap;
}

.attendance-state.saved {
  background: #ecfdf5;
  color: #047857;
}

.teacher-empty {
  padding: 55px 20px;
  text-align: center;
  color: #7b8799;
  font-size: 14px;
}

.teacher-attendance-footer {
  padding: 18px 22px;
  border-top: 1px solid #edf1f6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  color: #7b8799;
  font-size: 12px;
}

.teacher-primary-button {
  border: 0;
  background: #2563eb;
  color: #ffffff;
  padding: 11px 17px;
  border-radius: 9px;
  font-weight: 750;
  cursor: pointer;
  box-shadow: 0 8px 18px rgba(37, 99, 235, 0.18);
}

.teacher-primary-button:hover {
  background: #1d4ed8;
}

.teacher-primary-button:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

@media (max-width: 900px) {
  .teacher-attendance-controls {
    grid-template-columns: 1fr;
  }

  .attendance-summary {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 650px) {
  .teacher-page-heading {
    display: block;
  }

  .attendance-toolbar,
  .teacher-attendance-footer {
    align-items: flex-start;
    flex-direction: column;
  }

  .attendance-summary {
    grid-template-columns: 1fr 1fr;
  }
}
`;

export default TeacherAttendance;
