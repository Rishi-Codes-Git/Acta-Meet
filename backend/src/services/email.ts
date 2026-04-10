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
    actionItems: Array<{ title: string; priority: string; deadline: string | null }>
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
          <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
            <h2 style="margin-bottom: 8px;">Action Items Assigned</h2>
            <p>Hi ${userName},</p>
            <p>The MoM PDF has been generated for <strong>${meetingTitle}</strong>. You have the following action items:</p>
            <table style="border-collapse: collapse; width: 100%; margin-top: 16px;">
              <thead>
                <tr style="background: #f8fafc;">
                  <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: left;">Title</th>
                  <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: left;">Priority</th>
                  <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: left;">Deadline</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
            <p style="margin-top: 16px;">Please review and start working on them.</p>
            <p>Best regards,<br>Acta Team</p>
          </div>
        `,
      });

      console.log(`✅ Action items email sent to ${email} (${actionItems.length} item(s))`);
      return true;
    } catch (error) {
      console.error('❌ Action items email send failed:', error);
      return false;
    }
  },
};
