import { Controller, Get } from '@nestjs/common';
import * as net from 'net';

@Controller('debug')
export class DebugController {
  @Get('postgres')
  test() {
    return new Promise((resolve) => {
      const socket = net.createConnection({
        host: '51.222.9.248',
        port: 5432,
        timeout: 5000,
      });

      socket.on('connect', () => {
        socket.destroy();
        resolve({ status: 'CONNECTED' });
      });

      socket.on('timeout', () => {
        resolve({ status: 'TIMEOUT' });
      });

      socket.on('error', (err: NodeJS.ErrnoException) => {
        resolve({
          status: 'ERROR',
          code: err.code,
          message: err.message,
        });
      });
    });
  }
}
