require("dotenv").config();
const { createTransport } = require("nodemailer");

const sendMail = async ({ to, message, subject }) => {
  console.log(to, message, subject);
  let options = {
    from: `"Gautam Jakhar" <guatamjakhar@gmail.com>`,
    to: to,
    subject: subject,
    cc: [],
    bcc: [],
    text: "This is you Reset Link",
    html: message,
  };
  let transporter = createTransport({
    host: process.env.SMPT_HOST,
    port: process.env.SMPT_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMPT_USER_MAIL,
      pass: process.env.SMPT_PASSWORD,
    },
  });
  transporter.sendMail(options, (err, info) => {
    if (err) {
      console.log(err);
    }
    if (info) {
      console.log("mail sent");
    }
  });
};

module.exports = sendMail;
