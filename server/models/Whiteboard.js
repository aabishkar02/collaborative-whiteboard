const mongoose = require('mongoose');

const WhiteboardSchema = new mongoose.Schema({
  name: {
    type: String,
    default: 'Untitled Whiteboard'
  },
  content: [{
    whiteboardId: String,
    x0: Number,
    y0: Number,
    x1: Number,
    y1: Number,
    color: String,
    width: Number,
    isEraser: {
      type: Boolean,
      default: false
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Whiteboard', WhiteboardSchema); 