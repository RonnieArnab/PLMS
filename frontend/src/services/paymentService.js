import api from "@api/api";
import { API_ROUTES } from "../config/apiRoutes";

export const PaymentsService = {
  // Get payments by user ID
  getByUser: async (userId) => {
    try {
      const { data } = await api.get(API_ROUTES.payments.getByUser(userId));
      return data;
    } catch (error) {
      console.error('Error fetching payments by user:', error);
      throw error;
    }
  },

  // Get payments by loan ID
  getByLoan: async (loanId) => {
    try {
      const { data } = await api.get(API_ROUTES.payments.getByLoan(loanId));
      return data;
    } catch (error) {
      console.error('Error fetching payments by loan:', error);
      throw error;
    }
  },

  // Get payment history for a loan
  getPaymentHistory: async (loanId) => {
    try {
      const { data } = await api.get(API_ROUTES.payments.getPaymentHistory(loanId));
      return data;
    } catch (error) {
      console.error('Error fetching payment history:', error);
      throw error;
    }
  },

  // Record a manual payment
  makePayment: async (payload) => {
    try {
      const { data } = await api.post(API_ROUTES.payments.recordPayment, payload);
      return data;
    } catch (error) {
      console.error('Error recording payment:', error);
      throw error;
    }
  },

  // Create Razorpay order for one-time payment
  createOrder: async (amount) => {
    try {
      const { data } = await api.post(API_ROUTES.payments.createOrder, { amount });
      return data;
    } catch (error) {
      console.error('Error creating payment order:', error);
      throw error;
    }
  },

  // Create Razorpay subscription for autopay
  createSubscription: async (planId, totalCount = 12) => {
    try {
      const { data } = await api.post(API_ROUTES.payments.createSubscription, {
        planId,
        totalCount
      });
      return data;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  },

  // Verify payment after Razorpay checkout
  verifyPayment: async (verificationData) => {
    try {
      const { data } = await api.post(API_ROUTES.payments.verifyPayment, verificationData);
      return data;
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error;
    }
  },

  // Verify subscription payment
  verifySubscription: async (verificationData) => {
    try {
      const { data } = await api.post(API_ROUTES.payments.verifySubscription, verificationData);
      return data;
    } catch (error) {
      console.error('Error verifying subscription:', error);
      throw error;
    }
  },

  // Export payment statements to Excel
  exportStatements: async (userId) => {
    try {
      const response = await api.get(API_ROUTES.payments.exportStatements(userId), {
        responseType: 'blob'
      });
      return response;
    } catch (error) {
      console.error('Error exporting payment statements:', error);
      throw error;
    }
  },

  // Test endpoint
  test: async () => {
    try {
      const { data } = await api.get('/api/payments/test');
      return data;
    } catch (error) {
      console.error('Error testing payments API:', error);
      throw error;
    }
  }
};
