import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const EXE_IO_API_URL = 'https://exe.io/api';
const EXE_IO_DOMAIN = 'exe.io';
const EXE_IO_TIMEOUT_MS = 5000;

interface ExeIoApiResponse {
  status?: string;
  shortenedUrl?: string;
  message?: string | string[];
}

@Injectable()
export class ExeIoService {
  private readonly logger = new Logger(ExeIoService.name);

  constructor(@Optional() private readonly configService?: ConfigService) {}

  private resolveApiToken(): string | undefined {
    const fromConfig = this.configService?.get<string>('EXEIO_API_TOKEN');
    const raw = fromConfig ?? process.env.EXEIO_API_TOKEN;
    return raw?.trim() || undefined;
  }

  /**
   * Acorta una URL de descarga utilizando la API de exe.io.
   * - Si la URL ya pertenece a exe.io, la devuelve sin cambios.
   * - Si no hay token configurado, ocurre un timeout/error de red o exe.io no responde
   *   con `{ status: 'success', shortenedUrl }`, registra una advertencia y devuelve la URL original.
   */
  async shortenUrl(url: string, alias?: string): Promise<string> {
    const trimmedUrl = url.trim();
    if (!trimmedUrl || trimmedUrl === '#') {
      return url;
    }

    if (trimmedUrl.toLowerCase().includes(EXE_IO_DOMAIN)) {
      return trimmedUrl;
    }

    const apiToken = this.resolveApiToken();
    if (!apiToken) {
      this.logger.warn(
        'EXEIO_API_TOKEN no está configurado; se conservará la URL original.',
      );
      return trimmedUrl;
    }

    const params = new URLSearchParams({
      api: apiToken,
      url: trimmedUrl,
    });
    if (alias?.trim()) {
      params.set('alias', alias.trim());
    }

    try {
      const response = await fetch(`${EXE_IO_API_URL}?${params.toString()}`, {
        method: 'GET',
        signal: AbortSignal.timeout(EXE_IO_TIMEOUT_MS),
      });

      if (!response.ok) {
        this.logger.warn(
          `exe.io respondió con HTTP ${response.status} al acortar "${trimmedUrl}"; usando URL original.`,
        );
        return trimmedUrl;
      }

      const payload = (await response.json()) as ExeIoApiResponse;
      if (
        payload?.status === 'success' &&
        typeof payload.shortenedUrl === 'string' &&
        payload.shortenedUrl.trim().length > 0
      ) {
        return payload.shortenedUrl.trim();
      }

      const detail = Array.isArray(payload?.message)
        ? payload.message.join(', ')
        : (payload?.message ?? 'respuesta sin shortenedUrl');
      this.logger.warn(
        `exe.io no pudo acortar "${trimmedUrl}" (${detail}); usando URL original.`,
      );
      return trimmedUrl;
    } catch (err) {
      this.logger.warn(
        `Fallo al conectar con exe.io para "${trimmedUrl}": ${err instanceof Error ? err.message : String(err)}. Usando URL original.`,
      );
      return trimmedUrl;
    }
  }
}
