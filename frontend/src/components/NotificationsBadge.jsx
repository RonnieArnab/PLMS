// frontend/src/components/NotificationsBadge.jsx
import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { fetchNotificationsForUser } from "../api/notifications.js";

export default function NotificationsBadge({ userId, onOpen }) {
    // Normalize/trim userId to remove stray whitespace/newlines
    const safeUserId = ((userId || "") + "").toString().trim() || null;

    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!safeUserId) return;
        let cancelled = false;
        fetchNotificationsForUser(safeUserId)
            .then((rows) => {
                if (cancelled) return;
                const unread = Array.isArray(rows) ? rows.filter((r) => !r.is_read).length : 0;
                setCount(unread);
            })
            .catch((e) => console.error("badge load", e));
        return () => {
            cancelled = true;
        };
    }, [safeUserId]);

    return (
        <button onClick={onOpen} style={{ position: "relative", padding: 6 }}>
            🔔
            {count > 0 && (
                <span
                    style={{
                        position: "absolute",
                        top: -6,
                        right: -6,
                        background: "red",
                        color: "white",
                        borderRadius: "50%",
                        padding: "3px 7px",
                        fontSize: 12,
                    }}
                >
                    {count}
                </span>
            )}
        </button>
    );
}

NotificationsBadge.propTypes = {
    userId: PropTypes.string.isRequired,
    onOpen: PropTypes.func,
};
