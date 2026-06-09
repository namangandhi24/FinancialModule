import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('smtp.host');
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: this.configService.get<number>('smtp.port'),
        secure: this.configService.get<number>('smtp.port') === 465,
        auth: {
          user: this.configService.get<string>('smtp.user'),
          pass: this.configService.get<string>('smtp.pass'),
        },
      });
    }
  }

  async send(to: string, subject: string, text: string, html?: string) {
    const from = this.configService.get<string>('smtp.from');

    if (!this.transporter) {
      this.logger.log(`[DEV EMAIL] To: ${to} | Subject: ${subject}\n${text}`);
      return { sent: false, dev: true };
    }

    await this.transporter.sendMail({ from, to, subject, text, html: html || text });
    return { sent: true };
  }

  isConfigured() {
    return !!this.transporter;
  }
}
