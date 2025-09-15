// index.ts - CORRECTED VERSION

import { Server } from './server';

(async () => {
  const PORT = parseInt(process.env.PORT || '8080', 10);
  const server = new Server();
  await server.start(PORT);
})();