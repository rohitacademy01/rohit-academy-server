import nodemailer from "nodemailer";
import logger from "../utils/logger.js";

/* =====================================
   📧 TRANSPORTER (SMTP)
===================================== */
const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    logger.warn("⚠️ SMTP not configured — emails will not be sent");
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });
};

/* =====================================
   🔑 PASSWORD RESET EMAIL
===================================== */
export const sendPasswordResetEmail = async (toEmail, resetUrl) => {
  const transporter = createTransporter();

  if (!transporter) {
    logger.warn(`⚠️ Email skipped (SMTP not configured). Reset URL: ${resetUrl}`);
    return false;
  }

  const fromName = process.env.SMTP_FROM_NAME || "Rohit Academy";
  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to: toEmail,
    subject: "Password Reset - Rohit Academy",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Password Reset</title>
        </head>
        <body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
            <tr>
              <td align="center">
                <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                  <!-- Header -->
                  <tr>
                    <td style="background:linear-gradient(135deg,#2563eb,#4f46e5);padding:36px 40px;text-align:center;">
                      <div style="width:56px;height:56px;background:rgba(255,255,255,0.2);border-radius:14px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;">
                        <span style="color:#fff;font-size:26px;font-weight:800;">R</span>
                      </div>
                      <h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0;">Rohit Academy</h1>
                    </td>
                  </tr>
                  <!-- Body -->
                  <tr>
                    <td style="padding:40px;">
                      <h2 style="color:#1e293b;font-size:20px;font-weight:700;margin:0 0 12px;">Reset Your Password</h2>
                      <p style="color:#64748b;font-size:15px;line-height:1.6;margin:0 0 28px;">
                        Aapne apna password reset karne ka request kiya hai. Neeche diye gaye button par click karein:
                      </p>
                      <div style="text-align:center;margin:0 0 28px;">
                        <a href="${resetUrl}"
                          style="display:inline-block;background:linear-gradient(135deg,#2563eb,#4f46e5);color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;padding:14px 36px;border-radius:10px;">
                          Reset Password
                        </a>
                      </div>
                      <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0 0 8px;">
                        Yeh link 30 minutes mein expire ho jaayega.
                      </p>
                      <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0;">
                        Agar aapne yeh request nahi kiya, toh is email ko ignore karein.
                      </p>
                    </td>
                  </tr>
                  <!-- Footer -->
                  <tr>
                    <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;">
                      <p style="color:#94a3b8;font-size:12px;margin:0;">
                        © ${new Date().getFullYear()} Rohit Academy. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
    text: `Apna password reset karne ke liye is link par jaayen: ${resetUrl}\n\nYeh link 30 minutes mein expire ho jaayega.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`✅ Password reset email sent to ${toEmail}`);
    return true;
  } catch (err) {
    logger.error(`❌ Email send failed: ${err.message}`);
    throw new Error("Email could not be sent. Please try again later.");
  }
};

/* =====================================
   📧 PURCHASE CONFIRMATION EMAIL
===================================== */
export const sendPurchaseConfirmationEmail = async (toEmail, userName, batchName, amount) => {
  const transporter = createTransporter();
  if (!transporter) return false;

  const fromName = process.env.SMTP_FROM_NAME || "Rohit Academy";
  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;
  const frontendUrl = process.env.FRONTEND_URL || "https://rohitacademy.net";

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: toEmail,
      subject: `Purchase Confirmed - ${batchName} | Rohit Academy`,
      html: `
        <!DOCTYPE html>
        <html>
          <head><meta charset="utf-8" /></head>
          <body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
              <tr>
                <td align="center">
                  <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                    <tr>
                      <td style="background:linear-gradient(135deg,#16a34a,#15803d);padding:36px 40px;text-align:center;">
                        <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0;">✅ Payment Successful!</h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:40px;">
                        <p style="color:#1e293b;font-size:16px;font-weight:600;margin:0 0 8px;">Namaste ${userName || "Student"}!</p>
                        <p style="color:#64748b;font-size:15px;line-height:1.6;margin:0 0 24px;">
                          Aapka payment successful raha. Aap ab <strong>${batchName}</strong> ke sabhi study materials access kar sakte hain.
                        </p>
                        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin:0 0 28px;">
                          <p style="color:#166534;font-size:14px;font-weight:600;margin:0 0 4px;">Amount Paid</p>
                          <p style="color:#166534;font-size:24px;font-weight:800;margin:0;">₹${amount?.toLocaleString("en-IN")}</p>
                        </div>
                        <div style="text-align:center;">
                          <a href="${frontendUrl}/account"
                            style="display:inline-block;background:linear-gradient(135deg,#2563eb,#4f46e5);color:#fff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 32px;border-radius:10px;">
                            My Batches Dekhein →
                          </a>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;">
                        <p style="color:#94a3b8;font-size:12px;margin:0;">© ${new Date().getFullYear()} Rohit Academy</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });
    return true;
  } catch (err) {
    logger.error(`❌ Purchase confirmation email failed: ${err.message}`);
    return false;
  }
};
