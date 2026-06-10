import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// Check if email is configured
const isEmailConfigured = process.env.EMAIL_USER && process.env.EMAIL_PASS && 
  process.env.EMAIL_USER !== 'your_gmail@gmail.com';

let transporter = null;
if (isEmailConfigured) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  console.log('✉️  Email notifications enabled');
} else {
  console.log('⚠️  Email notifications disabled (EMAIL_USER/EMAIL_PASS not configured)');
}

/**
 * Send a deadline reminder email
 */
export const sendDeadlineReminder = async ({ to, company, role, deadline, remainingTime, applicationId }) => {
  if (!transporter) {
    console.log(`[Email] Skipped (not configured): ${company} — ${role} to ${to}`);
    return { skipped: true, reason: 'Email not configured' };
  }
  
  const deadlineFormatted = new Date(deadline).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f4f4f5; margin: 0; padding: 0; }
        .container { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px 40px; }
        .header h1 { color: white; margin: 0; font-size: 22px; font-weight: 700; }
        .header p { color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 14px; }
        .body { padding: 32px 40px; }
        .alert-badge { display: inline-block; background: #fef3c7; color: #92400e; border-radius: 20px; padding: 4px 14px; font-size: 13px; font-weight: 600; margin-bottom: 20px; }
        .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
        .detail-label { color: #64748b; font-size: 14px; }
        .detail-value { color: #0f172a; font-size: 14px; font-weight: 600; }
        .countdown { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px 20px; margin: 24px 0; text-align: center; }
        .countdown .time { font-size: 28px; font-weight: 800; color: #dc2626; }
        .countdown .label { font-size: 13px; color: #ef4444; margin-top: 4px; }
        .cta { display: block; background: #6366f1; color: white; text-decoration: none; text-align: center; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; margin-top: 24px; }
        .footer { padding: 20px 40px; background: #f8fafc; text-align: center; }
        .footer p { color: #94a3b8; font-size: 12px; margin: 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏰ Application Deadline Reminder</h1>
          <p>OrbitKeeper • Career Agent</p>
        </div>
        <div class="body">
          <div class="alert-badge">⚠️ Deadline Approaching</div>
          <div class="detail-row">
            <span class="detail-label">Company</span>
            <span class="detail-value">${company}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Role</span>
            <span class="detail-value">${role}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Deadline</span>
            <span class="detail-value">${deadlineFormatted}</span>
          </div>
          <div class="countdown">
            <div class="time">${remainingTime}</div>
            <div class="label">Remaining to submit your application</div>
          </div>
          <p style="color: #475569; font-size: 14px; line-height: 1.6;">
            Don't miss this opportunity! Make sure your application is polished and submitted before the deadline.
            Your OrbitKeeper AI has already prepared interview questions and skill gap analysis for this role.
          </p>
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/applications/${applicationId}" class="cta">
            View Application Details →
          </a>
        </div>
        <div class="footer">
          <p>OrbitKeeper • AI Career Agent • Built for Google Cloud Hackathon</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const info = await transporter.sendMail({
    from: `"OrbitKeeper 🤖" <${process.env.EMAIL_USER}>`,
    to,
    subject: `⏰ ${remainingTime} left to apply — ${company} ${role}`,
    html,
  });

  return info;
};
