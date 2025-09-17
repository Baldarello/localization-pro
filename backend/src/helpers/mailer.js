import nodemailer from 'nodemailer';
import logger from './logger.js';

let transporter;

// Initialize transporter if email is enabled
if (process.env.EMAIL_ENABLED === 'true') {
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        logger.warn('Email is enabled, but SMTP configuration is incomplete. Emails will not be sent.');
    } else {
        transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT || '587', 10),
            secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        transporter.verify((error, success) => {
            if (error) {
                logger.error('Error with email transporter configuration:', error);
            } else {
                logger.info('Email transporter is configured and ready to send messages.');
            }
        });
    }
} else {
    logger.info('Email sending is disabled (EMAIL_ENABLED is not "true").');
}

/**
 * Sends an email.
 * @param {string} to - Recipient's email address.
 * @param {string} subject - Email subject.
 * @param {string} html - HTML body of the email.
 * @returns {Promise<void>}
 */
export const sendEmail = async (to, subject, html) => {
    if (!transporter) {
        logger.info(`Email not sent to ${to} (subject: ${subject}) because email sending is disabled or not configured.`);
        return;
    }

    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        logger.info(`Email sent to ${to}: ${info.messageId}`);
    } catch (error) {
        logger.error(`Failed to send email to ${to}:`, error);
    }
};

export default { sendEmail };
