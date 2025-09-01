// src/index.ts
import app from './server'; // Impor app yang sudah diekspor dari Server.ts

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Local server running on http://localhost:${PORT}`);
});