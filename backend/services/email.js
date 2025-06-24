const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Email templates
const templates = {
  welcome: (user) => ({
    subject: 'Welcome to TaalimX!',
    html: `
      <h1>Welcome to TaalimX, ${user.firstName}!</h1>
      <p>Thank you for joining our Islamic education platform.</p>
      <p>We're excited to have you as part of our community.</p>
      <p>Next steps:</p>
      <ul>
        <li>Complete your profile</li>
        <li>Browse available teachers</li>
        <li>Book your first class</li>
      </ul>
      <p>If you have any questions, please don't hesitate to contact us.</p>
      <p>Best regards,<br>The TaalimX Team</p>
    `
  }),

  teacherApproved: (teacher) => ({
    subject: 'Your TaalimX Teacher Application Has Been Approved!',
    html: `
      <h1>Congratulations, ${teacher.firstName}!</h1>
      <p>Your application to become a teacher on TaalimX has been approved.</p>
      <p>You can now:</p>
      <ul>
        <li>Set your availability</li>
        <li>Accept class bookings</li>
        <li>Start teaching students</li>
      </ul>
      <p>Log in to your dashboard to get started.</p>
      <p>Best regards,<br>The TaalimX Team</p>
    `
  }),

  teacherRejected: (teacher, reason) => ({
    subject: 'Update on Your TaalimX Teacher Application',
    html: `
      <h1>Dear ${teacher.firstName},</h1>
      <p>Thank you for your interest in teaching on TaalimX.</p>
      <p>After careful review, we regret to inform you that we cannot approve your application at this time.</p>
      ${reason ? `<p>Reason: ${reason}</p>` : ''}
      <p>You're welcome to reapply in the future once you've addressed any concerns.</p>
      <p>Best regards,<br>The TaalimX Team</p>
    `
  }),

  classBooked: (parent, teacher, classDetails) => ({
    subject: 'Class Booking Confirmation - TaalimX',
    html: `
      <h1>Class Booking Confirmed!</h1>
      <p>Dear ${parent.firstName},</p>
      <p>Your class booking has been confirmed with the following details:</p>
      <ul>
        <li><strong>Teacher:</strong> ${teacher.firstName} ${teacher.lastName}</li>
        <li><strong>Subject:</strong> ${classDetails.subject}</li>
        <li><strong>Date:</strong> ${new Date(classDetails.startTime).toLocaleDateString()}</li>
        <li><strong>Time:</strong> ${new Date(classDetails.startTime).toLocaleTimeString()}</li>
        <li><strong>Duration:</strong> 1 hour</li>
        <li><strong>Price:</strong> R${classDetails.pricePerLesson}</li>
      </ul>
      <p>Please ensure your child is ready at the scheduled time.</p>
      <p>Best regards,<br>The TaalimX Team</p>
    `
  }),

  classCancelled: (recipient, classDetails, cancelledBy) => ({
    subject: 'Class Cancellation Notice - TaalimX',
    html: `
      <h1>Class Cancellation Notice</h1>
      <p>Dear ${recipient.firstName},</p>
      <p>We regret to inform you that the following class has been cancelled:</p>
      <ul>
        <li><strong>Subject:</strong> ${classDetails.subject}</li>
        <li><strong>Date:</strong> ${new Date(classDetails.startTime).toLocaleDateString()}</li>
        <li><strong>Time:</strong> ${new Date(classDetails.startTime).toLocaleTimeString()}</li>
      </ul>
      <p>Cancelled by: ${cancelledBy}</p>
      <p>If you have any questions, please contact us.</p>
      <p>Best regards,<br>The TaalimX Team</p>
    `
  }),

  paymentReceived: (teacher, payment) => ({
    subject: 'Payment Received - TaalimX',
    html: `
      <h1>Payment Confirmation</h1>
      <p>Dear ${teacher.firstName},</p>
      <p>We've received a payment for your teaching services:</p>
      <ul>
        <li><strong>Amount:</strong> R${payment.amount}</li>
        <li><strong>Date:</strong> ${new Date(payment.paymentDate).toLocaleDateString()}</li>
        <li><strong>Reference:</strong> ${payment.id}</li>
      </ul>
      <p>The payment will be processed and transferred to your account within 3-5 business days.</p>
      <p>Best regards,<br>The TaalimX Team</p>
    `
  }),

  passwordReset: (user, resetLink) => ({
    subject: 'Password Reset Request - TaalimX',
    html: `
      <h1>Password Reset Request</h1>
      <p>Dear ${user.firstName},</p>
      <p>We received a request to reset your password.</p>
      <p>Click the link below to reset your password:</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <p>Best regards,<br>The TaalimX Team</p>
    `
  })
};

// Send email function
const sendEmail = async (to, templateName, data) => {
  try {
    const template = templates[templateName](data);
    
    const mailOptions = {
      from: process.env.SMTP_FROM || '"TaalimX" <notifications@taalimx.com>',
      to: to,
      subject: template.subject,
      html: template.html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// Verify email configuration
const verifyEmailConfig = async () => {
  try {
    await transporter.verify();
    console.log('Email server is ready to send messages');
    return true;
  } catch (error) {
    console.error('Email server configuration error:', error);
    return false;
  }
};

module.exports = {
  sendEmail,
  verifyEmailConfig
};
