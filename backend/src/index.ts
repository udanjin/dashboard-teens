import { Server } from "./server";

const server = new Server();
const app = server.getApp();

// Untuk Vercel
export default app;

// Untuk development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  });
}