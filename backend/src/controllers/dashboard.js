import pool from "../config/db.js";

/**
 * Dashboard controller
 * Endpoints:
 *  - GET /api/dashboard/stats -> getDashboardStats
 *  - GET /api/dashboard/applications -> getLoanApplications
 *  - GET /api/dashboard/payments -> getPaymentHistory
 *  - GET /api/dashboard/portfolio -> getPortfolioBreakdown
 */

function handleServerError(res, err, context = "") {
  console.error(`${context} Error:`, err);
  return res.status(500).json({ error: "Internal server error" });
}

// Calculate credit score based on user's financial data
async function calculateCreditScore(userId) {
  try {
    let score = 300; // Base score

    // 1. KYC Status (0-100 points)
    const kycQuery = `
      SELECT cp.kyc_status, cp.aadhaar_kyc_status, cp.pan_kyc_status,
             cp.annual_income, cp.years_experience, cp.profession
      FROM customerprofile cp
      WHERE cp.user_id = $1
    `;
    const kycResult = await pool.query(kycQuery, [userId]);
    if (kycResult.rows.length > 0) {
      const profile = kycResult.rows[0];

      // KYC verification bonus
      if (profile.kyc_status === 'VERIFIED') score += 50;
      else if (profile.kyc_status === 'AUTO_APPROVED') score += 40;
      else if (profile.kyc_status === 'NEEDS_REVIEW') score += 20;

      // Individual document verification
      if (profile.aadhaar_kyc_status === 'VERIFIED') score += 25;
      if (profile.pan_kyc_status === 'VERIFIED') score += 25;

      // Income factor (0-50 points)
      const income = parseFloat(profile.annual_income) || 0;
      if (income >= 1000000) score += 50; // High income
      else if (income >= 500000) score += 35;
      else if (income >= 300000) score += 20;
      else if (income >= 200000) score += 10;

      // Experience factor (0-30 points)
      const experience = profile.years_experience || 0;
      if (experience >= 10) score += 30;
      else if (experience >= 5) score += 20;
      else if (experience >= 2) score += 10;
    }

    // 2. Loan History (0-200 points)
    const loanQuery = `
      SELECT application_status, approved_amount, risk_grade
      FROM loanapplications
      WHERE user_id = $1
    `;
    const loanResult = await pool.query(loanQuery, [userId]);
    const loans = loanResult.rows;

    if (loans.length > 0) {
      let approvedLoans = 0;
      let totalApprovedAmount = 0;

      loans.forEach(loan => {
        if (loan.application_status === 'APPROVED' || loan.application_status === 'DISBURSED') {
          approvedLoans++;
          totalApprovedAmount += parseFloat(loan.approved_amount) || 0;
        }
      });

      // Loan approval history
      if (approvedLoans > 0) score += Math.min(approvedLoans * 20, 60);

      // Loan amount factor
      if (totalApprovedAmount >= 1000000) score += 50;
      else if (totalApprovedAmount >= 500000) score += 35;
      else if (totalApprovedAmount >= 200000) score += 20;

      // Risk grade factor
      const riskGrades = loans.map(l => l.risk_grade).filter(Boolean);
      if (riskGrades.includes('A') || riskGrades.includes('AA')) score += 30;
      else if (riskGrades.includes('B')) score += 20;
      else if (riskGrades.includes('C')) score += 10;
    }

    // 3. Payment History (0-150 points)
    const paymentQuery = `
      SELECT p.amount_paid, p.payment_date, rs.due_date, rs.status
      FROM payments p
      LEFT JOIN repaymentschedule rs ON p.repayment_id = rs.repayment_id
      WHERE p.payer_user_id = $1
      ORDER BY p.payment_date DESC
      LIMIT 20
    `;
    const paymentResult = await pool.query(paymentQuery, [userId]);
    const payments = paymentResult.rows;

    if (payments.length > 0) {
      let onTimePayments = 0;
      let totalPayments = payments.length;

      payments.forEach(payment => {
        // Check if payment was on time
        if (payment.due_date && payment.payment_date) {
          const dueDate = new Date(payment.due_date);
          const paymentDate = new Date(payment.payment_date);
          if (paymentDate <= dueDate) {
            onTimePayments++;
          }
        } else {
          // If no due date info, assume on time
          onTimePayments++;
        }
      });

      // Payment reliability score
      const paymentRatio = onTimePayments / totalPayments;
      score += Math.round(paymentRatio * 100);

      // Recent payment activity bonus
      if (totalPayments >= 5) score += 30;
      else if (totalPayments >= 2) score += 20;
    }

    // 4. Current Loan Status (0-50 points)
    const activeLoanQuery = `
      SELECT COUNT(*) as active_count
      FROM loanapplications
      WHERE user_id = $1 AND application_status IN ('APPROVED', 'DISBURSED')
    `;
    const activeLoanResult = await pool.query(activeLoanQuery, [userId]);
    const activeLoans = parseInt(activeLoanResult.rows[0].active_count) || 0;

    if (activeLoans > 0) {
      score += Math.min(activeLoans * 15, 50); // Responsible borrowing
    }

    // Ensure score is within valid range
    score = Math.max(300, Math.min(900, score));

    return score;
  } catch (error) {
    console.error('Error calculating credit score:', error);
    return 300; // Return minimum score on error
  }
}

