const db = require("../config/db");

/*
|--------------------------------------------------------------------------
| CREATE CLASS
|--------------------------------------------------------------------------
*/
const createClass = async (req, res) => {
  try {
    const {
      name,
      code,
      description,
      status,
    } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        message: "Class name and code are required.",
      });
    }

    const [existingClass] = await db.execute(
      `
        SELECT id
        FROM classes
        WHERE code = ?
        LIMIT 1
      `,
      [code.trim()]
    );

    if (existingClass.length > 0) {
      return res.status(409).json({
        message: "A class with this code already exists.",
      });
    }

    const [result] = await db.execute(
      `
        INSERT INTO classes
        (
          name,
          code,
          description,
          status
        )
        VALUES (?, ?, ?, ?)
      `,
      [
        name.trim(),
        code.trim(),
        description?.trim() || null,
        status || "active",
      ]
    );

    return res.status(201).json({
      message: "Class created successfully.",
      classId: result.insertId,
    });
  } catch (error) {
    console.error("Create class error:", error);

    return res.status(500).json({
      message: "Failed to create class.",
    });
  }
};


/*
|--------------------------------------------------------------------------
| GET ALL CLASSES
|--------------------------------------------------------------------------
*/
const getClasses = async (req, res) => {
  try {
    const [classes] = await db.execute(
      `
        SELECT
          id,
          name,
          code,
          description,
          status,
          created_at,
          updated_at
        FROM classes
        ORDER BY name ASC
      `
    );

    return res.json(classes);
  } catch (error) {
    console.error("Get classes error:", error);

    return res.status(500).json({
      message: "Failed to fetch classes.",
    });
  }
};


/*
|--------------------------------------------------------------------------
| GET ONE CLASS
|--------------------------------------------------------------------------
*/
const getClassById = async (req, res) => {
  try {
    const { id } = req.params;

    const [classes] = await db.execute(
      `
        SELECT
          id,
          name,
          code,
          description,
          status,
          created_at,
          updated_at
        FROM classes
        WHERE id = ?
        LIMIT 1
      `,
      [id]
    );

    if (classes.length === 0) {
      return res.status(404).json({
        message: "Class not found.",
      });
    }

    return res.json(classes[0]);
  } catch (error) {
    console.error("Get class error:", error);

    return res.status(500).json({
      message: "Failed to fetch class.",
    });
  }
};


/*
|--------------------------------------------------------------------------
| UPDATE CLASS
|--------------------------------------------------------------------------
*/
const updateClass = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      code,
      description,
      status,
    } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        message: "Class name and code are required.",
      });
    }

    const [existingClass] = await db.execute(
      `
        SELECT id
        FROM classes
        WHERE id = ?
        LIMIT 1
      `,
      [id]
    );

    if (existingClass.length === 0) {
      return res.status(404).json({
        message: "Class not found.",
      });
    }

    const [duplicateCode] = await db.execute(
      `
        SELECT id
        FROM classes
        WHERE code = ?
          AND id <> ?
        LIMIT 1
      `,
      [
        code.trim(),
        id,
      ]
    );

    if (duplicateCode.length > 0) {
      return res.status(409).json({
        message: "Another class already uses this code.",
      });
    }

    await db.execute(
      `
        UPDATE classes
        SET
          name = ?,
          code = ?,
          description = ?,
          status = ?
        WHERE id = ?
      `,
      [
        name.trim(),
        code.trim(),
        description?.trim() || null,
        status || "active",
        id,
      ]
    );

    return res.json({
      message: "Class updated successfully.",
    });
  } catch (error) {
    console.error("Update class error:", error);

    return res.status(500).json({
      message: "Failed to update class.",
    });
  }
};


/*
|--------------------------------------------------------------------------
| ACTIVATE CLASS
|--------------------------------------------------------------------------
*/
const activateClass = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.execute(
      `
        UPDATE classes
        SET status = 'active'
        WHERE id = ?
      `,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Class not found.",
      });
    }

    return res.json({
      message: "Class activated successfully.",
    });
  } catch (error) {
    console.error("Activate class error:", error);

    return res.status(500).json({
      message: "Failed to activate class.",
    });
  }
};


/*
|--------------------------------------------------------------------------
| DEACTIVATE CLASS
|--------------------------------------------------------------------------
*/
const deactivateClass = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.execute(
      `
        UPDATE classes
        SET status = 'inactive'
        WHERE id = ?
      `,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Class not found.",
      });
    }

    return res.json({
      message: "Class deactivated successfully.",
    });
  } catch (error) {
    console.error("Deactivate class error:", error);

    return res.status(500).json({
      message: "Failed to deactivate class.",
    });
  }
};


/*
|--------------------------------------------------------------------------
| DELETE CLASS
|--------------------------------------------------------------------------
|
| A class may already be referenced by class_subjects.
|
| If it has references, we do not permanently delete it.
| The administrator should deactivate it instead.
|
|--------------------------------------------------------------------------
*/
const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;

    const [classes] = await db.execute(
      `
        SELECT
          id,
          name,
          status
        FROM classes
        WHERE id = ?
        LIMIT 1
      `,
      [id]
    );

    if (classes.length === 0) {
      return res.status(404).json({
        message: "Class not found.",
      });
    }

    const classRecord = classes[0];

    const [classSubjects] = await db.execute(
      `
        SELECT id
        FROM class_subjects
        WHERE class_id = ?
        LIMIT 1
      `,
      [id]
    );

    if (classSubjects.length > 0) {
      if (classRecord.status === "active") {
        return res.status(409).json({
          message:
            "This class has subject records. Please deactivate the class before deleting it.",
          requiresDeactivation: true,
        });
      }

      /*
       * We intentionally do NOT delete class_subjects
       * automatically here because those records may
       * have academic dependencies such as results,
       * teacher assignments, etc.
       */
      return res.status(409).json({
        message:
          "This class has subject records and cannot be permanently deleted because they may contain academic history.",
          requiresDeactivation: true,
      });
    }

    await db.execute(
      `
        DELETE FROM classes
        WHERE id = ?
      `,
      [id]
    );

    return res.json({
      message: "Class deleted successfully.",
      action: "deleted",
    });
  } catch (error) {
    console.error("Delete class error:", error);

    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(409).json({
        message:
          "This class is being used by other records. Deactivate it instead of permanently deleting it.",
        requiresDeactivation: true,
      });
    }

    return res.status(500).json({
      message: "Failed to delete class.",
    });
  }
};


/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/
module.exports = {
  createClass,
  getClasses,
  getClassById,
  updateClass,
  activateClass,
  deactivateClass,
  deleteClass,
};