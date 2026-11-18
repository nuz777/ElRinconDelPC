/* oxlint-disable typescript/unbound-method */
import * as nodemailer from 'nodemailer';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MailService } from './mail.service.js';
import { MailServiceAdapter } from './mailservice.adapter.js';

const sendMailMock = vi.fn().mockResolvedValue({ messageId: 'msg-1' });

vi.mock('nodemailer', () => ({
  createTransport: vi.fn(() => ({
    sendMail: sendMailMock,
  })),
}));

describe('MailService & MailServiceAdapter (Unit)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sendResetCode reutiliza el transporter con pool: true entre envíos', async () => {
    process.env.MAIL_USER = 'soporte@test.com';
    process.env.MAIL_PASS = 'pass 1234';

    const service = new MailService();
    await service.sendResetCode('user@test.com', '123456');
    await service.sendResetCode('user2@test.com', '654321');

    expect(nodemailer.createTransport).toHaveBeenCalledTimes(1);
    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      service: 'gmail',
      pool: true,
      maxConnections: 3,
      auth: {
        user: 'soporte@test.com',
        pass: 'pass1234',
      },
    });
    expect(sendMailMock).toHaveBeenCalledTimes(2);
    expect(sendMailMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        to: 'user@test.com',
        html: expect.stringContaining('123456'),
      }),
    );
  });

  it('MailServiceAdapter delega cuando existe MailService y no falla si está ausente', async () => {
    const mailMock = { sendResetCode: vi.fn().mockResolvedValue(undefined) } as unknown as MailService;
    const adapterWithMail = new MailServiceAdapter(mailMock);
    await adapterWithMail.sendResetCode('a@b.com', '111111');
    expect(mailMock.sendResetCode).toHaveBeenCalledWith('a@b.com', '111111');

    const adapterWithoutMail = new MailServiceAdapter(undefined);
    await expect(adapterWithoutMail.sendResetCode('a@b.com', '111111')).resolves.toBeUndefined();
  });
});