export async function getDashboardStats(req, res) {
  try {
    const userId = req.user?.id || req.query.userId;

    if (!userId) {
      // Return mock data if no user ID provided
      const mockStats = [
        {
          title: "Active Loans",
          value: 2,
          diff: 12
        },
        {
          title: "Pending Applications",
          value: 1,
          diff: -5
        },
        {
          title: "Total Borrowed",
          value: 125000,
          diff: 8
        },
        {
          title: "Credit Score",
          value: 750,
          diff: 0
        }
      ];
      return res.json(mockStats);
    }

    // Calculate real statistics
    const creditScore = await calculateCreditScore(userId);

    // Get active loans count
    const activeLoansQuery = `
      SELECT COUNT(*) as count
      FROM loanapplications
      WHERE user_id = $1 AND application_status IN ('APPROVED', 'DISBURSED')
    `;
    const activeLoansResult = await pool.query(activeLoansQuery, [userId]);
    const activeLoans = parseInt(activeLoansResult.rows[0].count) || 0;

    // Get pending applications count
    const pendingAppsQuery = `
      SELECT COUNT(*) as count
      FROM loanapplications
      WHERE user_id = $1 AND application_status IN ('SUBMITTED', 'DRAFT')
    `;
    const pendingAppsResult = await pool.query(pendingAppsQuery, [userId]);
    const pendingApps = parseInt(pendingAppsResult.rows[0].count) || 0;

    // Get total borrowed amount
    const totalBorrowedQuery = `
      SELECT COALESCE(SUM(approved_amount), 0) as total
      FROM loanapplications
      WHERE user_id = $1 AND application_status IN ('APPROVED', 'DISBURSED')
    `;
    const totalBorrowedResult = await pool.query(totalBorrowedQuery, [userId]);
    const totalBorrowed = parseFloat(totalBorrowedResult.rows[0].total) || 0;

    const stats = [
      {
        title: "Active Loans",
        value: activeLoans,
        diff: 0 // Could calculate month-over-month change
      },
      {
        title: "Pending Applications",
        value: pendingApps,
        diff: 0
      },
      {
        title: "Total Borrowed",
        value: totalBorrowed,
        diff: 0
      },
      {
        title: "Credit Score",
        value: creditScore,
        diff: 0
      }
    ];

    return res.json(stats);
  } catch (err) {
    return handleServerError(res, err, "dashboard.getDashboardStats");
  }
}

export async function getLoanApplications(req, res) {
  try {
    // Return mock data for now
    const mockApplications = [
      {
        id: 1,
        amount: 50000,
        purpose: "Practice Equipment",
        status: "approved",
        submittedAt: new Date("2024-01-15").getTime(),
        interestRate: 7.5
      },
      {
        id: 2,
        amount: 75000,
        purpose: "Office Setup",
        status: "under-review",
        submittedAt: new Date("2024-01-20").getTime(),
        interestRate: null
      }
    ];

    return res.json(mockApplications);
  } catch (err) {
    return handleServerError(res, err, "dashboard.getLoanApplications");
  }
}

export async function getPaymentHistory(req, res) {
  try {
    // Return mock data for now
    const mockPayments = [
      {
        id: "pay_123",
        amount_paid: 2500,
        payment_date: "2024-01-15T10:00:00Z",
        payment_method: "UPI",
        transaction_reference: "TXN_987654",
        loan_id: "loan_456",
        loan_product: "Personal Loan"
      },
      {
        id: "pay_124",
        amount_paid: 2500,
        payment_date: "2024-02-15T10:00:00Z",
        payment_method: "Bank Transfer",
        transaction_reference: "TXN_987655",
        loan_id: "loan_456",
        loan_product: "Personal Loan"
      }
    ];

    return res.json(mockPayments);
  } catch (err) {
    return handleServerError(res, err, "dashboard.getPaymentHistory");
  }
}

export async function getPortfolioBreakdown(req, res) {
  try {
    // Return mock data for now
    const mockPortfolio = [
      {
        name: "Personal Loan",
        value: 50000,
        color: "#3B82F6"
      },
      {
        name: "Business Loan",
        value: 75000,
        color: "#10B981"
      }
    ];

    return res.json(mockPortfolio);
  } catch (err) {
    return handleServerError(res, err, "dashboard.getPortfolioBreakdown");
  }
}
