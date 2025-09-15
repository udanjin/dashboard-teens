// index.ts - NO TYPESCRIPT ERRORS VERSION
console.log("🔥 Application starting...");

console.log("📦 About to import Server...");
import { Server } from './server';
console.log("✅ Server import completed");

const PORT = parseInt(process.env.PORT || '4000', 10);
console.log("🚀 Port:", PORT);

console.log("🏗️  Creating server instance...");
const server = new Server();
console.log("🏗️  Server instance created successfully");

console.log("🚀 About to start server...");
server.start(PORT)
  .then(() => {
    console.log("✅ Server startup completed successfully");
  })
  .catch((err) => {
    console.error('💥 Server startup failed:');
    console.error(err);
    process.exit(1);
  });

console.log("📝 End of index.ts file reached");