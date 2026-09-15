import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function TeacherResults({ auth, onLogout }) {
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState("");

  const [students, setStudents] = useState([]);
  const [assignmentInfo, setAssignmentInfo] = useState(null);

  const [loadingAssignments, setLoadingAssignments] =
    useState(true);

  const [loadingStudents, setLoadingStudents] =
    useState(false);

  const [savingId, setSavingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /*
  |--------------------------------------------------------------------------
  | LOAD TEACHER ASSIGNMENTS
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const loadAssignments = async () => {
      try {
        setLoadingAssignments(true);
        setError("");

        const response = await fetch(
          `${API_BASE}/teacher-assignments`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${auth.token}`,
            },
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
              "Unable to load teacher assignments."
          );
        }

        const list = Array.isArray(data)
          ? data
          : data.assignments ||
            data.data ||
            [];

        /*
        |--------------------------------------------------------------------------
        | Only active assignments
        |--------------------------------------------------------------------------
        */

        const activeAssignments = list.filter(
          (item) =>
            !item.status ||
            item.status === "active"
        );

        setAssignments(activeAssignments);
      } catch (err) {
        console.error(
          "Teacher results assignments error:",
          err
        );

        setError(
          err.message ||
            "Unable to load assignments."
        );
      } finally {
        setLoadingAssignments(false);
      }
    };

    if (auth?.token) {
      loadAssignments();
    }
  }, [auth?.token, onLogout]);


  /*
  |--------------------------------------------------------------------------
  | LOAD STUDENTS FOR SELECTED ASSIGNMENT
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const loadStudents = async () => {
      if (!selectedAssignment) {
        setStudents([]);
        setAssignmentInfo(null);
        return;
      }

      try {
        setLoadingStudents(true);
        setError("");
        setSuccess("");

        const response = await fetch(
          `${API_BASE}/results/teacher/students?assignment_id=${selectedAssignment}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${auth.token}`,
            },
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
          .catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to load students."
          );
        }

        setAssignmentInfo(
          data.assignment || null
        );

        setStudents(
          Array.isArray(data.students)
            ? data.students
            : []
        );
      } catch (err) {
        console.error(
          "Teacher results students error:",
          err
        );

        setError(
          err.message ||
            "Unable to load students."
        );

        setStudents([]);
      } finally {
        setLoadingStudents(false);
      }
    };

    if (auth?.token) {
      loadStudents();
    }
  }, [
    selectedAssignment,
    auth?.token,
    onLogout,
  ]);


  /*
  |--------------------------------------------------------------------------
  | UPDATE LOCAL MARK VALUE
  |--------------------------------------------------------------------------
  */

  const updateStudentMark = (
    studentId,
    field,
    value
  ) => {
    setStudents((current) =>
      current.map((student) =>
        student.enrollment_id === studentId
          ? {
              ...student,
              [field]: value,
            }
          : student
      )
    );
  };


  /*
  |--------------------------------------------------------------------------
  | SAVE RESULT
  |--------------------------------------------------------------------------
  */

  const saveResult = async (student) => {
    setError("");
    setSuccess("");

    const beginning =
      student.beginning_marks === ""
        ? ""
        : Number(student.beginning_marks);

    const midsemester =
      student.midsemester_marks === ""
        ? ""
        : Number(student.midsemester_marks);

    const final =
      student.final_marks === ""
        ? ""
        : Number(student.final_marks);


    /*
    |--------------------------------------------------------------------------
    | FRONTEND VALIDATION
    |--------------------------------------------------------------------------
    */

    if (
      beginning === "" ||
      midsemester === "" ||
      final === ""
    ) {
      setError(
        `Please enter all marks for ${student.student_name}.`
      );
      return;
    }

    if (
      Number.isNaN(beginning) ||
      Number.isNaN(midsemester) ||
      Number.isNaN(final)
    ) {
      setError(
        `Marks for ${student.student_name} must be valid numbers.`
      );
      return;
    }

    if (beginning < 0 || beginning > 20) {
      setError(
        `Beginning marks for ${student.student_name} must be between 0 and 20.`
      );
      return;
    }

    if (midsemester < 0 || midsemester > 20) {
      setError(
        `Mid-Semester marks for ${student.student_name} must be between 0 and 20.`
      );
      return;
    }

    if (final < 0 || final > 60) {
      setError(
        `Final marks for ${student.student_name} must be between 0 and 60.`
      );
      return;
    }


    /*
    |--------------------------------------------------------------------------
    | SAVE / UPDATE
    |--------------------------------------------------------------------------
    */

    try {
      setSavingId(student.enrollment_id);
      setError("");
      setSuccess("");

      const payload = {
        enrollment_id:
          student.enrollment_id,

        class_subject_id:
          assignmentInfo.class_subject_id,

        beginning_marks: beginning,
        midsemester_marks: midsemester,
        final_marks: final,
      };


      const isUpdate =
        student.result_id !== null &&
        student.result_id !== undefined;


      const url = isUpdate
        ? `${API_BASE}/results/${student.result_id}`
        : `${API_BASE}/results`;

      const method = isUpdate
        ? "PUT"
        : "POST";


      const response = await fetch(
        url,
        {
          method,

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${auth.token}`,
          },

          body: JSON.stringify(payload),
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
        .catch(() => ({}));


      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to save result."
        );
      }


      /*
      |--------------------------------------------------------------------------
      | UPDATE LOCAL STUDENT DATA
      |--------------------------------------------------------------------------
      */

      const savedResult =
        data.result || {};

      const total =
        beginning +
        midsemester +
        final;

      setStudents((current) =>
        current.map((item) =>
          item.enrollment_id ===
          student.enrollment_id
            ? {
                ...item,

                result_id:
                  savedResult.id ||
                  data.resultId ||
                  item.result_id,

                beginning_marks:
                  beginning,

                midsemester_marks:
                  midsemester,

                final_marks:
                  final,

                marks:
                  savedResult.marks ??
                  total,

                grade:
                  savedResult.grade ||
                  item.grade,

                remarks:
                  savedResult.remarks ||
                  item.remarks,
              }
            : item
        )
      );


      setSuccess(
        isUpdate
          ? `Result for ${student.student_name} updated successfully.`
          : `Result for ${student.student_name} recorded successfully.`
      );
    } catch (err) {
      console.error(
        "Save teacher result error:",
        err
      );

      setError(
        err.message ||
          "Failed to save result."
      );
    } finally {
      setSavingId(null);
    }
  };


  /*
  |--------------------------------------------------------------------------
  | CLEAR SELECTION
  |--------------------------------------------------------------------------
  */

  const clearSelection = () => {
    setSelectedAssignment("");
    setStudents([]);
    setAssignmentInfo(null);
    setError("");
    setSuccess("");
  };


  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="teacher-results">

      <div className="teacher-results-header">
        <div>
          <p className="results-eyebrow">
            ACADEMIC MANAGEMENT
          </p>

          <h1>
            Student Results
          </h1>

          <p>
            Record and manage results for
            students in your assigned classes.
          </p>
        </div>
      </div>


      {error && (
        <div className="results-alert results-error">
          {error}
        </div>
      )}


      {success && (
        <div className="results-alert results-success">
          {success}
        </div>
      )}


      {/* =========================================================
          ASSIGNMENT SELECTION
      ========================================================== */}

      <section className="results-card">

        <div className="results-card-header">
          <div>
            <h2>
              Select Teaching Assignment
            </h2>

            <p>
              Choose the class, subject and
              semester for which you want to
              enter results.
            </p>
          </div>
        </div>


        <div className="results-card-body">

          <label className="results-label">
            Class / Subject / Semester
          </label>

          <select
            className="results-select"
            value={selectedAssignment}
            onChange={(event) =>
              setSelectedAssignment(
                event.target.value
              )
            }
            disabled={
              loadingAssignments
            }
          >
            <option value="">
              {loadingAssignments
                ? "Loading assignments..."
                : "Select an assignment"}
            </option>

            {assignments.map(
              (assignment) => (
                <option
                  key={assignment.id}
                  value={assignment.id}
                >
                  {assignment.class_name ||
                    assignment.class_code ||
                    "Class"}{" "}
                  —{" "}
                  {assignment.subject_name ||
                    assignment.subject_code ||
                    "Subject"}{" "}
                  —{" "}
                  {assignment.semester ||
                    assignment.semester_name ||
                    "Semester"}
                </option>
              )
            )}
          </select>


          {assignments.length === 0 &&
            !loadingAssignments && (
              <div className="results-empty-small">
                You have no active teaching
                assignments.
              </div>
            )}

        </div>
      </section>


      {/* =========================================================
          SELECTED ASSIGNMENT INFORMATION
      ========================================================== */}

      {assignmentInfo && (
        <section className="results-assignment-summary">

          <div>
            <small>
              CLASS
            </small>

            <strong>
              {assignmentInfo.class_name ||
                assignmentInfo.class_code ||
                "—"}
            </strong>
          </div>


          <div>
            <small>
              SUBJECT
            </small>

            <strong>
              {assignmentInfo.subject_name ||
                assignmentInfo.subject_code ||
                "—"}
            </strong>
          </div>


          <div>
            <small>
              SEMESTER
            </small>

            <strong>
              {assignmentInfo.semester ||
                "—"}
            </strong>
          </div>


          <button
            type="button"
            className="results-clear-button"
            onClick={clearSelection}
          >
            Clear
          </button>

        </section>
      )}


      {/* =========================================================
          STUDENT RESULTS TABLE
      ========================================================== */}

      {selectedAssignment && (
        <section className="results-card">

          <div className="results-card-header">

            <div>
              <h2>
                Students
              </h2>

              <p>
                Beginning /20 · Mid-Semester
                /20 · Final /60 · Total /100
              </p>
            </div>

          </div>


          {loadingStudents ? (
            <div className="results-loading">
              Loading students...
            </div>
          ) : students.length === 0 ? (
            <div className="results-empty">
              No students are enrolled in this
              class for the selected semester.
            </div>
          ) : (
            <div className="results-table-wrapper">

              <table className="results-table">

                <thead>
                  <tr>
                    <th>
                      Student
                    </th>

                    <th>
                      Student No.
                    </th>

                    <th>
                      Beginning
                      <span>/20</span>
                    </th>

                    <th>
                      Mid-Semester
                      <span>/20</span>
                    </th>

                    <th>
                      Final
                      <span>/60</span>
                    </th>

                    <th>
                      Total
                      <span>/100</span>
                    </th>

                    <th>
                      Grade
                    </th>

                    <th>
                      Remarks
                    </th>

                    <th>
                      Action
                    </th>
                  </tr>
                </thead>


                <tbody>

                  {students.map(
                    (student) => {

                      const beginning =
                        Number(
                          student.beginning_marks
                        ) || 0;

                      const midsemester =
                        Number(
                          student.midsemester_marks
                        ) || 0;

                      const final =
                        Number(
                          student.final_marks
                        ) || 0;

                      const hasAnyMarks =
                        student.beginning_marks !==
                          null ||
                        student.midsemester_marks !==
                          null ||
                        student.final_marks !==
                          null;

                      const calculatedTotal =
                        hasAnyMarks
                          ? beginning +
                            midsemester +
                            final
                          : "—";


                      return (
                        <tr
                          key={
                            student.enrollment_id
                          }
                        >

                          <td>
                            <strong>
                              {
                                student.student_name
                              }
                            </strong>
                          </td>


                          <td>
                            {
                              student.student_number ||
                              "—"
                            }
                          </td>


                          <td>
                            <input
                              type="number"
                              min="0"
                              max="20"
                              step="0.01"
                              value={
                                student.beginning_marks ??
                                ""
                              }
                              onChange={(event) =>
                                updateStudentMark(
                                  student.enrollment_id,
                                  "beginning_marks",
                                  event.target.value
                                )
                              }
                              className="result-mark-input"
                            />
                          </td>


                          <td>
                            <input
                              type="number"
                              min="0"
                              max="20"
                              step="0.01"
                              value={
                                student.midsemester_marks ??
                                ""
                              }
                              onChange={(event) =>
                                updateStudentMark(
                                  student.enrollment_id,
                                  "midsemester_marks",
                                  event.target.value
                                )
                              }
                              className="result-mark-input"
                            />
                          </td>


                          <td>
                            <input
                              type="number"
                              min="0"
                              max="60"
                              step="0.01"
                              value={
                                student.final_marks ??
                                ""
                              }
                              onChange={(event) =>
                                updateStudentMark(
                                  student.enrollment_id,
                                  "final_marks",
                                  event.target.value
                                )
                              }
                              className="result-mark-input"
                            />
                          </td>


                          <td>
                            <strong className="result-total">
                              {calculatedTotal}
                            </strong>
                          </td>


                          <td>
                            <span className="result-grade">
                              {student.grade ||
                                "—"}
                            </span>
                          </td>


                          <td>
                            {student.remarks ||
                              "—"}
                          </td>


                          <td>

                            <button
                              type="button"
                              className="result-save-button"
                              onClick={() =>
                                saveResult(
                                  student
                                )
                              }
                              disabled={
                                savingId ===
                                student.enrollment_id
                              }
                            >
                              {savingId ===
                              student.enrollment_id
                                ? "Saving..."
                                : student.result_id
                                ? "Update"
                                : "Save"}
                            </button>

                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>
          )}

        </section>
      )}


      {/* =========================================================
          GRADING INFORMATION
      ========================================================== */}

      <section className="results-card results-grading-card">

        <div className="results-card-header">

          <div>
            <h2>
              Grading Scale
            </h2>

            <p>
              Total score is calculated from
              all three assessment components.
            </p>
          </div>

        </div>


        <div className="grading-grid">

          <div>
            <strong>
              A
            </strong>

            <span>
              80–100
            </span>

            <small>
              Excellent
            </small>
          </div>


          <div>
            <strong>
              B
            </strong>

            <span>
              70–79
            </span>

            <small>
              Very Good
            </small>
          </div>


          <div>
            <strong>
              C
            </strong>

            <span>
              60–69
            </span>

            <small>
              Good
            </small>
          </div>


          <div>
            <strong>
              D
            </strong>

            <span>
              50–59
            </span>

            <small>
              Pass
            </small>
          </div>


          <div>
            <strong>
              F
            </strong>

            <span>
              0–49
            </span>

            <small>
              Fail
            </small>
          </div>

        </div>

      </section>


      <style>{teacherResultsStyles}</style>

    </div>
  );
}


/*
|--------------------------------------------------------------------------
| STYLES
|--------------------------------------------------------------------------
*/

const teacherResultsStyles = `

.teacher-results {
  width: 100%;
}

.teacher-results-header {
  background: #ffffff;
  border: 1px solid #e8edf5;
  border-radius: 14px;
  padding: 25px;
  margin-bottom: 20px;
  box-shadow: 0 5px 18px rgba(15, 23, 42, 0.03);
}

.results-eyebrow {
  margin: 0 0 5px;
  color: #2563eb;
  font-size: 9px;
  font-weight: 850;
  letter-spacing: 1.5px;
}

.teacher-results-header h1 {
  margin: 0 0 7px;
  color: #111827;
  font-size: 25px;
  letter-spacing: -0.7px;
}

.teacher-results-header p {
  margin: 0;
  color: #8995aa;
  font-size: 12px;
}

.results-alert {
  border-radius: 9px;
  padding: 11px 14px;
  margin-bottom: 18px;
  font-size: 12px;
}

.results-error {
  background: #fff1f2;
  border: 1px solid #fecdd3;
  color: #be123c;
}

.results-success {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #15803d;
}

.results-card {
  background: #ffffff;
  border: 1px solid #e8edf5;
  border-radius: 13px;
  overflow: hidden;
  margin-bottom: 20px;
}

.results-card-header {
  padding: 19px 21px;
  border-bottom: 1px solid #edf1f6;
}

.results-card-header h2 {
  margin: 0 0 4px;
  color: #1f2937;
  font-size: 15px;
}

.results-card-header p {
  margin: 0;
  color: #8995aa;
  font-size: 11px;
}

.results-card-body {
  padding: 20px 21px;
}

.results-label {
  display: block;
  color: #475569;
  font-size: 11px;
  font-weight: 700;
  margin-bottom: 7px;
}

.results-select {
  width: 100%;
  max-width: 650px;
  box-sizing: border-box;
  border: 1px solid #dce3ed;
  border-radius: 8px;
  background: #ffffff;
  color: #334155;
  padding: 11px 12px;
  font-size: 12px;
  outline: none;
}

.results-select:focus {
  border-color: #93c5fd;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08);
}

.results-empty-small {
  margin-top: 12px;
  color: #8995aa;
  font-size: 11px;
}

.results-assignment-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr) auto;
  gap: 15px;
  align-items: center;
  background: #ffffff;
  border: 1px solid #e8edf5;
  border-radius: 13px;
  padding: 17px 20px;
  margin-bottom: 20px;
}

.results-assignment-summary div small {
  display: block;
  color: #94a3b8;
  font-size: 8px;
  font-weight: 850;
  letter-spacing: 1px;
  margin-bottom: 4px;
}

.results-assignment-summary div strong {
  display: block;
  color: #334155;
  font-size: 12px;
}

.results-clear-button {
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #64748b;
  border-radius: 7px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 10px;
  font-weight: 700;
}

.results-clear-button:hover {
  background: #f8fafc;
}

.results-loading,
.results-empty {
  padding: 40px 20px;
  text-align: center;
  color: #8995aa;
  font-size: 12px;
}

.results-table-wrapper {
  width: 100%;
  overflow-x: auto;
}

.results-table {
  width: 100%;
  min-width: 1050px;
  border-collapse: collapse;
}

.results-table th,
.results-table td {
  padding: 11px 12px;
  border-bottom: 1px solid #eef1f5;
  text-align: left;
  font-size: 11px;
  white-space: nowrap;
}

.results-table th {
  color: #718096;
  background: #fafbfc;
  font-size: 8px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.results-table th span {
  color: #94a3b8;
  margin-left: 3px;
  font-size: 7px;
}

.results-table td {
  color: #475569;
}

.results-table td strong {
  color: #1f2937;
}

.result-mark-input {
  width: 62px;
  box-sizing: border-box;
  border: 1px solid #dce3ed;
  border-radius: 6px;
  padding: 7px 6px;
  font-size: 11px;
  color: #334155;
  outline: none;
}

.result-mark-input:focus {
  border-color: #93c5fd;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.08);
}

.result-total {
  color: #2563eb !important;
  font-size: 12px;
}

.result-grade {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 27px;
  height: 27px;
  border-radius: 6px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 11px;
  font-weight: 850;
}

.result-save-button {
  border: 0;
  background: #2563eb;
  color: #ffffff;
  border-radius: 7px;
  padding: 7px 11px;
  cursor: pointer;
  font-size: 10px;
  font-weight: 750;
}

.result-save-button:hover {
  background: #1d4ed8;
}

.result-save-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.results-grading-card {
  margin-top: 20px;
}

.grading-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1px;
  background: #edf1f6;
}

.grading-grid > div {
  background: #ffffff;
  padding: 15px;
  text-align: center;
}

.grading-grid strong,
.grading-grid span,
.grading-grid small {
  display: block;
}

.grading-grid strong {
  color: #2563eb;
  font-size: 18px;
  margin-bottom: 3px;
}

.grading-grid span {
  color: #334155;
  font-size: 11px;
  font-weight: 700;
}

.grading-grid small {
  color: #94a3b8;
  font-size: 9px;
  margin-top: 3px;
}

@media (max-width: 800px) {

  .results-assignment-summary {
    grid-template-columns: 1fr 1fr;
  }

  .grading-grid {
    grid-template-columns: repeat(2, 1fr);
  }

}

@media (max-width: 500px) {

  .results-assignment-summary {
    grid-template-columns: 1fr;
  }

  .grading-grid {
    grid-template-columns: 1fr;
  }

}

`;

export default TeacherResults;
