import api from "@api/api";
import { API_ROUTES } from "../config/apiRoutes";

export const RepaymentService = {
  // Get all repayment schedules
  getAll: async () => {
    try {
      const { data } = await api.get(API_ROUTES.repayments.getAll);
      return data;
    } catch (error) {
      console.error('Error fetching all repayments:', error);
      throw error;
    }
  },

  // Get repayment schedule for a specific user
  getByUser: async (userId) => {
    try {
      const { data } = await api.get(API_ROUTES.repayments.getByUser(userId));
      return data;
    } catch (error) {
      console.error('Error fetching repayments by user:', error);
      throw error;
    }
  },

  // Get repayment schedule for a specific loan
  getByLoan: async (loanId) => {
    try {
      const { data } = await api.get(API_ROUTES.repayments.getByLoan(loanId));
      return data;
    } catch (error) {
      console.error('Error fetching repayments by loan:', error);
      throw error;
    }
  },

  // Get next upcoming repayment for a loan
  getNext: async (loanId) => {
    try {
      const { data } = await api.get(API_ROUTES.repayments.getNext(loanId));
      return data;
    } catch (error) {
      console.error('Error fetching next repayment:', error);
      throw error;
    }
  },

  // Create a new repayment schedule entry
  create: async (repaymentData) => {
    try {
      const { data } = await api.post(API_ROUTES.repayments.create, repaymentData);
      return data;
    } catch (error) {
      console.error('Error creating repayment schedule:', error);
      throw error;
    }
  },

  // Calculate EMI for a loan (utility function)
  calculateEMI: (principal, annualRate, tenureMonths) => {
    if (!principal || !annualRate || !tenureMonths) {
      throw new Error('Principal, annual rate, and tenure months are required');
    }

    const monthlyRate = annualRate / 12 / 100;
    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
                (Math.pow(1 + monthlyRate, tenureMonths) - 1);

    return Math.round(emi * 100) / 100; // Round to 2 decimal places
  },

  // Generate repayment schedule for a loan
  generateSchedule: (loanData) => {
    const {
      loan_id,
      approved_amount,
      interest_rate_apr,
      tenure_months,
      disbursement_date
    } = loanData;

    if (!loan_id || !approved_amount || !interest_rate_apr || !tenure_months) {
      throw new Error('Loan data incomplete for schedule generation');
    }

    const principal = approved_amount;
    const monthlyRate = interest_rate_apr / 12 / 100;
    const emi = this.calculateEMI(principal, interest_rate_apr, tenure_months);

    const schedule = [];
    let remainingBalance = principal;
    let startDate = disbursement_date ? new Date(disbursement_date) : new Date();

    // Set to next month for first payment
    startDate.setMonth(startDate.getMonth() + 1);
    startDate.setDate(1); // First day of the month

    for (let i = 1; i <= tenure_months; i++) {
      const interestDue = remainingBalance * monthlyRate;
      const principalDue = emi - interestDue;

      schedule.push({
        loan_id,
        installment_no: i,
        due_date: startDate.toISOString().split('T')[0],
        principal_due: Math.round(principalDue * 100) / 100,
        interest_due: Math.round(interestDue * 100) / 100,
        total_due: Math.round(emi * 100) / 100,
        status: 'pending'
      });

      remainingBalance -= principalDue;
      startDate.setMonth(startDate.getMonth() + 1);
    }

    return schedule;
  }
};
