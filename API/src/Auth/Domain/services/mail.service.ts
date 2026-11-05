export interface MailService {
  sendResetCode(email: string, code: string): Promise<void>;
}
