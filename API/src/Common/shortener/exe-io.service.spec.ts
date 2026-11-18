/* oxlint-disable typescript/unbound-method */
import type { ConfigService } from '@nestjs/config';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ExeIoService } from './exe-io.service.js';
import { ShortenerController } from './shortener.controller.js';

describe('ExeIoService & ShortenerController (Unit)', () => {
  let configService: ConfigService;
  let service: ExeIoService;
  let controller: ShortenerController;

  beforeEach(() => {
    configService = {
      get: vi.fn().mockReturnValue('test-exeio-token'),
    } as unknown as ConfigService;
    service = new ExeIoService(configService);
    controller = new ShortenerController(service);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('evita el doble acortamiento si la URL ya contiene exe.io', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const result = await service.shortenUrl('https://exe.io/abc123');

    expect(result).toBe('https://exe.io/abc123');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('acorta la URL correctamente codificando parámetros y alias con URLSearchParams', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          status: 'success',
          shortenedUrl: 'https://exe.io/elden99',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    const originalUrl = 'https://gofile.io/d/abc123?file=elden ring.zip&v=1';
    const result = await service.shortenUrl(originalUrl, 'elden-ring');

    expect(result).toBe('https://exe.io/elden99');
    expect(fetchSpy).toHaveBeenCalledOnce();
    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain('https://exe.io/api?');
    expect(calledUrl).toContain('api=test-exeio-token');
    expect(calledUrl).toContain(
      `url=${encodeURIComponent(originalUrl).replace(/%20/g, '+')}`,
    );
    expect(calledUrl).toContain('alias=elden-ring');
  });

  it('devuelve la URL original si falta EXEIO_API_TOKEN', async () => {
    const prevEnv = process.env.EXEIO_API_TOKEN;
    delete process.env.EXEIO_API_TOKEN;
    try {
      vi.mocked(configService.get).mockReturnValue(undefined);
      const fetchSpy = vi.spyOn(globalThis, 'fetch');

      const originalUrl = 'https://gofile.io/d/abc123';
      const result = await service.shortenUrl(originalUrl);

      expect(result).toBe(originalUrl);
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      if (prevEnv !== undefined) {
        process.env.EXEIO_API_TOKEN = prevEnv;
      }
    }
  });

  it('devuelve la URL original como fallback si exe.io devuelve status !== success o falla la red', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ status: 'error', message: 'Invalid URL' }),
          { status: 200 },
        ),
      )
      .mockRejectedValueOnce(new Error('Timeout Error'));

    const originalUrl = 'https://mega.nz/file/xyz';
    await expect(service.shortenUrl(originalUrl)).resolves.toBe(originalUrl);
    await expect(service.shortenUrl(originalUrl)).resolves.toBe(originalUrl);
  });

  it('ShortenerController.shorten delega en ExeIoService y retorna { shortenedUrl }', async () => {
    vi.spyOn(service, 'shortenUrl').mockResolvedValueOnce('https://exe.io/short1');

    const response = await controller.shorten({
      url: 'https://gofile.io/d/abc123',
      alias: 'custom',
    });

    expect(response).toEqual({ shortenedUrl: 'https://exe.io/short1' });
    expect(service.shortenUrl).toHaveBeenCalledWith(
      'https://gofile.io/d/abc123',
      'custom',
    );
  });
});
