'use client';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isProd = process.env.NODE_ENV === 'production';

function emit(level: LogLevel, message?: any, ...meta: any[]) {
  if (isProd) {
    if (level === 'warn') {
      console.warn(message, ...meta);
    } else if (level === 'error') {
      console.error(message, ...meta);
    }
    return;
  }
  switch (level) {
    case 'debug':
      console.debug(message, ...meta);
      break;
    case 'info':
      console.info(message, ...meta);
      break;
    case 'warn':
      console.warn(message, ...meta);
      break;
    case 'error':
      console.error(message, ...meta);
      break;
  }
}

export const logger = {
  debug: (message?: any, ...meta: any[]) => emit('debug', message, ...meta),
  info: (message?: any, ...meta: any[]) => emit('info', message, ...meta),
  warn: (message?: any, ...meta: any[]) => emit('warn', message, ...meta),
  error: (message?: any, ...meta: any[]) => emit('error', message, ...meta),
};