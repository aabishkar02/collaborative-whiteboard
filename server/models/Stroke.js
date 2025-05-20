const mongoose = require('mongoose');

const StrokeSchema = new mongoose.Schema({
  boardId: { 
    type: String, 
    required: true,
    index: true 
  },
  userId: { 
    type: String, 
    required: true 
  },
  path: [{ 
    x: Number, 
    y: Number 
  }],
  color: { 
    type: String, 
    default: '#000000' 
  },
  width: { 
    type: Number, 
    default: 2 
  }
}, { 
  timestamps: true 
});

// Create compound index for efficient querying
StrokeSchema.index({ boardId: 1, createdAt: 1 });

module.exports = mongoose.model('Stroke', StrokeSchema); 