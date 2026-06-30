const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  console.log(`[MOCK EMAIL] To: ${options.email}, Subject: ${options.subject}`);
  return true;
};

module.exports = sendEmail;
