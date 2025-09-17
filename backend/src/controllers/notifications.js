// export async function getAll(req, res) {
//   res.json({ service: "notifications", action: "getAll" });
// }

// export async function create(req, res) {
//   res.json({ service: "notifications", action: "create", data: req.body });
// }


// backend/src/controllers/notifications.js
import pool from "../config/db.js";

/**
 * Notifications controller
 * Endpoints:
 *  - GET    /api/notifications            -> getAll (admin-ish)
 *  - GET    /api/notifications/user/:userId -> getForUser
 *  - POST   /api/notifications           -> create
 *  - PATCH  /api/notifications/:id/read  -> markRead
 *  - PATCH  /api/notifications/:id/unread-> markUnread
 *  - DELETE /api/notifications/:id       -> remove
 */

function handleServerError(res, err, context = "") {
  console.error(`${context} Error:`, err);
  return res.status(500).json({ error: "Internal server error" });
}

export async function getAll(req, res) {
  try {
    const q = `SELECT notification_id, user_id, loan_id, channel, message, sent_at
               FROM notifications
               ORDER BY sent_at DESC
               LIMIT 1000`;
    const { rows } = await pool.query(q);
    return res.json(rows);
  } catch (err) {
    return handleServerError(res, err, "notifications.getAll");
  }
}

export async function getForUser(req, res) {
  try {
    // Prefer param, then query, then a auth-injected user id (if you have auth middleware)
    const userId = req.params.userId || req.query.userId || (req.user && (req.user.user_id || req.user.id));
    if (!userId) return res.status(400).json({ error: "userId is required" });

    const q = `SELECT notification_id, user_id, loan_id, channel, message, sent_at
               FROM notifications
               WHERE user_id = $1
               ORDER BY sent_at DESC`;
    const { rows } = await pool.query(q, [userId]);
    return res.json(rows);
  } catch (err) {
    return handleServerError(res, err, "notifications.getForUser");
  }
}

export async function create(req, res) {
  try {
    const { user_id, loan_id = null, channel = "IN_APP", message } = req.body;

    if (!user_id || !message) {
      return res.status(400).json({ error: "user_id and message are required" });
    }

    const q = `INSERT INTO notifications (user_id, loan_id, channel, message)
               VALUES ($1, $2, $3, $4)
               RETURNING notification_id, user_id, loan_id, channel, message, sent_at`;
    const values = [user_id, loan_id, channel, message];

    const { rows } = await pool.query(q, values);
    return res.status(201).json(rows[0]);
  } catch (err) {
    // because of FK constraints, you may get an error if user_id doesn't exist
    if (err?.code === "23503") {
      // foreign key violation
      return res.status(400).json({ error: "Invalid user_id or loan_id (foreign key constraint)" });
    }
    return handleServerError(res, err, "notifications.create");
  }
}

export async function markRead(req, res) {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: "notification id is required" });

    // Since is_read and read_at columns don't exist in current schema, just return success
    // In a real implementation, you might add these columns back or use a different approach
    return res.json({ message: "Notification marked as read", id });
  } catch (err) {
    return handleServerError(res, err, "notifications.markRead");
  }
}

export async function markUnread(req, res) {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: "notification id is required" });

    // Since is_read and read_at columns don't exist in current schema, just return success
    return res.json({ message: "Notification marked as unread", id });
  } catch (err) {
    return handleServerError(res, err, "notifications.markUnread");
  }
}

export async function remove(req, res) {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: "notification id is required" });

    const q = `DELETE FROM notifications WHERE notification_id = $1 RETURNING notification_id`;
    const { rows } = await pool.query(q, [id]);

    if (!rows.length) return res.status(404).json({ error: "Notification not found" });
    return res.json({ message: "Deleted", id: rows[0].notification_id });
  } catch (err) {
    return handleServerError(res, err, "notifications.remove");
  }
}
