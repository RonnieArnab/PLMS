import {
  createEmailVerificationToken,
  verifyEmailVerificationToken,
} from "./tokenService.js";
import { sendMail } from "./mailer.js";

export async function sendVerificationEmail(user) {
  const token = createEmailVerificationToken(user);
  const backendBase = process.env.BACKEND_BASE_URL || "http://localhost:4000";
  const verifyUrl = `${backendBase.replace(
    /\/$/,
    ""
  )}/api/auth/verify-email?token=${encodeURIComponent(
    token
  )}&next=${encodeURIComponent(process.env.FRONTEND_KYC_REDIRECT)}`;

  const html = `
  <div style="font-family: Inter, sans-serif; max-width: 600px; margin: auto; padding: 20px; background: #f9fafb; border-radius: 10px;">
    <h2 style="color:#16a34a; text-align:center;">ProLoan</h2>
    <p style="font-size: 16px; color:#111827;">
      Hi${user.full_name ? ` ${user.full_name}` : ""}, <br><br>
      Thanks for signing up with <strong>ProLoan</strong>. Before you can start managing your loans smarter,
      we need to verify your email.
    </p>
    <div style="text-align:center; margin: 30px 0;">
      <a href="${verifyUrl}" 
         style="background:#16a34a; color:white; padding:12px 24px; border-radius:6px; font-size:16px; text-decoration:none;">
        Verify my email
      </a>
    </div>
    <p style="font-size: 14px; color:#6b7280;">
      If you didn’t create this account, you can safely ignore this message. 
    </p>
    <hr style="margin:20px 0;">
    <p style="font-size: 12px; color:#9ca3af; text-align:center;">
      &copy; ${new Date().getFullYear()} ProLoan. All rights reserved.
    </p>
  </div>
  `;

  const text = `Verify your ProLoan email: ${verifyUrl}`;

  await sendMail({
    to: user.email,
    subject: "Verify your email - ProLoan",
    html,
    text,
  });

  return token;
}
