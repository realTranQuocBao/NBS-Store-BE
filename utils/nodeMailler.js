import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_STORE,
    pass: process.env.PASS_EMAIL_STORE
  }
});
const sendMail = (messageOptions) => {
  const message = {
    from: process.env.EMAIL_STORE,
    to: messageOptions.recipient,
    subject: messageOptions.subject,
    text: messageOptions.text,
    html: messageOptions.html
  };
  return transporter.sendMail(message);
};

export { sendMail };
