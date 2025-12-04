import nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  tls?: {
    rejectUnauthorized: boolean;
  };
}

const createTransporter = () => {
  const emailUser = process.env.EMAIL_USER ;
  const emailPass = process.env.EMAIL_PASS ;
  const emailHost = process.env.EMAIL_HOST ;
  const emailPort = parseInt(process.env.EMAIL_PORT);
  const isSecure = emailPort === 465;

  // Validate email configuration
  if (!emailPass) {
    console.warn('WARNING: EMAIL_PASS is not set. Email sending will fail.');
    console.warn('Please set EMAIL_PASS in your .env file with a Gmail App Password.');
  }

  const config: EmailConfig = {
    host: emailHost,
    port: emailPort,
    secure: isSecure,
    auth: {
      user: emailUser,
      pass: emailPass
    },
    // Additional options for better compatibility
    tls: {
      rejectUnauthorized: false // For development only
    }
  };

  console.log('Creating email transporter with config:', {
    host: emailHost,
    port: emailPort,
    secure: isSecure,
    user: emailUser,
    hasPassword: !!emailPass
  });

  return nodemailer.createTransport(config);
};

const sendVerificationEmail = async (
  email: string,
  verificationCode: string,
  verificationLink: string
): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    
    // Verify transporter configuration
    await transporter.verify();
    console.log('Email transporter verified successfully');

    const mailOptions = {
      from: `"Campus Marketplace" <${process.env.EMAIL_USER || 'rootuser.cmp@gmail.com'}>`,
      to: email,
      subject: 'Verify Your Campus Email - Campus Marketplace',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1f2937; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .code-box { background-color: white; border: 2px solid #3b82f6; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
            .verification-code { font-size: 32px; font-weight: bold; color: #3b82f6; letter-spacing: 8px; }
            .button { display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Campus Marketplace</h1>
            </div>
            <div class="content">
              <h2>Verify Your Email Address</h2>
              <p>Thank you for signing up for Campus Marketplace! Please verify your email address to complete your registration.</p>
              
              <div class="code-box">
                <p style="margin: 0 0 10px 0; color: #6b7280;">Your verification code:</p>
                <div class="verification-code">${verificationCode}</div>
                <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px;">This code expires in 15 minutes</p>
              </div>

              <p>Or click the button below to verify your email:</p>
              <a href="${verificationLink}" class="button">Verify Email Address</a>

              <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
                If you didn't create an account with Campus Marketplace, please ignore this email.
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Campus Marketplace. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Verify Your Email Address - Campus Marketplace
        
        Your verification code is: ${verificationCode}
        This code expires in 15 minutes.
        
        Or click this link to verify: ${verificationLink}
        
        If you didn't create an account, please ignore this email.
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent successfully:', {
      messageId: info.messageId,
      to: email,
      accepted: info.accepted,
      rejected: info.rejected
    });
    return true;
  } catch (error: any) {
    console.error('Error sending verification email:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
      email: email
    });
    
    // Log specific error details
    if (error.code === 'EAUTH') {
      console.error('Authentication failed. Please check:');
      console.error('1. EMAIL_USER and EMAIL_PASS are set correctly in .env');
      console.error('2. For Gmail, use an App Password (not your regular password)');
      console.error('3. Enable "Less secure app access" or use OAuth2');
    } else if (error.code === 'ECONNECTION') {
      console.error('Connection failed. Please check:');
      console.error('1. EMAIL_HOST and EMAIL_PORT are correct');
      console.error('2. Your network connection');
      console.error('3. Firewall settings');
    }
    
    return false;
  }
};

const sendPasswordResetEmail = async (
  email: string,
  resetCode: string,
  resetLink: string
): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    
    // Verify transporter configuration
    await transporter.verify();
    console.log('Email transporter verified successfully');

    const mailOptions = {
      from: `"Campus Marketplace" <${process.env.EMAIL_USER || 'rootuser.cmp@gmail.com'}>`,
      to: email,
      subject: 'Reset Your Password - Campus Marketplace',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .code-box { background-color: white; border: 2px solid #dc2626; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
            .verification-code { font-size: 32px; font-weight: bold; color: #dc2626; letter-spacing: 8px; }
            .button { display: inline-block; background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
            .warning { background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 12px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Campus Marketplace</h1>
            </div>
            <div class="content">
              <h2>Reset Your Password</h2>
              <p>We received a request to reset your password. If you didn't make this request, please ignore this email.</p>
              
              <div class="code-box">
                <p style="margin: 0 0 10px 0; color: #6b7280;">Your reset code:</p>
                <div class="verification-code">${resetCode}</div>
                <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px;">This code expires in 1 hour</p>
              </div>

              <p>Or click the button below to reset your password:</p>
              <a href="${resetLink}" class="button">Reset Password</a>

              <div class="warning">
                <p style="margin: 0; font-size: 14px; color: #991b1b;">
                  <strong>Security Notice:</strong> If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
                </p>
              </div>

              <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
                This link will expire in 1 hour for security reasons.
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Campus Marketplace. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Reset Your Password - Campus Marketplace
        
        We received a request to reset your password. If you didn't make this request, please ignore this email.
        
        Your reset code is: ${resetCode}
        This code expires in 1 hour.
        
        Or click this link to reset: ${resetLink}
        
        Security Notice: If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
        
        This link will expire in 1 hour for security reasons.
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully:', {
      messageId: info.messageId,
      to: email,
      accepted: info.accepted,
      rejected: info.rejected
    });
    return true;
  } catch (error: any) {
    console.error('Error sending password reset email:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
      email: email
    });
    
    // Log specific error details
    if (error.code === 'EAUTH') {
      console.error('Authentication failed. Please check:');
      console.error('1. EMAIL_USER and EMAIL_PASS are set correctly in .env');
      console.error('2. For Gmail, use an App Password (not your regular password)');
      console.error('3. Enable "Less secure app access" or use OAuth2');
    } else if (error.code === 'ECONNECTION') {
      console.error('Connection failed. Please check:');
      console.error('1. EMAIL_HOST and EMAIL_PORT are correct');
      console.error('2. Your network connection');
      console.error('3. Firewall settings');
    }
    
    return false;
  }
};

