import { Injectable, Optional } from '@nestjs/common';
import { MailService as IMailService } from '../../Domain/services/mail.service.js';
import { MailService } from '../mail/mail.service.js';

@Injectable()
export class MailServiceAdapter implements IMailService {
  constructor(
    @Optional() private readonly mailService?: MailService,
  ) {}

  async sendResetCode(email: string, code: string): Promise<void> {
    if (this.mailService) {
      await this.mailService.sendResetCode(email, code);
    }
  }
}
