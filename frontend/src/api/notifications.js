// frontend/src/api/notifications.js
import api from "./api.js"; // assumes frontend/src/api/api.js exists

export async function fetchNotificationsForUser(userId) {
    if (!userId) throw new Error("userId required");
    // endpoint: GET /api/notifications/user/:userId
    const res = await api.get(`/api/notifications/user/${userId}`);
    return res.data;
}

export async function createNotification(payload) {
    // payload: { user_id, loan_id?, channel?, message }
    const res = await api.post(`/api/notifications`, payload);
    return res.data;
}

export async function markNotificationRead(id) {
    const res = await api.patch(`/api/notifications/${id}/read`);
    return res.data;
}

export async function markNotificationUnread(id) {
    const res = await api.patch(`/api/notifications/${id}/unread`);
    return res.data;
}

export async function deleteNotification(id) {
    const res = await api.delete(`/api/notifications/${id}`);
    return res.data;
}