const sendAccountSuspensionEmail = async (
  email: string,
  firstName: string,
  lastName: string,
  reason?: string
): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    
    // Verify transporter configuration
    await transporter.verify();
    console.log('Email transporter verified successfully');

    const displayReason = reason && reason.trim() 
      ? reason.trim() 
      : 'Your account has been suspended due to a violation of our marketplace policies.';

    const mailOptions = {
      from: `"Campus Marketplace" <${process.env.EMAIL_USER || 'rootuser.cmp@gmail.com'}>`,
      to: email,
      subject: 'Account Suspended - Campus Marketplace',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .alert-box { background-color: #fee2e2; border: 2px solid #dc2626; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .reason-box { background-color: white; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0; }
            .info-box { background-color: #e0e7ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
            .contact-info { background-color: white; padding: 16px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Account Suspended</h1>
            </div>
            <div class="content">
              <h2>Hello ${firstName} ${lastName},</h2>
              
              <div class="alert-box">
                <p style="margin: 0; font-size: 16px; font-weight: bold; color: #991b1b;">
                  Your Campus Marketplace account has been suspended.
                </p>
              </div>

              <div class="reason-box">
                <p style="margin: 0 0 8px 0; font-weight: bold; color: #991b1b;">Reason for Suspension:</p>
                <p style="margin: 0; color: #374151;">${displayReason}</p>
              </div>

              <div class="info-box">
                <p style="margin: 0 0 12px 0; font-weight: bold; color: #1e40af;">What This Means:</p>
                <ul style="margin: 0; padding-left: 20px; color: #374151;">
                  <li>You cannot log in to your account</li>
                  <li>All your listings have been hidden from the marketplace</li>
                  <li>Your active sessions have been terminated</li>
                  <li>You cannot create new listings or make purchases</li>
                </ul>
              </div>

              <div class="contact-info">
                <p style="margin: 0 0 12px 0; font-weight: bold; color: #1f2937;">Need Help or Want to Appeal?</p>
                <p style="margin: 0; color: #6b7280; font-size: 14px;">
                  If you believe this suspension was made in error or would like to appeal this decision, 
                  please contact our support team with your account details and explanation.
                </p>
                <p style="margin: 12px 0 0 0; color: #3b82f6; font-weight: bold;">
                  Support Email: rootuser.cmp@gmail.com
                </p>
              </div>

              <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
                Please review our <strong>Terms of Service</strong> and <strong>Community Guidelines</strong> 
                to understand our marketplace policies.
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Campus Marketplace. All rights reserved.</p>
              <p>This is an automated message. Please do not reply directly to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Account Suspended - Campus Marketplace
        
        Hello ${firstName} ${lastName},
        
        Your Campus Marketplace account has been suspended.
        
        Reason for Suspension:
        ${displayReason}
        
        What This Means:
        - You cannot log in to your account
        - All your listings have been hidden from the marketplace
        - Your active sessions have been terminated
        - You cannot create new listings or make purchases
        
        Need Help or Want to Appeal?
        If you believe this suspension was made in error or would like to appeal this decision,
        please contact our support team with your account details and explanation.
        
        Support Email: rootuser.cmp@gmail.com
        
        Please review our Terms of Service and Community Guidelines to understand our marketplace policies.
        
        © ${new Date().getFullYear()} Campus Marketplace. All rights reserved.
        This is an automated message. Please do not reply directly to this email.
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Account suspension email sent successfully:', {
      messageId: info.messageId,
      to: email,
      accepted: info.accepted,
      rejected: info.rejected
    });
    return true;
  } catch (error: any) {
    console.error('Error sending account suspension email:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
      email: email
    });
    
    // Log specific error details
    if (error.code === 'EAUTH') {
      console.error('Authentication failed. Please check:');
      console.error('1. EMAIL_USER and EMAIL_PASS are set correctly in .env');
      console.error('2. For Gmail, use an App Password (not your regular password)');
      console.error('3. Enable "Less secure app access" or use OAuth2');
    } else if (error.code === 'ECONNECTION') {
      console.error('Connection failed. Please check:');
      console.error('1. EMAIL_HOST and EMAIL_PORT are correct');
      console.error('2. Your network connection');
      console.error('3. Firewall settings');
    }
    
    return false;
  }
};

