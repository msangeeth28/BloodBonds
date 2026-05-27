const nodemailer = require("nodemailer");

// Create the transporter using Gmail + App Password from .env
// This is called once when the module loads, so .env must be loaded first (server.js does this)
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  family: 4,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Sends an OTP email to the given address
// Throws an error if sending fails — the calling route will catch it
const sendOtpEmail = async (toEmail, otp) => {
  await transporter.sendMail({
    from: `"BloodBonds" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "BloodBonds — Your OTP Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #f0f0f0; border-radius: 8px;">
        <h2 style="color: #ef4444; margin-bottom: 4px;">🩸 BloodBonds</h2>
        <p style="color: #555; font-size: 15px;">Use the OTP below to complete your request.</p>

        <div style="background: #fff5f5; border: 1px solid #fca5a5; border-radius: 8px; padding: 20px 24px; margin: 20px 0; text-align: center;">
          <p style="margin: 0; font-size: 13px; color: #888; letter-spacing: 1px; text-transform: uppercase;">Your One-Time Password</p>
          <h1 style="margin: 8px 0 0; font-size: 42px; letter-spacing: 10px; color: #dc2626;">${otp}</h1>
        </div>

        <p style="color: #777; font-size: 13px;">This OTP is valid for <strong>5 minutes</strong>. Do not share it with anyone.</p>
        <p style="color: #aaa; font-size: 12px; margin-top: 24px;">If you did not request this, please ignore this email.</p>
      </div>
    `,
  });
};

module.exports = sendOtpEmail;
