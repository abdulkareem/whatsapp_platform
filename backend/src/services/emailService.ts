import { env } from '../config/env';
import { logger } from '../config/logger';
import { spawn } from 'child_process';

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

export const emailService = {
  async sendOtp(to: string, code: string) {
    const from = env.SMTP_FROM_EMAIL ?? env.ADMIN_EMAIL;
    const subject = 'Admin login OTP';
    const body = `Your admin login OTP is ${code}. It expires in ${env.OTP_EXPIRY_MINUTES} minutes.`;

    try {
      await sendViaSendmail(from, to, subject, body);
    } catch (error) {
      logger.error('Failed to send admin OTP email', { error, to });

      if (env.NODE_ENV !== 'production') {
        logger.warn('Falling back to console OTP delivery outside production', {
          to,
          code,
          expiresInMinutes: env.OTP_EXPIRY_MINUTES
        });
        return;
      }

      throw new Error('Failed to send OTP email');
    }
  }
};
