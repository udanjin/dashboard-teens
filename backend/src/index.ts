import { Server } from './server';

// Gunakan PORT dari environment variable, atau 4000 jika tidak ada
const PORT =parseInt(process.env.PORT || '8080', 10);
const server = new Server();
const app = server.getApp();

app.listen(PORT, '0.0.0.0', () => { // Tambahkan '0.0.0.0'
  console.log(`🚀 Server running on port ${PORT}`);
});