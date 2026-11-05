export * from './hashing.service.js';
export * from './mail.service.js';
export * from './jwt-payload.service.js';

/** Token de inyección para el servicio de hash (puerto del dominio). */
export const HASHING_SERVICE = Symbol('HASHING_SERVICE');

/** Token de inyección para el servicio de correo (puerto del dominio). */
export const MAIL_SERVICE = Symbol('MAIL_SERVICE');

/** Token de inyección para el servicio JWT (puerto del dominio). */
export const JWT_SERVICE = Symbol('JWT_SERVICE');
