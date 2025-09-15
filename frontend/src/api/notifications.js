// frontend/src/api/notifications.js
import api from "./api.js"; // assumes frontend/src/api/api.js exists

export async function fetchNotificationsForUser(userId) {
    if (!userId) throw new Error("userId required");
    // endpoint: GET /api/notifications/user/:userId
    const res = await api.get(`/notifications/user/${userId}`);
    return res.data;
}

export async function createNotification(payload) {
    // payload: { user_id, loan_id?, channel?, message }
    const res = await api.post(`/notifications`, payload);
    return res.data;
}

export async function markNotificationRead(id) {
    const res = await api.patch(`/notifications/${id}/read`);
    return res.data;
}

export async function markNotificationUnread(id) {
    const res = await api.patch(`/notifications/${id}/unread`);
    return res.data;
}

export async function deleteNotification(id) {
    const res = await api.delete(`/notifications/${id}`);
    return res.data;
}