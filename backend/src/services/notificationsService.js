// backend/src/services/notificationsService.js
import pool from "../config/db.js";

/**
 * Create an in-app notification (best-effort)
 * @param {Object} opts
 * @param {string} opts.user_id - UUID of recipient user (required)
 * @param {string|null} opts.loan_id - optional loan id
 * @param {string} opts.channel - "IN_APP" / "EMAIL" / "SMS"
 * @param {string} opts.message - message text
 * @returns inserted notification row or null on failure
 */
export async function createNotification({ user_id, loan_id = null, channel = "IN_APP", message }) {
    if (!user_id || !message) return null;
    try {
        const q = `INSERT INTO notifications (user_id, loan_id, channel, message)
               VALUES ($1,$2,$3,$4)
               RETURNING notification_id, user_id, loan_id, channel, message, sent_at, is_read, read_at`;
        const values = [user_id, loan_id, channel, message];
        const { rows } = await pool.query(q, values);
        return rows[0] || null;
    } catch (err) {
        // Log and swallow: notifications are best-effort
        console.error("createNotification Error:", err && err.message ? err.message : err);
        return null;
    }
}
