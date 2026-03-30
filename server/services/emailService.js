import SibApiV3Sdk from 'sib-api-v3-sdk';
import dotenv from 'dotenv';

dotenv.config();

const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

const BRAND = {
  name: 'Blue Fin Swim School',
  sub: 'Powered by ActivityBookr',
  color: '#1B6B8A',
  senderName: process.env.BREVO_SENDER_NAME || 'Blue Fin Swim School',
  senderEmail: process.env.BREVO_SENDER_EMAIL,
};

function baseTemplate(bodyHtml) {
  return `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1A1714;">
      <div style="background: ${BRAND.color}; padding: 36px 40px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px; color: #fff; letter-spacing: -0.5px;">${BRAND.name}</h1>
        <p style="margin: 6px 0 0; font-size: 12px; color: rgba(255,255,255,0.7); letter-spacing: 1px; text-transform: uppercase;">${BRAND.sub}</p>
      </div>
      <div style="background: #F5F3EE; padding: 40px; border-radius: 0 0 10px 10px;">
        ${bodyHtml}
        <hr style="border: none; border-top: 1px solid #E2DDD5; margin: 40px 0 20px;">
        <p style="color: #aaa; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} ${BRAND.name} · Durban, South Africa</p>
      </div>
    </div>
  `;
}

async function send({ to, subject, html }) {
  const email = new SibApiV3Sdk.SendSmtpEmail();
  email.subject = subject;
  email.htmlContent = html;
  email.sender = { name: BRAND.senderName, email: BRAND.senderEmail };
  email.to = [{ email: to }];
  email.replyTo = { name: BRAND.senderName, email: BRAND.senderEmail };

  try {
    await apiInstance.sendTransacEmail(email);
    return true;
  } catch (error) {
    console.error(`[emailService] Failed to send "${subject}" to ${to}:`, error?.message || error);
    throw error;
  }
}

export const sendVerificationEmail = async (toEmail, verificationCode) => {
  const html = baseTemplate(`
    <h2 style="color: #1A1714; margin-top: 0;">Verify your email</h2>
    <p style="color: #7C756E; line-height: 1.7;">
      Welcome to ${BRAND.name}! Enter the code below to confirm your email address.
      This code expires in <strong>10 minutes</strong>.
    </p>
    <div style="background: #fff; border: 2px solid ${BRAND.color}; border-radius: 10px; padding: 28px; text-align: center; margin: 28px 0;">
      <p style="color: #7C756E; margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Your verification code</p>
      <p style="color: ${BRAND.color}; font-size: 40px; font-weight: 700; margin: 10px 0; letter-spacing: 8px; font-family: monospace;">${verificationCode}</p>
    </div>
    <p style="color: #aaa; font-size: 13px;">
      Didn't request this? You can safely ignore this email.
    </p>
  `);

  return send({ to: toEmail, subject: `${verificationCode} is your ${BRAND.name} verification code`, html });
};

export const sendWelcomeEmail = async (toEmail, userName) => {
  const html = baseTemplate(`
    <h2 style="color: #1A1714; margin-top: 0;">Welcome, ${userName}! 🎉</h2>
    <p style="color: #7C756E; line-height: 1.7;">
      Your email is verified and your account is ready. Here's how to get started:
    </p>
    <div style="background: #fff; border-left: 4px solid ${BRAND.color}; padding: 20px 24px; border-radius: 4px; margin: 24px 0;">
      <p style="margin: 0 0 8px; font-weight: 600; color: #1A1714;">Next steps</p>
      <ol style="color: #7C756E; line-height: 1.9; margin: 0; padding-left: 20px;">
        <li>Add a child profile from your dashboard</li>
        <li>Purchase a lesson pack</li>
        <li>Book any available class slot</li>
      </ol>
    </div>
    <p style="color: #7C756E; line-height: 1.7;">
      Cancellations made at least 24 hours before a class are automatically refunded to your lesson balance.
    </p>
    <a href="${process.env.CLIENT_URL || '#'}/pages/dashboard.html"
       style="display: inline-block; background: ${BRAND.color}; color: #fff; text-decoration: none;
              padding: 13px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; margin-top: 8px;">
      Go to dashboard →
    </a>
  `);

  return send({ to: toEmail, subject: `Welcome to ${BRAND.name} — you're all set!`, html });
};