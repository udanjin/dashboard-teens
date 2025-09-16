// index.ts (Versatile for Local & Vercel)
import 'dotenv/config';
import { Server } from './server';

// 1. Create the server instance. This runs the constructor,
// setting up all middleware and controllers for both environments.
const serverInstance = new Server();

// 2. Check if we are NOT in a Vercel serverless environment.
// Vercel automatically sets the 'VERCEL' environment variable to '1'.
if (!process.env.VERCEL) {
  const PORT = parseInt(process.env.PORT || '4000', 10);
  // If we're running locally, call start() which contains app.listen().
  serverInstance.start(PORT)
    .then(() => {
      console.log(`✅ Local server started successfully on port ${PORT}`);
    })
    .catch((err) => {
      console.error('💥 Local server startup failed:', err);
      process.exit(1);
    });
}

// 3. Export the configured app.
// Vercel uses this export to handle requests.
// This line is effectively ignored when you run the server locally.
export default serverInstance.app;