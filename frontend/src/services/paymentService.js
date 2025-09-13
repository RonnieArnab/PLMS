import api from "@api/api";
import { API_ROUTES } from "../config/apiRoutes";

export const PaymentsService = {
  getByUser: async (userId) => {
    const { data } = await api.get(`${API_ROUTES.base}/api/payments/user/${userId}`);
    return data;
  },
  getByLoan: async (loanId) => {
    const { data } = await api.get(`${API_ROUTES.base}/api/payments/loan/${loanId}`);
    return data;
  },
  makePayment: async (payload) => {
    const { data } = await api.post(`${API_ROUTES.base}/api/payments`, payload);
    return data;
  },
};
