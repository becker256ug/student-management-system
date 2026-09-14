const db = require("../config/db");

/*
|--------------------------------------------------------------------------
| CREATE TEACHER ASSIGNMENT
|--------------------------------------------------------------------------
*/
const createTeacherAssignment = async (req, res) => {
  try {
    const {
      teacher_id,
      class_subject_id,
      semester_id,
    } = req.body;

    if (
      !teacher_id ||
      !class_subject_id ||
      !semester_id
    ) {
      return res.status(400).json({
        message:
          "teacher_id, class_subject_id and semester_id are required.",
      });
    }

    /*
     * Check teacher
     */
    const [teachers] = await db.execute(
      `
      SELECT id, status
      FROM teachers
      WHERE id = ?
      LIMIT 1
      `,
      [teacher_id]
    );

    if (teachers.length === 0) {
      return res.status(404).json({
        message: "Teacher not found.",
      });
    }

    if (teachers[0].status === "inactive") {
      return res.status(400).json({
        message:
          "This teacher is inactive and cannot receive a new assignment.",
      });
    }

    /*
     * Check class subject
     */
    const [classSubjects] = await db.execute(
      `
      SELECT id
      FROM class_subjects
      WHERE id = ?
      LIMIT 1
      `,
      [class_subject_id]
    );

    if (classSubjects.length === 0) {
      return res.status(404).json({
        message:
          "Class subject assignment not found.",
      });
    }

    /*
     * Check semester
     */
    const [semesters] = await db.execute(
      `
      SELECT id
      FROM semesters
      WHERE id = ?
      LIMIT 1
      `,
      [semester_id]
    );

    if (semesters.length === 0) {
      return res.status(404).json({
        message: "Semester not found.",
      });
    }

    /*
     * Check duplicate assignment
     */
    const [existingAssignment] =
      await db.execute(
        `
        SELECT id
        FROM teacher_assignments
        WHERE teacher_id = ?
          AND class_subject_id = ?
          AND semester_id = ?
        LIMIT 1
        `,
        [
          teacher_id,
          class_subject_id,
          semester_id,
        ]
      );

    if (existingAssignment.length > 0) {
      return res.status(409).json({
        message:
          "Teacher is already assigned to this class subject for this semester.",
      });
    }

    /*
     * Create assignment
     */
    const [result] = await db.execute(
      `
      INSERT INTO teacher_assignments
      (
        teacher_id,
        class_subject_id,
        semester_id,
        status
      )
      VALUES (?, ?, ?, 'active')
      `,
      [
        teacher_id,
        class_subject_id,
        semester_id,
      ]
    );

    return res.status(201).json({
      message:
        "Teacher assigned successfully.",
      teacherAssignmentId:
        result.insertId,
    });
  } catch (error) {
    console.error(
      "Create teacher assignment error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to create teacher assignment.",
    });
  }
};


/*
|--------------------------------------------------------------------------
| GET TEACHER ASSIGNMENTS
|--------------------------------------------------------------------------
*/
const getTeacherAssignments = async (
  req,
  res
) => {
  try {
    let query = `
      SELECT
        ta.id,
        ta.teacher_id,

        CONCAT(
          t.first_name,
          ' ',
          t.last_name
        ) AS teacher_name,

        ta.class_subject_id,

        c.name AS class_name,
        c.code AS class_code,

        s.name AS subject_name,
        s.code AS subject_code,

        ta.semester_id,
        sem.name AS semester,

        ta.status,

        ta.created_at,
        ta.updated_at

      FROM teacher_assignments ta

      INNER JOIN teachers t
        ON ta.teacher_id = t.id

      INNER JOIN class_subjects cs
        ON ta.class_subject_id = cs.id

      INNER JOIN classes c
        ON cs.class_id = c.id

      INNER JOIN subjects s
        ON cs.subject_id = s.id

      INNER JOIN semesters sem
        ON ta.semester_id = sem.id
    `;

    const params = [];

    /*
     * Teachers only see their own assignments.
     */
    if (req.user.role === "teacher") {
      query += `
        WHERE t.user_id = ?
      `;

      params.push(req.user.id);
    }

    query += `
      ORDER BY ta.created_at DESC
    `;

    const [assignments] =
      await db.execute(
        query,
        params
      );

    return res.json(assignments);
  } catch (error) {
    console.error(
      "Get teacher assignments error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch teacher assignments.",
    });
  }
};


