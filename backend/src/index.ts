import "dotenv/config";
import { Server } from "./server";

const serverInstance = new Server();

  const PORT = parseInt(process.env.PORT || "4000", 10);
  serverInstance
    .start(PORT)
    .catch((err) => {
      console.error("Server startup failed:", err);
      process.exit(1);
    });


export default serverInstance.app;
