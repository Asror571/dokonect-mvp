const io = require('socket.io-client');

console.log('🔌 Testing WebSocket Connection...\n');

// Connect to the server
const socket = io('http://localhost:5000', {
  transports: ['websocket'],
  reconnection: true
});

socket.on('connect', () => {
  console.log('✅ WebSocket connected successfully!');
  console.log('Socket ID:', socket.id);
  
  // Test joining a room
  socket.emit('join_room', { roomId: 'test-room-123' });
  console.log('📨 Sent: join_room event');
  
  // Test sending a message
  setTimeout(() => {
    socket.emit('send_message', {
      roomId: 'test-room-123',
      message: 'Hello from test!',
      senderId: 'test-user-1'
    });
    console.log('📨 Sent: send_message event');
  }, 1000);
  
  // Disconnect after 3 seconds
  setTimeout(() => {
    console.log('\n✅ WebSocket test completed successfully!');
    socket.disconnect();
    process.exit(0);
  }, 3000);
});

socket.on('message', (data) => {
  console.log('📩 Received message:', data);
});

socket.on('new_message', (data) => {
  console.log('📩 Received new_message:', data);
});

socket.on('order_update', (data) => {
  console.log('📦 Received order_update:', data);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
  process.exit(1);
});

socket.on('disconnect', () => {
  console.log('🔌 WebSocket disconnected');
});

// Timeout after 10 seconds
setTimeout(() => {
  console.log('⏱️  Test timeout');
  process.exit(1);
}, 10000);
