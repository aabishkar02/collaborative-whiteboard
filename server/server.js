const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const socketIO = require('socket.io');
const path = require('path');
const Whiteboard = require('./models/Whiteboard');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = 'your_mongodb';

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 5000
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1); // Exit if we can't connect to MongoDB
});

// Socket.IO setup
const io = socketIO(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST']
  }
});

// Socket.IO event handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-whiteboard', async (whiteboardId) => {
    console.log(`User ${socket.id} joining whiteboard:`, whiteboardId);
    
    // Leave any previous rooms
    const rooms = Array.from(socket.rooms);
    rooms.forEach(room => {
      if (room !== socket.id) {
        socket.leave(room);
      }
    });

    // Join new room
    socket.join(whiteboardId);
    console.log(`User ${socket.id} joined room:`, whiteboardId);
    
    try {
      let whiteboard = await Whiteboard.findById(whiteboardId);
      if (!whiteboard) {
        whiteboard = new Whiteboard({
          _id: whiteboardId,
          name: 'Untitled Whiteboard',
          content: []
        });
        await whiteboard.save();
        console.log('Created new whiteboard:', whiteboardId);
      }
      console.log('Sending whiteboard data to user:', whiteboardId);
      socket.emit('whiteboard-data', whiteboard.content || []);
      
      // Get active users count in the room
      const clients = await io.in(whiteboardId).fetchSockets();
      const activeUsers = clients.length;
      
      // Broadcast to everyone in the room that a new user joined
      io.in(whiteboardId).emit('user-count-update', { count: activeUsers });
    } catch (error) {
      console.error('Error in join-whiteboard:', error);
    }
  });

  socket.on('draw-line', async (data) => {
    console.log(`User ${socket.id} drawing on whiteboard:`, data.whiteboardId);
    try {
      const whiteboard = await Whiteboard.findById(data.whiteboardId);
      if (whiteboard) {
        whiteboard.content = whiteboard.content || [];
        whiteboard.content.push({
          whiteboardId: data.whiteboardId,
          x0: data.x0,
          y0: data.y0,
          x1: data.x1,
          y1: data.y1,
          color: data.color,
          width: data.width,
          isEraser: data.isEraser || false
        });
        await whiteboard.save();

        // Broadcast to all clients in the room
        console.log('Broadcasting draw-line to room:', data.whiteboardId);
        socket.broadcast.to(data.whiteboardId).emit('draw-line', data);
      }
    } catch (error) {
      console.error('Error in draw-line event:', error);
    }
  });

  socket.on('clear-board', async (whiteboardId) => {
    console.log(`User ${socket.id} clearing whiteboard:`, whiteboardId);
    try {
      const whiteboard = await Whiteboard.findById(whiteboardId);
      if (whiteboard) {
        whiteboard.content = [];
        await whiteboard.save();
        
        // Broadcast to all other clients in the room
        console.log('Broadcasting clear-board to room:', whiteboardId);
        socket.broadcast.to(whiteboardId).emit('clear-board', whiteboardId);
      }
    } catch (error) {
      console.error('Error in clear-board event:', error);
    }
  });

  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);
    
    // Find all rooms this socket was in
    const rooms = Array.from(socket.rooms || []);
    
    // For each room, update the user count
    for (const room of rooms) {
      if (room !== socket.id) {
        // Get the new count of users in the room
        const clients = await io.in(room).fetchSockets();
        const activeUsers = clients.length - 1; // -1 because the disconnected user is still counted
        
        // Broadcast the new count to all clients in the room
        io.in(room).emit('user-count-update', { count: activeUsers });
      }
    }
  });
});

// API Routes
app.get('/api/whiteboards/:id', async (req, res) => {
  try {
    const whiteboard = await Whiteboard.findById(req.params.id);
    if (!whiteboard) {
      return res.status(404).json({ message: 'Whiteboard not found' });
    }
    res.json(whiteboard);
  } catch (error) {
    console.error('Error fetching whiteboard:', error);
    res.status(500).json({ message: 'Error fetching whiteboard' });
  }
});

app.post('/api/whiteboards', async (req, res) => {
  try {
    const whiteboard = new Whiteboard({
      name: req.body.name || 'Untitled Whiteboard',
      content: []
    });
    await whiteboard.save();
    console.log('Created new whiteboard:', whiteboard._id);
    res.status(201).json(whiteboard);
  } catch (error) {
    console.error('Error creating whiteboard:', error);
    res.status(500).json({ message: 'Error creating whiteboard' });
  }
});

// Serve static files from React app
app.use(express.static(path.join(__dirname, '../client/dist')));

// Handle React routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 