/*
|--------------------------------------------------------------------------
| GET ONE TEACHER ASSIGNMENT
|--------------------------------------------------------------------------
*/
const getTeacherAssignmentById = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const [assignments] =
      await db.execute(
        `
        SELECT
          ta.id,
          ta.teacher_id,
          CONCAT(
            t.first_name,
            ' ',
            t.last_name
          ) AS teacher_name,

          ta.class_subject_id,

          c.name AS class_name,
          c.code AS class_code,

          s.name AS subject_name,
          s.code AS subject_code,

          ta.semester_id,
          sem.name AS semester,

          ta.status,

          ta.created_at,
          ta.updated_at

        FROM teacher_assignments ta

        INNER JOIN teachers t
          ON ta.teacher_id = t.id

        INNER JOIN class_subjects cs
          ON ta.class_subject_id = cs.id

        INNER JOIN classes c
          ON cs.class_id = c.id

        INNER JOIN subjects s
          ON cs.subject_id = s.id

        INNER JOIN semesters sem
          ON ta.semester_id = sem.id

        WHERE ta.id = ?

        LIMIT 1
        `,
        [id]
      );

    if (assignments.length === 0) {
      return res.status(404).json({
        message:
          "Teacher assignment not found.",
      });
    }

    /*
     * Teachers can only view their own assignment.
     */
    if (req.user.role === "teacher") {
      const [teacherCheck] =
        await db.execute(
          `
          SELECT id
          FROM teachers
          WHERE id = ?
            AND user_id = ?
          LIMIT 1
          `,
          [
            assignments[0].teacher_id,
            req.user.id,
          ]
        );

      if (teacherCheck.length === 0) {
        return res.status(403).json({
          message:
            "You are not authorized to view this assignment.",
        });
      }
    }

    return res.json(
      assignments[0]
    );
  } catch (error) {
    console.error(
      "Get teacher assignment error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch teacher assignment.",
    });
  }
};


/*
|--------------------------------------------------------------------------
| UPDATE TEACHER ASSIGNMENT
|--------------------------------------------------------------------------
*/
const updateTeacherAssignment = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const {
      teacher_id,
      class_subject_id,
      semester_id,
      status,
    } = req.body;

    if (
      !teacher_id ||
      !class_subject_id ||
      !semester_id
    ) {
      return res.status(400).json({
        message:
          "teacher_id, class_subject_id and semester_id are required.",
      });
    }

    /*
     * Check assignment
     */
    const [existing] =
      await db.execute(
        `
        SELECT id
        FROM teacher_assignments
        WHERE id = ?
        LIMIT 1
        `,
        [id]
      );

    if (existing.length === 0) {
      return res.status(404).json({
        message:
          "Teacher assignment not found.",
      });
    }

    /*
     * Check teacher
     */
    const [teachers] =
      await db.execute(
        `
        SELECT id
        FROM teachers
        WHERE id = ?
        LIMIT 1
        `,
        [teacher_id]
      );

    if (teachers.length === 0) {
      return res.status(404).json({
        message: "Teacher not found.",
      });
    }

    /*
     * Check class subject
     */
    const [classSubjects] =
      await db.execute(
        `
        SELECT id
        FROM class_subjects
        WHERE id = ?
        LIMIT 1
        `,
        [class_subject_id]
      );

    if (classSubjects.length === 0) {
      return res.status(404).json({
        message:
          "Class subject assignment not found.",
      });
    }

    /*
     * Check semester
     */
    const [semesters] =
      await db.execute(
        `
        SELECT id
        FROM semesters
        WHERE id = ?
        LIMIT 1
        `,
        [semester_id]
      );

    if (semesters.length === 0) {
      return res.status(404).json({
        message: "Semester not found.",
      });
    }

    /*
     * Prevent duplicate assignment.
     */
    const [duplicate] =
      await db.execute(
        `
        SELECT id
        FROM teacher_assignments
        WHERE teacher_id = ?
          AND class_subject_id = ?
          AND semester_id = ?
          AND id <> ?
        LIMIT 1
        `,
        [
          teacher_id,
          class_subject_id,
          semester_id,
          id,
        ]
      );

    if (duplicate.length > 0) {
      return res.status(409).json({
        message:
          "Another teacher assignment already exists with these details.",
      });
    }

    const validStatus =
      status === "inactive"
        ? "inactive"
        : "active";

    await db.execute(
      `
      UPDATE teacher_assignments
      SET
        teacher_id = ?,
        class_subject_id = ?,
        semester_id = ?,
        status = ?
      WHERE id = ?
      `,
      [
        teacher_id,
        class_subject_id,
        semester_id,
        validStatus,
        id,
      ]
    );

    return res.json({
      message:
        "Teacher assignment updated successfully.",
    });
  } catch (error) {
    console.error(
      "Update teacher assignment error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to update teacher assignment.",
    });
  }
};