const sendAccountUnsuspensionEmail = async (
  email: string,
  firstName: string,
  lastName: string
): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    await transporter.verify();

    const mailOptions = {
      from: `"Campus Marketplace" <${process.env.EMAIL_USER || 'rootuser.cmp@gmail.com'}>`,
      to: email,
      subject: 'Account Reactivated - Campus Marketplace',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .success-box { background-color: #d1fae5; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .info-box { background-color: #e0e7ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Account Reactivated</h1>
            </div>
            <div class="content">
              <h2>Hello ${firstName} ${lastName},</h2>
              <div class="success-box">
                <p style="margin: 0; font-size: 16px; font-weight: bold; color: #065f46;">
                  Great news! Your Campus Marketplace account has been reactivated.
                </p>
              </div>
              <p style="margin: 20px 0; color: #374151; font-size: 15px;">
                We're happy to inform you that your account suspension has been lifted. 
                You now have full access to all Campus Marketplace features.
              </p>
              <div class="info-box">
                <p style="margin: 0 0 12px 0; font-weight: bold; color: #1e40af;">What's Been Restored:</p>
                <ul style="margin: 0; padding-left: 20px; color: #374151;">
                  <li>Full account access - you can log in again</li>
                  <li>All your listings are visible in the marketplace</li>
                  <li>Ability to create new listings</li>
                  <li>Ability to browse and purchase items</li>
                  <li>Access to messaging and chat features</li>
                </ul>
              </div>
              <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
                If you have any questions, contact our support team at rootuser.cmp@gmail.com
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Campus Marketplace. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Account Reactivated - Campus Marketplace\n\nHello ${firstName} ${lastName},\n\nGreat news! Your Campus Marketplace account has been reactivated.\n\nYou now have full access to all features.\n\nSupport: rootuser.cmp@gmail.com`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Unsuspension email sent:', info.messageId);
    return true;
  } catch (error: any) {
    console.error('Error sending unsuspension email:', error.message);
    return false;
  }
};

const sendAccountDeletionEmail = async (
  email: string,
  firstName: string,
  lastName: string,
  reason?: string
): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    await transporter.verify();

    const mailOptions = {
      from: `"Campus Marketplace" <${process.env.EMAIL_USER || 'rootuser.cmp@gmail.com'}>`,
      to: email,
      subject: 'Account Deleted - Campus Marketplace',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .warning-box { background-color: #fee2e2; border: 2px solid #dc2626; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .info-box { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Account Deleted</h1>
            </div>
            <div class="content">
              <h2>Hello ${firstName} ${lastName},</h2>
              <div class="warning-box">
                <p style="margin: 0; font-size: 16px; font-weight: bold; color: #7f1d1d;">
                  Your Campus Marketplace account has been permanently deleted.
                </p>
              </div>
              <p style="margin: 20px 0; color: #374151; font-size: 15px;">
                This action has been taken by an administrator and cannot be undone.
              </p>
              ${reason ? `
              <div class="info-box">
                <p style="margin: 0 0 8px 0; font-weight: bold; color: #92400e;">Reason for Deletion:</p>
                <p style="margin: 0; color: #374151;">${reason}</p>
              </div>
              ` : ''}
              <div class="info-box">
                <p style="margin: 0 0 12px 0; font-weight: bold; color: #92400e;">What This Means:</p>
                <ul style="margin: 0; padding-left: 20px; color: #374151;">
                  <li>You can no longer access your account</li>
                  <li>All your listings have been hidden from the marketplace</li>
                  <li>Your active sessions have been terminated</li>
                  <li>You will not be able to log in with these credentials</li>
                </ul>
              </div>
              <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
                If you believe this was done in error or have questions, please contact our support team at rootuser.cmp@gmail.com
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Campus Marketplace. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Account Deleted - Campus Marketplace\n\nHello ${firstName} ${lastName},\n\nYour Campus Marketplace account has been permanently deleted by an administrator.\n\n${reason ? `Reason: ${reason}\n\n` : ''}This action cannot be undone. You will no longer be able to access your account or listings.\n\nIf you have questions, contact support at rootuser.cmp@gmail.com`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Account deletion email sent:', info.messageId);
    return true;
  } catch (error: any) {
    console.error('Error sending account deletion email:', error.message);
    return false;
  }
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail, sendAccountSuspensionEmail, sendAccountUnsuspensionEmail, sendAccountDeletionEmail };
export { sendVerificationEmail, sendPasswordResetEmail, sendAccountSuspensionEmail, sendAccountUnsuspensionEmail, sendAccountDeletionEmail };

