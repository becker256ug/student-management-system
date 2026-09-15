import React, { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const StudentReportCard = ({ auth, onLogout }) => {
  const [student, setStudent] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | FETCH STUDENT RESULTS
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        setError("");

        const token = auth?.token;

        if (!token) {
          setError("Authentication token is missing.");
          return;
        }

        const response = await fetch(
          `${API_BASE}/results/student`,
          {
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
            data.message || "Failed to load report card."
          );
        }

        setStudent(data.student || null);
        setResults(Array.isArray(data.results) ? data.results : []);
      } catch (err) {
        console.error("Student report card error:", err);
        setError(
          err.message || "Failed to load report card."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [auth, onLogout]);

  /*
  |--------------------------------------------------------------------------
  | GROUP RESULTS
  |--------------------------------------------------------------------------
  |
  | One report card is displayed for each Academic Year + Semester.
  |
  */

  const reportCards = useMemo(() => {
    const groups = {};

    results.forEach((result) => {
      const key = `${result.academic_year_id}-${result.semester_id}`;

      if (!groups[key]) {
        groups[key] = {
          academic_year_id: result.academic_year_id,
          academic_year_name: result.academic_year_name,
          semester_id: result.semester_id,
          semester_name: result.semester_name,
          class_id: result.class_id,
          class_name: result.class_name,
          class_code: result.class_code,
          subjects: [],
        };
      }

      groups[key].subjects.push(result);
    });

    return Object.values(groups);
  }, [results]);

  /*
  |--------------------------------------------------------------------------
  | PRINT
  |--------------------------------------------------------------------------
  */

  const handlePrint = () => {
    window.print();
  };

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div style={styles.centerMessage}>
        <div style={styles.spinner}></div>
        <p>Loading report card...</p>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | ERROR
  |--------------------------------------------------------------------------
  */

  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.errorBox}>
          <h3>Unable to Load Report Card</h3>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            style={styles.retryButton}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | NO RESULTS
  |--------------------------------------------------------------------------
  */

  if (!student || reportCards.length === 0) {
    return (
      <div style={styles.page}>
        <div style={styles.emptyBox}>
          <h2>Report Card</h2>
          <p>
            No examination results are currently available
            for your account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>

      {/* ================================================================
          PAGE HEADER
      ================================================================= */}

      <div className="no-print" style={styles.topBar}>
        <div>
          <h2 style={styles.pageTitle}>
            Student Report Card
          </h2>

          <p style={styles.pageSubtitle}>
            Academic performance report
          </p>
        </div>

        <button
          onClick={handlePrint}
          style={styles.printButton}
        >
          🖨️ Print Report Card
        </button>
      </div>

      {/* ================================================================
          REPORT CARDS
      ================================================================= */}

      {reportCards.map((report, index) => {
        const totalMarks = report.subjects.reduce(
          (sum, item) =>
            sum + Number(item.marks || 0),
          0
        );

        const subjectCount = report.subjects.length;

        const average =
          subjectCount > 0
            ? totalMarks / subjectCount
            : 0;

        const passedSubjects =
          report.subjects.filter(
            (item) => Number(item.marks || 0) >= 50
          ).length;

        const failedSubjects =
          report.subjects.filter(
            (item) => Number(item.marks || 0) < 50
          ).length;

        return (
          <div
            key={`${report.academic_year_id}-${report.semester_id}`}
            className="report-card"
            style={styles.reportCard}
          >

            {/* ============================================================
                SCHOOL HEADER
            ========================================================= */}

            <div style={styles.schoolHeader}>

              <div style={styles.logoPlaceholder}>
                SCHOOL
              </div>

              <div style={styles.schoolInformation}>
                <h1 style={styles.schoolName}>
                  STUDENTHUB SCHOOL
                </h1>

                <p style={styles.schoolAddress}>
                  SCHOOL MANAGEMENT SYSTEM
                </p>

                <p style={styles.reportTitle}>
                  STUDENT ACADEMIC REPORT CARD
                </p>
              </div>

              <div style={styles.logoPlaceholder}>
                SCHOOL
              </div>

            </div>

            <div style={styles.headerLine}></div>

            {/* ============================================================
                ACADEMIC INFORMATION
            ============================================================= */}

            <div style={styles.academicHeader}>
              <div>
                <strong>Academic Year:</strong>{" "}
                {report.academic_year_name}
              </div>

              <div>
                <strong>Semester:</strong>{" "}
                {report.semester_name}
              </div>

              <div>
                <strong>Class:</strong>{" "}
                {report.class_name}
                {report.class_code
                  ? ` (${report.class_code})`
                  : ""}
              </div>
            </div>

            {/* ============================================================
                STUDENT INFORMATION
            ============================================================= */}

            <div style={styles.studentInfo}>

              <div>
                <span style={styles.infoLabel}>
                  Student Name
                </span>

                <strong>
                  {student.first_name}{" "}
                  {student.last_name}
                </strong>
              </div>

              <div>
                <span style={styles.infoLabel}>
                  Student Number
                </span>

                <strong>
                  {student.student_number}
                </strong>
              </div>

              <div>
                <span style={styles.infoLabel}>
                  Class
                </span>

                <strong>
                  {report.class_name}
                </strong>
              </div>

            </div>

            {/* ============================================================
                RESULTS TABLE
            ============================================================= */}

            <table style={styles.resultsTable}>

              <thead>
                <tr>
                  <th style={styles.th}>No.</th>
                  <th style={styles.th}>Subject</th>
                  <th style={styles.th}>Code</th>
                  <th style={styles.th}>Beginning<br />(20)</th>
                  <th style={styles.th}>Mid-Semester<br />(20)</th>
                  <th style={styles.th}>Final<br />(60)</th>
                  <th style={styles.th}>Total<br />(100)</th>
                  <th style={styles.th}>Grade</th>
                  <th style={styles.th}>Remarks</th>
                </tr>
              </thead>

              <tbody>
                {report.subjects.map((result, subjectIndex) => (
                  <tr key={result.id}>

                    <td style={styles.td}>
                      {subjectIndex + 1}
                    </td>

                    <td
                      style={{
                        ...styles.td,
                        textAlign: "left",
                        fontWeight: 600,
                      }}
                    >
                      {result.subject_name}
                    </td>

                    <td style={styles.td}>
                      {result.subject_code || "-"}
                    </td>

                    <td style={styles.td}>
                      {Number(
                        result.beginning_marks || 0
                      ).toFixed(0)}
                    </td>

                    <td style={styles.td}>
                      {Number(
                        result.midsemester_marks || 0
                      ).toFixed(0)}
                    </td>

                    <td style={styles.td}>
                      {Number(
                        result.final_marks || 0
                      ).toFixed(0)}
                    </td>

                    <td
                      style={{
                        ...styles.td,
                        fontWeight: 700,
                      }}
                    >
                      {Number(
                        result.marks || 0
                      ).toFixed(0)}
                    </td>

                    <td
                      style={{
                        ...styles.td,
                        fontWeight: 700,
                      }}
                    >
                      {result.grade || "-"}
                    </td>

                    <td style={styles.td}>
                      {result.remarks || "-"}
                    </td>

                  </tr>
                ))}

                {/* TOTAL ROW */}

                <tr>
                  <td
                    colSpan="6"
                    style={{
                      ...styles.td,
                      textAlign: "right",
                      fontWeight: 700,
                    }}
                  >
                    TOTAL
                  </td>

                  <td
                    style={{
                      ...styles.td,
                      fontWeight: 700,
                    }}
                  >
                    {totalMarks.toFixed(0)}
                  </td>

                  <td
                    colSpan="2"
                    style={styles.td}
                  >
                    -
                  </td>
                </tr>

              </tbody>
            </table>

            {/* ============================================================
                PERFORMANCE SUMMARY
            ============================================================= */}

            <div style={styles.summarySection}>

              <div style={styles.summaryBox}>
                <span>Total Subjects</span>
                <strong>{subjectCount}</strong>
              </div>

              <div style={styles.summaryBox}>
                <span>Total Marks</span>
                <strong>
                  {totalMarks.toFixed(0)}
                </strong>
              </div>

              <div style={styles.summaryBox}>
                <span>Average</span>
                <strong>
                  {average.toFixed(2)}%
                </strong>
              </div>

              <div style={styles.summaryBox}>
                <span>Passed</span>
                <strong>
                  {passedSubjects}
                </strong>
              </div>

              <div style={styles.summaryBox}>
                <span>Failed</span>
                <strong>
                  {failedSubjects}
                </strong>
              </div>

            </div>

            {/* ============================================================
                GRADING SCALE
            ============================================================= */}

            <div style={styles.gradingSection}>

              <h3 style={styles.sectionTitle}>
                Grading Scale
              </h3>

              <table style={styles.gradingTable}>
                <tbody>
                  <tr>
                    <td>A</td>
                    <td>80 - 100</td>
                    <td>Excellent</td>

                    <td>B</td>
                    <td>70 - 79</td>
                    <td>Very Good</td>
                  </tr>

                  <tr>
                    <td>C</td>
                    <td>60 - 69</td>
                    <td>Good</td>

                    <td>D</td>
                    <td>50 - 59</td>
                    <td>Pass</td>
                  </tr>

                  <tr>
                    <td>F</td>
                    <td>0 - 49</td>
                    <td>Fail</td>

                    <td colSpan="3">
                      Pass Mark: 50%
                    </td>
                  </tr>
                </tbody>
              </table>

            </div>

            {/* ============================================================
                ACADEMIC COMMENTS
            ============================================================= */}

            <div style={styles.commentsSection}>

              <h3 style={styles.sectionTitle}>
                Academic Comments
              </h3>

              <div style={styles.commentLine}></div>
              <div style={styles.commentLine}></div>
              <div style={styles.commentLine}></div>

            </div>

            {/* ============================================================
                SIGNATURES
            ============================================================= */}

            <div style={styles.signatures}>

              <div style={styles.signatureBox}>
                <div style={styles.signatureLine}></div>
                <strong>Class Teacher</strong>
              </div>

              <div style={styles.signatureBox}>
                <div style={styles.signatureLine}></div>
                <strong>Head Teacher</strong>
              </div>

              <div style={styles.signatureBox}>
                <div style={styles.signatureLine}></div>
                <strong>Parent / Guardian</strong>
              </div>

            </div>

            {/* ============================================================
                FOOTER
            ============================================================= */}

            <div style={styles.footer}>
              <p>
                This report card is generated by
                StudentHub School Management System.
              </p>

              <p>
                Academic Year:{" "}
                {report.academic_year_name} |
                Semester: {report.semester_name}
              </p>
            </div>

            {index < reportCards.length - 1 && (
              <div className="page-break"></div>
            )}

          </div>
        );
      })}

      {/* ================================================================
          PRINT CSS
      ================================================================= */}

      <style>{`
        @media print {

          @page {
            size: A4 portrait;
            margin: 12mm;
          }

          body {
            background: white !important;
          }

          .no-print {
            display: none !important;
          }

          .report-card {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }

          .page-break {
            page-break-after: always;
          }
        }

        @media screen {

          .report-card {
            max-width: 900px;
            margin: 25px auto;
          }
        }
      `}</style>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| STYLES
|--------------------------------------------------------------------------
*/

const styles = {
  page: {
    minHeight: "100%",
    padding: "20px",
    background: "#f4f6f8",
    boxSizing: "border-box",
  },

  topBar: {
    maxWidth: "900px",
    margin: "0 auto 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
  },

  pageTitle: {
    margin: 0,
    fontSize: "24px",
    fontWeight: 700,
  },

  pageSubtitle: {
    margin: "5px 0 0",
    color: "#666",
  },

  printButton: {
    border: "none",
    borderRadius: "8px",
    padding: "11px 18px",
    background: "#1f2937",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
  },

  reportCard: {
    background: "#fff",
    padding: "35px",
    borderRadius: "8px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
    boxSizing: "border-box",
  },

  schoolHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
  },

  logoPlaceholder: {
    width: "70px",
    height: "70px",
    border: "2px solid #333",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: 700,
  },

  schoolInformation: {
    flex: 1,
    textAlign: "center",
  },

  schoolName: {
    margin: 0,
    fontSize: "25px",
    fontWeight: 800,
    letterSpacing: "1px",
  },

  schoolAddress: {
    margin: "5px 0",
    fontSize: "12px",
    color: "#555",
  },

  reportTitle: {
    margin: "8px 0 0",
    fontSize: "16px",
    fontWeight: 700,
  },

  headerLine: {
    height: "2px",
    background: "#222",
    margin: "15px 0",
  },

  academicHeader: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px",
    padding: "12px",
    background: "#f3f4f6",
    border: "1px solid #ddd",
    fontSize: "13px",
  },

  studentInfo: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr",
    gap: "15px",
    margin: "15px 0",
    padding: "14px",
    border: "1px solid #ddd",
  },

  infoLabel: {
    display: "block",
    fontSize: "11px",
    color: "#666",
    marginBottom: "4px",
    textTransform: "uppercase",
  },

  resultsTable: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "11px",
  },

  th: {
    border: "1px solid #333",
    padding: "8px 5px",
    textAlign: "center",
    background: "#e5e7eb",
    fontWeight: 700,
  },

  td: {
    border: "1px solid #555",
    padding: "7px 5px",
    textAlign: "center",
  },

  summarySection: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: "8px",
    marginTop: "18px",
  },

  summaryBox: {
    border: "1px solid #ccc",
    padding: "10px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },

  gradingSection: {
    marginTop: "20px",
  },

  sectionTitle: {
    fontSize: "14px",
    margin: "0 0 8px",
    fontWeight: 700,
  },

  gradingTable: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "11px",
  },

  commentsSection: {
    marginTop: "20px",
  },

  commentLine: {
    height: "25px",
    borderBottom: "1px solid #aaa",
  },

  signatures: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "30px",
    marginTop: "45px",
    textAlign: "center",
    fontSize: "12px",
  },

  signatureBox: {
    minHeight: "50px",
  },

  signatureLine: {
    borderTop: "1px solid #333",
    marginBottom: "8px",
  },

  footer: {
    marginTop: "35px",
    paddingTop: "10px",
    borderTop: "1px solid #ccc",
    textAlign: "center",
    fontSize: "9px",
    color: "#666",
  },

  centerMessage: {
    minHeight: "300px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },

  spinner: {
    width: "30px",
    height: "30px",
    border: "4px solid #ddd",
    borderTop: "4px solid #333",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },

  errorBox: {
    maxWidth: "600px",
    margin: "60px auto",
    padding: "30px",
    background: "#fff",
    borderRadius: "10px",
    textAlign: "center",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
  },

  retryButton: {
    border: "none",
    padding: "10px 18px",
    borderRadius: "6px",
    background: "#333",
    color: "#fff",
    cursor: "pointer",
  },

  emptyBox: {
    maxWidth: "600px",
    margin: "60px auto",
    padding: "40px",
    background: "#fff",
    borderRadius: "10px",
    textAlign: "center",
  },
};

export default StudentReportCard;

