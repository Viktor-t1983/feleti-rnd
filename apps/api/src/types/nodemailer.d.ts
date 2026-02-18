declare module 'nodemailer' {
  export interface Transporter {
    sendMail(options: SendMailOptions): Promise<SentMessageInfo>;
    verify(): Promise<boolean>;
  }

  export interface SendMailOptions {
    from?: string;
    to: string | string[];
    subject: string;
    html?: string;
    text?: string;
    cc?: string | string[];
    bcc?: string | string[];
    attachments?: Attachment[];
  }

  export interface SentMessageInfo {
    messageId: string;
    accepted: string[];
    rejected: string[];
    pending: string[];
  }

  export interface Attachment {
    filename?: string;
    content?: string | Buffer;
    path?: string;
    contentType?: string;
  }

  export interface TestAccount {
    user: string;
    pass: string;
  }

  export function createTransport(config: TransportConfig): Transporter;

  export interface TransportConfig {
    host: string;
    port: number;
    secure?: boolean;
    auth: {
      user: string;
      pass: string;
    };
  }

  export function getTestMessageUrl(info: SentMessageInfo): string | false;

  export function createTestAccount(): Promise<TestAccount>;
}
