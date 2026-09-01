import { useEffect, useState } from "react";

function StudentList() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("http://localhost:5000/api/students");

      if (!response.ok) {
        throw new Error("Failed to fetch students");
      }

      const data = await response.json();
      setStudents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter((student) => {
    const searchTerm = search.toLowerCase();

    return (
      student.student_number?.toLowerCase().includes(searchTerm) ||
      student.first_name?.toLowerCase().includes(searchTerm) ||
      student.last_name?.toLowerCase().includes(searchTerm) ||
      student.email?.toLowerCase().includes(searchTerm) ||
      student.class_name?.toLowerCase().includes(searchTerm)
    );
  });

  return (
    <div className="student-list-container">
      <div className="student-list-card">
        <div className="student-list-header">
          <div>
            <h1>Student List</h1>
            <p>View all registered students</p>
          </div>

          <button onClick={fetchStudents} className="refresh-button">
            Refresh
          </button>
        </div>

        <div className="search-container">
          <input
            type="text"
            placeholder="Search by student number, name, email or class..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading && <p className="list-message">Loading students...</p>}

        {error && <p className="list-error">{error}</p>}

        {!loading && !error && (
          <>
            <p className="student-count">
              Showing {filteredStudents.length} of {students.length} students
            </p>

            {filteredStudents.length === 0 ? (
              <p className="list-message">No students found.</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Student Number</th>
                      <th>Name</th>
                      <th>Gender</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Class / Program</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredStudents.map((student) => (
                      <tr key={student.id}>
                        <td>{student.student_number}</td>

                        <td>
                          {student.first_name} {student.last_name}
                        </td>

                        <td>{student.gender}</td>

                        <td>{student.email}</td>

                        <td>{student.phone}</td>

                        <td>{student.class_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default StudentList;