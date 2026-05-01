require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const app = require('./app');
const connectDB = require('./config/db');

const http = require('http');
const socket = require('./utils/socket');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = socket.init(server);

io.on('connection', (client) => {
  console.log('Client connected:', client.id);
  
  client.on('joinProject', (projectId) => {
    client.join(projectId);
    console.log(`Client ${client.id} joined project ${projectId}`);
  });
  
  client.on('leaveProject', (projectId) => {
    client.leave(projectId);
  });
  
  client.on('disconnect', () => {
    console.log('Client disconnected:', client.id);
  });
});

connectDB().then(() => {
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 TaskFlow API running on http://0.0.0.0:${PORT}`);
  });
});
