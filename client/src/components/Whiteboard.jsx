import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import './Whiteboard.css';

// Create socket connection
const socket = io('http://localhost:3001', {
  transports: ['websocket']
});

const Whiteboard = () => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState(null);
  const { id } = useParams();
  const prevPoint = useRef(null);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [currentWidth, setCurrentWidth] = useState(2);
  const [connected, setConnected] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');
  const [activeUsers, setActiveUsers] = useState(0);
  const [isEraser, setIsEraser] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    setContext(ctx);

    // Set canvas size to be responsive but maintain aspect ratio
    const updateCanvasSize = () => {
      const container = document.querySelector('.whiteboard-container');
      if (container) {
        const width = Math.min(window.innerWidth * 0.8, 1200);
        const height = Math.min(window.innerHeight * 0.7, 800);
        canvas.width = width;
        canvas.height = height;
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    // Set default stroke style
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Join whiteboard room
    socket.emit('join-whiteboard', id);

    // Listen for drawing events
    socket.on('draw-line', (data) => {
      console.log('Received draw-line event:', data);
      
      drawLine(
        ctx,
        data.x0,
        data.y0,
        data.x1,
        data.y1,
        data.color,
        data.width,
        data.isEraser
      );
    });

    // Listen for clear board event
    socket.on('clear-board', (whiteboardId) => {
      console.log('Received clear-board event for:', whiteboardId);
      if (whiteboardId === id) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    });

    // Listen for initial whiteboard data
    socket.on('whiteboard-data', (content) => {
      console.log('Received whiteboard data:', content);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (Array.isArray(content)) {
        content.forEach(data => {
          drawLine(
            ctx,
            data.x0,
            data.y0,
            data.x1,
            data.y1,
            data.color,
            data.width,
            data.isEraser
          );
        });
      }
    });
    
    // Track connection state
    socket.on('connect', () => {
      setConnected(true);
      // Re-join room on reconnect
      socket.emit('join-whiteboard', id);
    });
    
    socket.on('disconnect', () => {
      setConnected(false);
    });

    // Listen for user count updates
    socket.on('user-count-update', (data) => {
      console.log('User count update:', data);
      setActiveUsers(data.count);
    });

    return () => {
      socket.off('draw-line');
      socket.off('clear-board');
      socket.off('whiteboard-data');
      socket.off('connect');
      socket.off('disconnect');
      socket.off('user-count-update');
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [id, currentColor, currentWidth]);

  // Common function to draw a line
  const drawLine = (context, x0, y0, x1, y1, color, width, eraser = false) => {
    if (!context) return;
    
    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(x1, y1);
    
    if (eraser) {
      context.globalCompositeOperation = 'destination-out';
      context.strokeStyle = 'rgba(255,255,255,1)';
    } else {
      context.globalCompositeOperation = 'source-over';
      context.strokeStyle = color || '#000';
    }
    
    context.lineWidth = width || 2;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.stroke();
    
    // Reset composite operation to default
    context.globalCompositeOperation = 'source-over';
  };

  const startDrawing = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawing(true);
    prevPoint.current = { x, y };
  };

  const draw = (e) => {
    if (!isDrawing) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    // Draw on local canvas
    drawLine(
      context,
      prevPoint.current.x,
      prevPoint.current.y,
      currentX,
      currentY,
      currentColor,
      currentWidth,
      isEraser
    );

    // Emit drawing data
    const data = {
      whiteboardId: id,
      x0: prevPoint.current.x,
      y0: prevPoint.current.y,
      x1: currentX,
      y1: currentY,
      color: currentColor,
      width: currentWidth,
      isEraser: isEraser
    };
    console.log('Emitting draw-line event:', data);
    socket.emit('draw-line', data);
    
    // Update previous point
    prevPoint.current = { x: currentX, y: currentY };
  };

  // Handle touch events for mobile
  const handleTouchStart = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    setIsDrawing(true);
    prevPoint.current = { x, y };
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    
    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    const currentX = touch.clientX - rect.left;
    const currentY = touch.clientY - rect.top;

    // Draw on local canvas
    drawLine(
      context,
      prevPoint.current.x,
      prevPoint.current.y,
      currentX,
      currentY,
      currentColor,
      currentWidth,
      isEraser
    );

    // Emit drawing data
    const data = {
      whiteboardId: id,
      x0: prevPoint.current.x,
      y0: prevPoint.current.y,
      x1: currentX,
      y1: currentY,
      color: currentColor,
      width: currentWidth,
      isEraser: isEraser
    };
    socket.emit('draw-line', data);
    
    // Update previous point
    prevPoint.current = { x: currentX, y: currentY };
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearBoard = () => {
    if (!canvasRef.current || !context) return;
    
    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    socket.emit('clear-board', id);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(id).then(() => {
      setCopySuccess('Copied!');
      setTimeout(() => setCopySuccess(''), 2000);
    }, (err) => {
      console.error('Could not copy text: ', err);
    });
  };

  const changeColor = (color) => {
    setCurrentColor(color);
    setIsEraser(false);
  };

  const changeWidth = (width) => {
    setCurrentWidth(width);
  };

  const toggleEraser = () => {
    setIsEraser(!isEraser);
  };

  return (
    <div className="whiteboard-container">
      <div className="whiteboard-header">
        <h1 className="whiteboard-title">Collaborative Whiteboard</h1>
        <div className="connection-info">
          <div className="whiteboard-status">
            <span className="status-dot" style={{ backgroundColor: connected ? '#4caf50' : '#ff5722' }}></span>
            {connected ? 'Connected' : 'Disconnected'}
          </div>
          {activeUsers > 0 && (
            <div className="active-users">
              <span className="user-icon">👥</span>
              {activeUsers} {activeUsers === 1 ? 'user' : 'users'} online
            </div>
          )}
        </div>
      </div>

      <div className="whiteboard-toolbar">
        <div className="toolbar-section">
          <div className="section-label">Colors</div>
          <div className="tools-group">
            <button 
              className={`tool-button color-button ${currentColor === '#000000' && !isEraser ? 'active' : ''}`} 
              onClick={() => changeColor('#000000')}
              title="Black"
              style={{ backgroundColor: '#000000' }}
            ></button>
            <button 
              className={`tool-button color-button ${currentColor === '#FF0000' && !isEraser ? 'active' : ''}`} 
              onClick={() => changeColor('#FF0000')}
              title="Red"
              style={{ backgroundColor: '#FF0000' }}
            ></button>
            <button 
              className={`tool-button color-button ${currentColor === '#0000FF' && !isEraser ? 'active' : ''}`} 
              onClick={() => changeColor('#0000FF')}
              title="Blue"
              style={{ backgroundColor: '#0000FF' }}
            ></button>
            <button 
              className={`tool-button color-button ${currentColor === '#008000' && !isEraser ? 'active' : ''}`} 
              onClick={() => changeColor('#008000')}
              title="Green"
              style={{ backgroundColor: '#008000' }}
            ></button>
            <button 
              className={`tool-button color-button ${currentColor === '#FFA500' && !isEraser ? 'active' : ''}`} 
              onClick={() => changeColor('#FFA500')}
              title="Orange"
              style={{ backgroundColor: '#FFA500' }}
            ></button>
            <button 
              className={`tool-button color-button ${currentColor === '#800080' && !isEraser ? 'active' : ''}`} 
              onClick={() => changeColor('#800080')}
              title="Purple"
              style={{ backgroundColor: '#800080' }}
            ></button>
          </div>
        </div>

        <div className="separator"></div>
        
        <div className="toolbar-section">
          <div className="section-label">Brush Size</div>
          <div className="tools-group">
            <button 
              className={`tool-button ${currentWidth === 2 ? 'active' : ''}`} 
              onClick={() => changeWidth(2)}
              title="Small (2px)"
            >
              <div className="brush-size small"></div>
            </button>
            <button 
              className={`tool-button ${currentWidth === 5 ? 'active' : ''}`} 
              onClick={() => changeWidth(5)}
              title="Medium (5px)"
            >
              <div className="brush-size medium"></div>
            </button>
            <button 
              className={`tool-button ${currentWidth === 10 ? 'active' : ''}`} 
              onClick={() => changeWidth(10)}
              title="Large (10px)"
            >
              <div className="brush-size large"></div>
            </button>
          </div>
        </div>

        <div className="separator"></div>

        <div className="toolbar-section">
          <div className="section-label">Tools</div>
          <div className="tools-group">
            <button 
              className={`tool-button ${isEraser ? 'active' : ''}`}
              onClick={toggleEraser}
              title={isEraser ? "Pen" : "Eraser"}
            >
              <span className="action-icon">{isEraser ? '✏️' : '🧽'}</span>
            </button>
            <button onClick={clearBoard} className="tool-button action-button" title="Clear Board">
              <span className="action-icon">🧹</span>
            </button>
          </div>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={stopDrawing}
      />

      <div className="whiteboard-footer">
        <button onClick={clearBoard} className="clear-button">
          <span className="button-icon">🧹</span> Clear Board
        </button>
      </div>

      <div className="whiteboard-id">
        <span>Whiteboard ID: {id.substring(0, 12)}...</span>
        <button onClick={copyToClipboard} className="copy-button" title="Copy ID">
          {copySuccess ? '✓' : '📋'}
        </button>
      </div>
    </div>
  );
};

export default Whiteboard; 