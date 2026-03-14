import { spawn } from 'child_process';

import { env } from '../config/env';
import { logger } from '../config/logger';

const sendViaSendmail = (from: string, to: string, subject: string, text: string) =>
  new Promise<void>((resolve, reject) => {
    const process = spawn('sendmail', ['-t', '-i']);
    let stderr = '';

    process.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    process.on('error', reject);

    process.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`sendmail exited with ${code}: ${stderr}`));
    });

    process.stdin.write(`From: ${from}\n`);
    process.stdin.write(`To: ${to}\n`);
    process.stdin.write(`Subject: ${subject}\n`);
    process.stdin.write('Content-Type: text/plain; charset=UTF-8\n\n');
    process.stdin.write(text);
    process.stdin.end();
  });

const canUseSmtp =
  Boolean(env.SMTP_HOST) &&
  Boolean(env.SMTP_PORT) &&
  Boolean(env.SMTP_USER) &&
  Boolean(env.SMTP_PASS);

const sendViaSmtp = async (from: string, to: string, subject: string, text: string) => {
  const dynamicImport = new Function('moduleName', 'return import(moduleName)') as (
    moduleName: string
  ) => Promise<any>;
  const nodemailer = await dynamicImport('nodemailer');

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    }
  });

  await transporter.sendMail({
    from,
    to,
    subject,
    text
  });
};

export const emailService = {
  async sendOtp(to: string, code: string) {
    const from = env.SMTP_FROM_EMAIL ?? env.ADMIN_EMAIL;
    const subject = 'Admin login OTP';
    const body = `Your admin login OTP is ${code}. It expires in ${env.OTP_EXPIRY_MINUTES} minutes.`;

    if (canUseSmtp) {
      try {
        await sendViaSmtp(from, to, subject, body);
        return;
      } catch (smtpError) {
        logger.error('SMTP transport failed for admin OTP email', { smtpError, to });
      }
    }

    try {
      await sendViaSendmail(from, to, subject, body);
      return;
    } catch (sendmailError) {
      logger.error('Sendmail transport failed for admin OTP email', { sendmailError, to });
    }

    throw new Error('No email transport succeeded for admin OTP delivery');
  }
};
