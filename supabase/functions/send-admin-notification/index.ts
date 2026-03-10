// Updated send-admin-notification/index.ts

import { Resend } from 'resend';

// Initialize Resend with the appropriate API key
const resend = new Resend('your-api-key');

// Function to send an admin notification email
export const sendAdminNotification = async (recipientEmail, subject, message) => {
  try {
    const response = await resend.sendEmail({
      from: 'noreply@syedom.com',  // Changed to new email
      to: recipientEmail,
      subject: subject,
      html: message
    });

    // Improved response handling
    if (!response.success) {
      const errorDetail = await response.json();
      console.error('Error sending email:', errorDetail);
      throw new Error(`Email sending failed: ${JSON.stringify(errorDetail)}`);
    }

    return response;
  } catch (error) {
    console.error('Error in sendAdminNotification:', error);
    throw new Error('An error occurred while sending the admin notification.');
  }
};

// Branding updated to Syedom
// Additional functionalities can be added here as required
