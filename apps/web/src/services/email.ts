import nodemailer from "nodemailer";

const SMTP_EMAIL = process.env.SMTP_EMAIL;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;

// Create SMTP transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: SMTP_EMAIL,
    pass: SMTP_PASSWORD,
  },
});

/**
 * Sends a registration verification email containing a mock OTP/token.
 */
export async function sendVerificationEmail(
  toEmail: string,
  userName: string,
  token: string
): Promise<boolean> {
  if (!SMTP_EMAIL || !SMTP_PASSWORD) {
    console.warn("SMTP email or password not configured. Skipping email dispatch.");
    return false;
  }

  const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/verify-email?token=${token}&email=${encodeURIComponent(toEmail)}`;

  const mailOptions = {
    from: `"Money Platform" <${SMTP_EMAIL}>`,
    to: toEmail,
    subject: "Verify your Email - Money Platform",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
        <h2 style="color: #333;">Welcome to Money Platform, ${userName}!</h2>
        <p>Thank you for registering. Please verify your email address to active your personal finance dashboard.</p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${verificationLink}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p style="font-size: 12px; color: #666;">If the button above does not work, copy and paste this link into your browser:</p>
        <p style="font-size: 12px; color: #888; word-break: break-all;">${verificationLink}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 11px; color: #999;">This email was sent automatically. If you did not sign up for this platform, please ignore this email.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent successfully to ${toEmail}`);
    return true;
  } catch (error) {
    console.error(`Failed to send verification email to ${toEmail}:`, error);
    return false;
  }
}

/**
 * Sends a password reset email.
 */
export async function sendPasswordResetEmail(
  toEmail: string,
  token: string
): Promise<boolean> {
  if (!SMTP_EMAIL || !SMTP_PASSWORD) {
    console.warn("SMTP credentials not configured. Skipping email dispatch.");
    return false;
  }

  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${token}`;

  const mailOptions = {
    from: `"Money Platform" <${SMTP_EMAIL}>`,
    to: toEmail,
    subject: "Reset your Password - Money Platform",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>You requested a password reset for your Money Platform account. Please click the button below to set a new password:</p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${resetLink}" style="background-color: #f44336; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="font-size: 12px; color: #666;">This link is valid for 1 hour. If you did not request this, please ignore this email and your password will remain unchanged.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 11px; color: #999;">This email was sent automatically.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${toEmail}`);
    return true;
  } catch (error) {
    console.error(`Failed to send password reset email to ${toEmail}:`, error);
    return false;
  }
}
