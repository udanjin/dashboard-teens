import express from 'express';

console.log("🔥 Creating express app...");
const app = express();
console.log("✅ Express app created");

console.log("🌐 Setting up health route...");
app.get('/health', (req, res) => {
  console.log("🏥 Health check requested");
  res.json({ status: 'OK', message: 'Ultra minimal server working!' });
});
console.log("✅ Health route set up");

const PORT = 3000;
console.log("🚀 Starting server on port", PORT);

app.listen(PORT, () => {
  console.log(`✅ Ultra minimal server running on http://localhost:${PORT}`);
  console.log(`🏥 Test it: http://localhost:${PORT}/health`);
});

console.log("📝 End of file reached");