require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');
const path = require('path');
const Whiteboard = require('./models/Whiteboard');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = 'mongodb+srv://aabishkar02:Qwerty123@cluster0.8gqgq.mongodb.net/whiteboard?retryWrites=true&w=majority';
console.log('Connecting to MongoDB...');
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Import Stroke model
const Stroke = require('./models/Stroke');

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-whiteboard', async (whiteboardId) => {
    console.log(`User ${socket.id} joining whiteboard:`, whiteboardId);
    socket.join(whiteboardId);
    
    try {
      const whiteboard = await Whiteboard.findOne({ _id: whiteboardId });
      if (whiteboard) {
        socket.emit('whiteboard-data', whiteboard.content);
      }
    } catch (error) {
      console.error('Error fetching whiteboard data:', error);
    }
  });

  socket.on('draw', (data) => {
    console.log('Draw event received:', data);
    socket.to(data.whiteboardId).emit('draw', data);
    
    // Update MongoDB
    Whiteboard.findByIdAndUpdate(
      data.whiteboardId,
      { $push: { content: data } },
      { new: true }
    ).catch(err => console.error('Error updating whiteboard:', err));
  });

  socket.on('clear-board', async (whiteboardId) => {
    console.log('Clear board event received for:', whiteboardId);
    socket.to(whiteboardId).emit('clear-board');
    
    try {
      await Whiteboard.findByIdAndUpdate(
        whiteboardId,
        { $set: { content: [] } }
      );
      console.log('Board cleared in database');
    } catch (error) {
      console.error('Error clearing whiteboard:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
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
    res.status(500).json({ message: 'Error fetching whiteboard', error: error.message });
  }
});

app.post('/api/whiteboards', async (req, res) => {
  console.log('Received request to create whiteboard:', req.body);
  try {
    const whiteboard = new Whiteboard({
      name: req.body.name || 'New Whiteboard',
      content: []
    });
    console.log('Creating new whiteboard:', whiteboard);
    const savedWhiteboard = await whiteboard.save();
    console.log('Whiteboard created successfully:', savedWhiteboard);
    res.status(201).json(savedWhiteboard);
  } catch (error) {
    console.error('Error creating whiteboard:', error);
    res.status(500).json({ 
      message: 'Error creating whiteboard', 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../client/dist')));

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 