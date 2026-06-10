import { httpServer } from './app.js';
import { initSocket } from './socket.js';

initSocket(httpServer);

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`\n🚀 PulseFlow API running on http://localhost:${PORT}`);
  console.log(`📡 Socket.IO ready for real-time connections`);
  console.log(`🗄️  Database: ${process.env.DATABASE_URL}\n`);
});
