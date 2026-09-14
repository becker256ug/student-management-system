import React, { useEffect, useMemo, useState } from "react";

const API_BASE = "http://localhost:5000/api";

const StudentResults = ({ auth, onLogout }) => {
  const [student, setStudent] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = auth?.token;

  /*
  |--------------------------------------------------------------------------
  | FETCH STUDENT RESULTS
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const fetchStudentResults = async () => {
      if (!token) {
        setLoading(false);
        setError("Authentication required.");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_BASE}/results/student`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.status === 401 || response.status === 403) {
          if (onLogout) {
            onLogout();
          }

          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message || "Failed to fetch results."
          );
        }

        setStudent(data?.student || null);
        setResults(
          Array.isArray(data?.results)
            ? data.results
            : []
        );
      } catch (err) {
        console.error(
          "Student results error:",
          err
        );

        setError(
          err.message ||
            "Failed to load your results."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStudentResults();
  }, [token, onLogout]);

  /*
  |--------------------------------------------------------------------------
  | GROUP RESULTS
  |--------------------------------------------------------------------------
  |
  | Results are grouped by academic year and semester.
  |
  |--------------------------------------------------------------------------
  */

  const groupedResults = useMemo(() => {
    const groups = {};

    results.forEach((result) => {
      const academicYear =
        result.academic_year_name ||
        "Academic Year";

      const semester =
        result.semester_name ||
        "Semester";

      const key = `${academicYear}|||${semester}`;

      if (!groups[key]) {
        groups[key] = {
          academicYear,
          semester,
          results: [],
        };
      }

      groups[key].results.push(result);
    });

    return Object.values(groups);
  }, [results]);

  /*
  |--------------------------------------------------------------------------
  | GRADE HELPERS
  |--------------------------------------------------------------------------
  */

  const getGradeClass = (grade) => {
    switch (grade) {
      case "A":
        return "grade-a";

      case "B":
        return "grade-b";

      case "C":
        return "grade-c";

      case "D":
        return "grade-d";

      case "F":
        return "grade-f";

      default:
        return "";
    }
  };

  /*
  |--------------------------------------------------------------------------
  | FORMAT MARKS
  |--------------------------------------------------------------------------
  */

  const formatMarks = (value) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "-";
    }

    const number = Number(value);

    if (Number.isNaN(number)) {
      return value;
    }

    return Number.isInteger(number)
      ? number
      : number.toFixed(2);
  };

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <>
        <style>{studentResultsStyles}</style>

        <div className="student-results-page">
          <div className="student-results-loading">
            <div className="loading-spinner"></div>

            <p>
              Loading your results...
            </p>
          </div>
        </div>
      </>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | ERROR
  |--------------------------------------------------------------------------
  */

  if (error) {
    return (
      <>
        <style>{studentResultsStyles}</style>

        <div className="student-results-page">
          <div className="student-results-header">
            <div>
              <div className="page-label">
                ACADEMIC MANAGEMENT
              </div>

              <h1>My Results</h1>

              <p>
                View your academic performance
              </p>
            </div>
          </div>

          <div className="student-results-error">
            <div className="error-icon">
              !
            </div>

            <div>
              <h3>
                Unable to load results
              </h3>

              <p>{error}</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | PAGE
  |--------------------------------------------------------------------------
  */

  return (
    <>
      <style>{studentResultsStyles}</style>

      <div className="student-results-page">

        {/* --------------------------------------------------------------- */}
        {/* PAGE HEADER */}
        {/* --------------------------------------------------------------- */}

        <div className="student-results-header">
          <div>
            <div className="page-label">
              ACADEMIC MANAGEMENT
            </div>

            <h1>
              My Results
            </h1>

            <p>
              View your academic performance and
              semester results
            </p>
          </div>
        </div>


        {/* --------------------------------------------------------------- */}
        {/* STUDENT INFORMATION */}
        {/* --------------------------------------------------------------- */}

        {student && (
          <div className="student-information-card">

            <div className="student-avatar">
              {student.first_name
                ? student.first_name
                    .charAt(0)
                    .toUpperCase()
                : "S"}
            </div>

            <div className="student-information">
              <h2>
                {student.first_name}{" "}
                {student.last_name}
              </h2>

              <div className="student-details">
                <div>
                  <span>
                    Student Number
                  </span>

                  <strong>
                    {student.student_number ||
                      "-"}
                  </strong>
                </div>
              </div>
            </div>

          </div>
        )}


        {/* --------------------------------------------------------------- */}
        {/* NO RESULTS */}
        {/* --------------------------------------------------------------- */}

        {results.length === 0 ? (
          <div className="no-results-card">

            <div className="no-results-icon">
              📊
            </div>

            <h2>
              No Results Available
            </h2>

            <p>
              Your academic results have not
              been published yet.
            </p>

          </div>
        ) : (

          /* ------------------------------------------------------------- */
          /* RESULTS GROUPS */
          /* ------------------------------------------------------------- */

          <div className="results-container">

            {groupedResults.map(
              (group, groupIndex) => (
                <div
                  className="semester-results-card"
                  key={`${group.academicYear}-${group.semester}-${groupIndex}`}
                >

                  {/* --------------------------------------------------- */}
                  {/* SEMESTER HEADER */}
                  {/* --------------------------------------------------- */}

                  <div className="semester-header">

                    <div>
                      <h2>
                        {group.academicYear}
                      </h2>

                      <p>
                        {group.semester}
                      </p>
                    </div>

                    <div className="results-count">
                      {group.results.length}{" "}
                      {group.results.length === 1
                        ? "Subject"
                        : "Subjects"}
                    </div>

                  </div>


                  {/* --------------------------------------------------- */}
                  {/* RESULTS TABLE */}
                  {/* --------------------------------------------------- */}

                  <div className="results-table-wrapper">

                    <table className="results-table">

                      <thead>
                        <tr>

                          <th>
                            #
                          </th>

                          <th>
                            Subject
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

                        </tr>
                      </thead>

                      <tbody>

                        {group.results.map(
                          (
                            result,
                            index
                          ) => (
                            <tr
                              key={
                                result.id ||
                                `${result.subject_id}-${index}`
                              }
                            >

                              <td className="number-cell">
                                {index + 1}
                              </td>

                              <td className="subject-cell">

                                <div className="subject-name">
                                  {
                                    result.subject_name
                                  }
                                </div>

                                {result.subject_code && (
                                  <div className="subject-code">
                                    {
                                      result.subject_code
                                    }
                                  </div>
                                )}

                              </td>

                              <td>
                                <span className="mark">
                                  {formatMarks(
                                    result.beginning_marks
                                  )}
                                </span>
                              </td>

                              <td>
                                <span className="mark">
                                  {formatMarks(
                                    result.midsemester_marks
                                  )}
                                </span>
                              </td>

                              <td>
                                <span className="mark">
                                  {formatMarks(
                                    result.final_marks
                                  )}
                                </span>
                              </td>

                              <td className="total-cell">
                                <strong>
                                  {formatMarks(
                                    result.marks
                                  )}
                                </strong>
                              </td>

                              <td>

                                <span
                                  className={`grade-badge ${getGradeClass(
                                    result.grade
                                  )}`}
                                >
                                  {result.grade ||
                                    "-"}
                                </span>

                              </td>

                              <td className="remarks-cell">
                                {result.remarks ||
                                  "-"}
                              </td>

                            </tr>
                          )
                        )}

                      </tbody>

                    </table>

                  </div>


                  {/* --------------------------------------------------- */}
                  {/* GRADING SCALE */}
                  {/* --------------------------------------------------- */}

                  <div className="grading-scale">

                    <div className="grading-title">
                      Grading Scale
                    </div>

                    <div className="grading-items">

                      <div>
                        <strong className="scale-a">
                          A
                        </strong>
                        <span>
                          80–100 Excellent
                        </span>
                      </div>

                      <div>
                        <strong className="scale-b">
                          B
                        </strong>
                        <span>
                          70–79 Very Good
                        </span>
                      </div>

                      <div>
                        <strong className="scale-c">
                          C
                        </strong>
                        <span>
                          60–69 Good
                        </span>
                      </div>

                      <div>
                        <strong className="scale-d">
                          D
                        </strong>
                        <span>
                          50–59 Pass
                        </span>
                      </div>

                      <div>
                        <strong className="scale-f">
                          F
                        </strong>
                        <span>
                          0–49 Fail
                        </span>
                      </div>

                    </div>

                  </div>

                </div>
              )
            )}

          </div>
        )}

      </div>
    </>
  );
};


/*
|--------------------------------------------------------------------------
| STYLES
|--------------------------------------------------------------------------
*/

const studentResultsStyles = `

.student-results-page {
  width: 100%;
  padding: 28px;
  box-sizing: border-box;
  background: #f7f8fa;
  min-height: 100%;
}


/* -----------------------------------------------------------------------
   HEADER
------------------------------------------------------------------------ */

.student-results-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.page-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.2px;
  color: #7b8190;
  margin-bottom: 7px;
}

.student-results-header h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #20242b;
}

.student-results-header p {
  margin: 7px 0 0;
  color: #747b88;
  font-size: 14px;
}


/* -----------------------------------------------------------------------
   STUDENT INFORMATION
------------------------------------------------------------------------ */

.student-information-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #ffffff;
  border: 1px solid #e6e8ec;
  border-radius: 12px;
  padding: 18px 20px;
  margin-bottom: 24px;
  box-shadow: 0 2px 7px rgba(0, 0, 0, 0.03);
}

.student-avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #eef1f5;
  color: #303641;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
}

.student-information h2 {
  margin: 0;
  color: #20242b;
  font-size: 18px;
}

.student-details {
  display: flex;
  margin-top: 6px;
}

.student-details div {
  display: flex;
  gap: 8px;
  align-items: center;
}

.student-details span {
  color: #858b96;
  font-size: 12px;
}

.student-details strong {
  color: #343943;
  font-size: 13px;
}


/* -----------------------------------------------------------------------
   RESULTS CARD
------------------------------------------------------------------------ */

.semester-results-card {
  background: #ffffff;
  border: 1px solid #e4e7eb;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}


/* -----------------------------------------------------------------------
   SEMESTER HEADER
------------------------------------------------------------------------ */

.semester-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 22px;
  border-bottom: 1px solid #e8eaee;
}

.semester-header h2 {
  margin: 0;
  font-size: 18px;
  color: #252932;
}

.semester-header p {
  margin: 5px 0 0;
  color: #777e8a;
  font-size: 13px;
}

.results-count {
  padding: 7px 12px;
  border-radius: 20px;
  background: #f1f3f6;
  color: #59606c;
  font-size: 12px;
  font-weight: 600;
}


/* -----------------------------------------------------------------------
   TABLE
------------------------------------------------------------------------ */

.results-table-wrapper {
  width: 100%;
  overflow-x: auto;
}

.results-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 900px;
}

.results-table th {
  background: #f8f9fb;
  color: #656c78;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  padding: 13px 12px;
  text-align: left;
  border-bottom: 1px solid #e5e8ed;
  white-space: nowrap;
}

.results-table th span {
  display: block;
  color: #969ca6;
  font-size: 9px;
  font-weight: 600;
  margin-top: 2px;
}

.results-table td {
  padding: 14px 12px;
  border-bottom: 1px solid #edf0f3;
  color: #424852;
  font-size: 13px;
  vertical-align: middle;
}

.results-table tbody tr:last-child td {
  border-bottom: none;
}

.results-table tbody tr:hover {
  background: #fafbfc;
}

.number-cell {
  width: 35px;
  color: #969ca6 !important;
  font-size: 12px !important;
}

.subject-cell {
  min-width: 180px;
}

.subject-name {
  font-weight: 600;
  color: #2c3139;
}

.subject-code {
  color: #9399a3;
  font-size: 10px;
  margin-top: 3px;
  text-transform: uppercase;
}

.mark {
  font-weight: 500;
  color: #464c56;
}

.total-cell strong {
  color: #20252d;
  font-size: 14px;
}


/* -----------------------------------------------------------------------
   GRADE BADGES
------------------------------------------------------------------------ */

.grade-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 30px;
  height: 30px;
  padding: 0 8px;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 800;
}

.grade-a {
  background: #e8f5ec;
  color: #25753b;
}

.grade-b {
  background: #eaf2fb;
  color: #28639a;
}

.grade-c {
  background: #fff5df;
  color: #9a6a14;
}

.grade-d {
  background: #fef0e3;
  color: #a85d1a;
}

.grade-f {
  background: #fbe9e9;
  color: #a83a3a;
}

.remarks-cell {
  color: #6d737e !important;
}


/* -----------------------------------------------------------------------
   GRADING SCALE
------------------------------------------------------------------------ */

.grading-scale {
  border-top: 1px solid #e7e9ed;
  padding: 15px 20px;
  background: #fbfcfd;
}

.grading-title {
  color: #6e7480;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin-bottom: 10px;
}

.grading-items {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.grading-items > div {
  display: flex;
  align-items: center;
  gap: 6px;
}

.grading-items strong {
  font-size: 11px;
}

.grading-items span {
  color: #777e89;
  font-size: 11px;
}

.scale-a {
  color: #25753b;
}

.scale-b {
  color: #28639a;
}

.scale-c {
  color: #9a6a14;
}

.scale-d {
  color: #a85d1a;
}

.scale-f {
  color: #a83a3a;
}


/* -----------------------------------------------------------------------
   NO RESULTS
------------------------------------------------------------------------ */

.no-results-card {
  background: #ffffff;
  border: 1px solid #e5e8ed;
  border-radius: 12px;
  padding: 55px 20px;
  text-align: center;
  box-shadow: 0 2px 7px rgba(0, 0, 0, 0.03);
}

.no-results-icon {
  font-size: 38px;
  margin-bottom: 12px;
}

.no-results-card h2 {
  margin: 0;
  color: #30353e;
  font-size: 18px;
}

.no-results-card p {
  margin: 8px 0 0;
  color: #808792;
  font-size: 13px;
}


/* -----------------------------------------------------------------------
   ERROR
------------------------------------------------------------------------ */

.student-results-error {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  background: #ffffff;
  border: 1px solid #efd7d7;
  border-radius: 12px;
  padding: 20px;
}

.error-icon {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: 50%;
  background: #fbe9e9;
  color: #a83a3a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
}

.student-results-error h3 {
  margin: 0;
  color: #8f3737;
  font-size: 15px;
}

.student-results-error p {
  margin: 5px 0 0;
  color: #737982;
  font-size: 13px;
}


/* -----------------------------------------------------------------------
   LOADING
------------------------------------------------------------------------ */

.student-results-loading {
  min-height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #777e88;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e4e7eb;
  border-top-color: #6d737d;
  border-radius: 50%;
  animation: studentResultsSpin 0.8s linear infinite;
  margin-bottom: 12px;
}

.student-results-loading p {
  margin: 0;
  font-size: 13px;
}

@keyframes studentResultsSpin {
  to {
    transform: rotate(360deg);
  }
}


/* -----------------------------------------------------------------------
   RESPONSIVE
------------------------------------------------------------------------ */

@media (max-width: 768px) {

  .student-results-page {
    padding: 18px;
  }

  .student-results-header h1 {
    font-size: 23px;
  }

  .student-information-card {
    padding: 15px;
  }

  .semester-header {
    padding: 16px;
  }

  .grading-items {
    gap: 10px;
  }

}

`;

export default StudentResults;