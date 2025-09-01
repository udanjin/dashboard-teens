import { Server } from './server';

const PORT = process.env.PORT || 4000;
const server = new Server();
const app = server.getApp();

app.listen(PORT, () => {
  console.log(`🚀 Local server running on http://localhost:${PORT}`);
});