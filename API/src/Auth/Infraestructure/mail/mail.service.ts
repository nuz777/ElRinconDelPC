import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  private createTransporter(): Transporter {
    const user = process.env.MAIL_USER?.trim();
    const pass = process.env.MAIL_PASS?.replace(/\s+/g, '');

    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
    });
  }

  async sendResetCode(to: string, code: string): Promise<void> {
    const transporter = this.createTransporter();
    const from =
      process.env.MAIL_FROM ||
      '"El Sótano del PC" <soporte.elsotanodelpc@gmail.com>';

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Código de recuperación de contraseña</title>
      </head>
      <body style="margin:0;padding:0;background-color:#09090b;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#f4f4f5;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#09090b;padding:40px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" style="max-width:480px;background-color:#18181b;border:1px solid #27272a;border-radius:16px;padding:32px;text-align:center;">
                <tr>
                  <td>
                    <p style="margin:0 0 8px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#a1a1aa;">
                      El Sótano del PC
                    </p>
                    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#ffffff;">
                      Recuperación de Contraseña
                    </h1>
                    <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#d4d4d8;">
                      Hemos recibido una solicitud para restablecer la contraseña de tu cuenta. Utiliza el siguiente código de verificación de 6 dígitos:
                    </p>
                    <div style="margin:0 auto 24px;padding:18px 24px;background-color:#09090b;border:1px solid #3f3f46;border-radius:12px;display:inline-block;">
                      <span style="font-family:monospace;font-size:32px;font-weight:700;letter-spacing:8px;color:#ffffff;">
                        ${code}
                      </span>
                    </div>
                    <p style="margin:0 0 16px;font-size:13px;color:#fbbf24;font-weight:600;">
                      ⏳ Este código caduca en 15 minutos.
                    </p>
                    <p style="margin:0;font-size:12px;line-height:1.5;color:#71717a;">
                      Si no solicitaste este cambio, puedes ignorar este correo de manera segura; tu contraseña actual no será modificada.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    try {
      await transporter.sendMail({
        from,
        to,
        subject: 'Código de recuperación de contraseña',
        html,
      });
      this.logger.log(`Código de recuperación enviado a ${to}`);
    } catch (error: unknown) {
      this.logger.error(
        `Error al enviar correo de recuperación a ${to}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }
}
