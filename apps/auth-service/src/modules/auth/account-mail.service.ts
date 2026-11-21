import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';

type AccountMail = 'verification' | 'reset';
const messages = {
  verification: {
    path: '/verify-email/',
    subject: 'Confirme seu e-mail no Zenith',
    instruction: 'Abra o link para confirmar seu e-mail. Ele é válido por 24 horas.',
  },
  reset: {
    path: '/reset-password/',
    subject: 'Redefina sua senha no Zenith',
    instruction: 'Abra o link para redefinir sua senha. Ele é válido por 15 minutos.',
  },
};

@Injectable()
export class AccountMailService {
  private readonly logger = new Logger(AccountMailService.name);
  private readonly transport?: Transporter;
  private readonly from?: string;
  private readonly origin?: string;
  private pending = 0;

  constructor(config: ConfigService) {
    const host = config.get<string>('SMTP_HOST');
    if (!host) return;
    this.from = config.get<string>('SMTP_FROM');
    this.origin = config.get<string>('ACCOUNT_LINK_ORIGIN');
    if (!this.from || !this.origin) throw new Error('SMTP_FROM e ACCOUNT_LINK_ORIGIN são necessários com SMTP_HOST.');

    const port = config.get<number>('SMTP_PORT') ?? 587;
    const user = config.get<string>('SMTP_USER');
    const pass = config.get<string>('SMTP_PASS');
    if (Boolean(user) !== Boolean(pass)) throw new Error('Configure SMTP_USER e SMTP_PASS juntos.');
    this.transport = createTransport({
      host,
      port,
      secure: port === 465,
      requireTLS: port !== 465 && (config.get('NODE_ENV') === 'production' || Boolean(user)),
      auth: user && pass ? { user, pass } : undefined,
      connectionTimeout: 5_000,
      greetingTimeout: 5_000,
      socketTimeout: 10_000,
      disableFileAccess: true,
      disableUrlAccess: true,
    });
  }

  enqueue(kind: AccountMail, job: () => Promise<void>) {
    if (!this.transport) return;
    if (this.pending >= 24) {
      this.logger.warn(`account_mail_dropped kind=${kind}`);
      return;
    }

    this.pending++;
    setImmediate(() => {
      void Promise.resolve().then(job).catch(() => {
        // O erro do transporte pode incluir destinatários e conteúdo da mensagem.
        this.logger.warn(`account_mail_failed kind=${kind}`);
      }).finally(() => {
        this.pending--;
      });
    });
  }

  async send(kind: AccountMail, recipient: string, token: string) {
    if (!this.transport || !this.from || !this.origin) return;
    const { path, subject, instruction } = messages[kind];
    const link = new URL(path, this.origin);
    link.hash = token;
    await this.transport.sendMail({
      from: { name: 'Zenith', address: this.from },
      to: { name: '', address: recipient },
      subject,
      text: `${instruction}\n\n${link.href}\n\nSe você não fez esta solicitação, ignore este e-mail.`,
    });
  }
}
