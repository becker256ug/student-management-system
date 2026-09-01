import { useState } from "react";

const initialForm = {
  student_number: "",
  first_name: "",
  last_name: "",
  gender: "",
  date_of_birth: "",
  email: "",
  phone: "",
  address: "",
  guardian_name: "",
  guardian_phone: "",
  class_name: "",
};

function StudentRegistration() {
  const [formData, setFormData] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (
      !formData.student_number ||
      !formData.first_name ||
      !formData.last_name ||
      !formData.gender ||
      !formData.date_of_birth
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/students",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to register student.");
      }

      setMessage(
        `Student registered successfully! Student ID: ${data.studentId}`
      );

      setFormData(initialForm);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="registration-container">
      <div className="registration-card">
        <div className="registration-header">
          <h1>Student Registration</h1>
          <p>Enter the student's information below.</p>
        </div>

        {message && <div className="success-message">{message}</div>}

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <section>
            <h2>Student Information</h2>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="student_number">
                  Student Number <span>*</span>
                </label>

                <input
                  id="student_number"
                  name="student_number"
                  type="text"
                  value={formData.student_number}
                  onChange={handleChange}
                  placeholder="e.g. STU002"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="first_name">
                  First Name <span>*</span>
                </label>

                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="Enter first name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="last_name">
                  Last Name <span>*</span>
                </label>

                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Enter last name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="gender">
                  Gender <span>*</span>
                </label>

                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="date_of_birth">
                  Date of Birth <span>*</span>
                </label>

                <input
                  id="date_of_birth"
                  name="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="student@example.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>

                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="0700000000"
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="address">Address</label>

                <input
                  id="address"
                  name="address"
                  type="text"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter student's address"
                />
              </div>
            </div>
          </section>

          <section>
            <h2>Parent / Guardian Information</h2>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="guardian_name">Guardian Name</label>

                <input
                  id="guardian_name"
                  name="guardian_name"
                  type="text"
                  value={formData.guardian_name}
                  onChange={handleChange}
                  placeholder="Enter guardian name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="guardian_phone">Guardian Phone</label>

                <input
                  id="guardian_phone"
                  name="guardian_phone"
                  type="tel"
                  value={formData.guardian_phone}
                  onChange={handleChange}
                  placeholder="0700000000"
                />
              </div>
            </div>
          </section>

          <section>
            <h2>Academic Information</h2>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="class_name">Class / Program</label>

                <input
                  id="class_name"
                  name="class_name"
                  type="text"
                  value={formData.class_name}
                  onChange={handleChange}
                  placeholder="e.g. Senior One"
                />
              </div>
            </div>
          </section>

          <button
            type="submit"
            className="register-button"
            disabled={loading}
          >
            {loading ? "Registering..." : "Register Student"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default StudentRegistration;