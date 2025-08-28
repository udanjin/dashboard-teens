// src/index.ts
import { Server } from './server';  // Ensure you import the class from the correct path

const server = new Server();
const port = parseInt(process.env.PORT || '3000');
server.start(port);
