import nodemailer from 'nodemailer';
import { config } from '../config';

// Create a test account if no SMTP config
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '1025'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER
    ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      }
    : undefined,
});

export const emailService = {
  sendOTP: async (email: string, otp: string, userName: string) => {
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@acta.app',
        to: email,
        subject: `Your Acta 2FA Code: ${otp}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
            <h2>Two-Factor Authentication</h2>
            <p>Hi ${userName},</p>
            <p>Your one-time verification code is:</p>
            <div style="background: #f0f0f0; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
              <p style="font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 0; color: #42A090;">${otp}</p>
            </div>
            <p>This code expires in 10 minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
            <p>Best regards,<br>Acta Team</p>
          </div>
        `,
      });
      console.log(`✅ OTP email sent to ${email}`);
      return true;
    } catch (error) {
      console.error('❌ Email send failed:', error);
      return false;
    }
  },

  sendActionItemsSummary: async (
    email: string,
    userName: string,
    meetingTitle: string,
    actionItems: Array<{ title: string; priority: string; deadline: string | null }>,
    momPdfPath?: string
  ) => {
    try {
      const rows = actionItems
        .map((item) => {
          const deadline = item.deadline
            ? new Date(item.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : 'No deadline';
          return `
            <tr>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${item.title}</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0; text-transform: capitalize;">${item.priority}</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${deadline}</td>
            </tr>
          `;
        })
        .join('');

      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@acta.app',
        to: email,
        subject: `New Action Items from "${meetingTitle}"`,
        html: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; background:#f4f8fb; padding:24px;">
            <div style="max-width:760px; margin:0 auto; background:#ffffff; border:1px solid #e5edf5; border-radius:14px; overflow:hidden;">
              <div style="background:linear-gradient(135deg,#1e6f64,#42A090); color:#ffffff; padding:22px 24px;">
                <h2 style="margin:0; font-size:22px; font-weight:700;">Action Items Assigned</h2>
                <p style="margin:8px 0 0; opacity:0.95;">Minutes of Meeting Notification</p>
              </div>
              <div style="padding:24px;">
                <p style="margin:0 0 12px; color:#1f2937;">Hi <strong>${userName}</strong>,</p>
                <p style="margin:0 0 18px; color:#334155; line-height:1.6;">
                  The MoM for <strong>${meetingTitle}</strong> has been generated. Please find your assigned action items below.
                </p>
                <table style="border-collapse: collapse; width: 100%; margin-top: 8px;">
              <thead>
                <tr style="background: #f1f5f9;">
                  <th style="padding: 11px; border: 1px solid #dbe5ef; text-align: left; color:#0f172a;">Title</th>
                  <th style="padding: 11px; border: 1px solid #dbe5ef; text-align: left; color:#0f172a;">Priority</th>
                  <th style="padding: 11px; border: 1px solid #dbe5ef; text-align: left; color:#0f172a;">Deadline</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
                <p style="margin:18px 0 0; color:#334155;">Please review and proceed with execution accordingly.</p>
              </div>
              <div style="padding:14px 24px; border-top:1px solid #e5edf5; background:#f8fafc; color:#64748b; font-size:12px;">
                This is an automated email from Acta.
              </div>
            </div>
          </div>
        `,
        attachments: momPdfPath
          ? [
              {
                filename: `${meetingTitle.replace(/[^\w\-]+/g, '_')}_MoM.pdf`,
                path: momPdfPath,
                contentType: 'application/pdf',
              },
            ]
          : [],
      });

      console.log(`✅ Action items email sent to ${email} (${actionItems.length} item(s))`);
      return true;
    } catch (error) {
      console.error('❌ Action items email send failed:', error);
      return false;
    }
  },
};
