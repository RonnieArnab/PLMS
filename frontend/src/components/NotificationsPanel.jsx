// frontend/src/components/NotificationsPanel.jsx
import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
    fetchNotificationsForUser,
    markNotificationRead,
    markNotificationUnread,
    deleteNotification,
} from "../api/notifications.js";

/**
 * NotificationsPanel
 * Props:
 *  - userId: string (required)  => the logged-in user's UUID
 *  - initiallyOpen: boolean (optional)
 */
export default function NotificationsPanel({ userId, initiallyOpen = true }) {
    // Normalize/trim userId to remove stray whitespace/newlines
    const safeUserId = ((userId || "") + "").toString().trim() || null;

    const [notifs, setNotifs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(initiallyOpen);

    useEffect(() => {
        if (!safeUserId) return;
        load();
    }, [safeUserId]);

    async function load() {
        if (!safeUserId) return;
        setLoading(true);
        try {
            const data = await fetchNotificationsForUser(safeUserId);
            setNotifs(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to load notifications", err);
        } finally {
            setLoading(false);
        }
    }

    async function markRead(id) {
        try {
            const updated = await markNotificationRead(id);
            setNotifs((s) => s.map((n) => (n.notification_id === id ? updated : n)));
        } catch (err) {
            console.error("Failed to mark read", err);
        }
    }

    async function markUnread(id) {
        try {
            const updated = await markNotificationUnread(id);
            setNotifs((s) => s.map((n) => (n.notification_id === id ? updated : n)));
        } catch (err) {
            console.error("Failed to mark unread", err);
        }
    }

    async function remove(id) {
        try {
            await deleteNotification(id);
            setNotifs((s) => s.filter((n) => n.notification_id !== id));
        } catch (err) {
            console.error("Failed to delete", err);
        }
    }

    const unreadCount = notifs.filter((n) => !n.is_read).length;

    return (
        <div style={{ border: "1px solid #ddd", padding: 12, width: 360, background: "white", borderRadius: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h4 style={{ margin: 0 }}>Notifications ({unreadCount})</h4>
                <div>
                    <button onClick={() => load()} disabled={loading}>
                        Refresh
                    </button>{" "}
                    <button onClick={() => setOpen((o) => !o)}>{open ? "Close" : "Open"}</button>
                </div>
            </div>

            {!open ? null : (
                <div style={{ marginTop: 8, maxHeight: 420, overflowY: "auto" }}>
                    {loading && <div>Loading…</div>}
                    {!loading && notifs.length === 0 && <div>No notifications</div>}
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {notifs.map((n) => (
                            <li
                                key={n.notification_id}
                                style={{
                                    borderBottom: "1px solid #eee",
                                    padding: 8,
                                    background: n.is_read ? "#fafafa" : "#fff",
                                    opacity: n.is_read ? 0.8 : 1,
                                }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <div style={{ maxWidth: 240 }}>
                                        <div style={{ fontWeight: n.is_read ? "normal" : 600 }}>{n.message}</div>
                                        <div style={{ fontSize: 11, color: "#666" }}>
                                            {n.channel} • {n.sent_at ? new Date(n.sent_at).toLocaleString() : ""}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        {!n.is_read ? (
                                            <button onClick={() => markRead(n.notification_id)}>Mark read</button>
                                        ) : (
                                            <button onClick={() => markUnread(n.notification_id)}>Mark unread</button>
                                        )}
                                        <div>
                                            <button onClick={() => remove(n.notification_id)}>Delete</button>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

NotificationsPanel.propTypes = {
    userId: PropTypes.string.isRequired,
    initiallyOpen: PropTypes.bool,
};