/*
|--------------------------------------------------------------------------
| ACTIVATE TEACHER ASSIGNMENT
|--------------------------------------------------------------------------
*/
const activateTeacherAssignment = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const [assignments] =
      await db.execute(
        `
        SELECT id
        FROM teacher_assignments
        WHERE id = ?
        LIMIT 1
        `,
        [id]
      );

    if (assignments.length === 0) {
      return res.status(404).json({
        message:
          "Teacher assignment not found.",
      });
    }

    await db.execute(
      `
      UPDATE teacher_assignments
      SET status = 'active'
      WHERE id = ?
      `,
      [id]
    );

    return res.json({
      message:
        "Teacher assignment activated successfully.",
    });
  } catch (error) {
    console.error(
      "Activate teacher assignment error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to activate teacher assignment.",
    });
  }
};


/*
|--------------------------------------------------------------------------
| DEACTIVATE TEACHER ASSIGNMENT
|--------------------------------------------------------------------------
*/
const deactivateTeacherAssignment = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const [assignments] =
      await db.execute(
        `
        SELECT id
        FROM teacher_assignments
        WHERE id = ?
        LIMIT 1
        `,
        [id]
      );

    if (assignments.length === 0) {
      return res.status(404).json({
        message:
          "Teacher assignment not found.",
      });
    }

    await db.execute(
      `
      UPDATE teacher_assignments
      SET status = 'inactive'
      WHERE id = ?
      `,
      [id]
    );

    return res.json({
      message:
        "Teacher assignment deactivated successfully.",
    });
  } catch (error) {
    console.error(
      "Deactivate teacher assignment error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to deactivate teacher assignment.",
    });
  }
};


/*
|--------------------------------------------------------------------------
| DELETE TEACHER ASSIGNMENT
|--------------------------------------------------------------------------
*/
const deleteTeacherAssignment = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const [assignments] =
      await db.execute(
        `
        SELECT
          id,
          status
        FROM teacher_assignments
        WHERE id = ?
        LIMIT 1
        `,
        [id]
      );

    if (assignments.length === 0) {
      return res.status(404).json({
        message:
          "Teacher assignment not found.",
      });
    }

    const assignment =
      assignments[0];

    /*
     * Require deactivation first.
     */
    if (
      assignment.status === "active"
    ) {
      return res.status(409).json({
        message:
          "This teacher assignment is active. Please deactivate it before permanently deleting it.",
        requiresDeactivation: true,
      });
    }

    /*
     * Delete inactive assignment.
     */
    try {
      await db.execute(
        `
        DELETE FROM teacher_assignments
        WHERE id = ?
        `,
        [id]
      );
    } catch (deleteError) {
      console.error(
        "Delete teacher assignment database error:",
        deleteError
      );

      /*
       * Foreign-key protection.
       */
      if (
        deleteError.code ===
          "ER_ROW_IS_REFERENCED_2" ||
        deleteError.code ===
          "ER_ROW_IS_REFERENCED"
      ) {
        return res.status(409).json({
          message:
            "This assignment is referenced by other academic records and cannot be permanently deleted.",
        });
      }

      throw deleteError;
    }

    return res.json({
      message:
        "Teacher assignment deleted successfully.",
      action: "deleted",
    });
  } catch (error) {
    console.error(
      "Delete teacher assignment error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to delete teacher assignment.",
    });
  }
};


/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/
module.exports = {
  createTeacherAssignment,
  getTeacherAssignments,
  getTeacherAssignmentById,
  updateTeacherAssignment,
  activateTeacherAssignment,
  deactivateTeacherAssignment,
  deleteTeacherAssignment,
};