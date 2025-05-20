import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const [whiteboardId, setWhiteboardId] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const createWhiteboard = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('http://localhost:3001/api/whiteboards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'New Whiteboard' }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to create whiteboard');
      }
      
      const data = await response.json();
      navigate(`/whiteboard/${data._id}`);
    } catch (error) {
      console.error('Error creating whiteboard:', error);
      setError('Failed to create whiteboard. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const joinWhiteboard = (e) => {
    e.preventDefault();
    if (whiteboardId.trim()) {
      navigate(`/whiteboard/${whiteboardId.trim()}`);
    }
  };

  return (
    <div className="home-container">
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="app-title">Collaborative Whiteboard</h1>
          <p className="app-description">
            Create and share interactive whiteboards in real-time. Perfect for brainstorming, teaching, and team collaboration.
          </p>
          
          <div className="actions-container">
            <button 
              onClick={createWhiteboard} 
              className="create-button"
              disabled={loading}
            >
              {loading ? (
                <span className="loading-spinner"></span>
              ) : (
                <>
                  <span className="button-icon">✨</span>
                  Create New Whiteboard
                </>
              )}
            </button>
            
            <div className="divider">
              <span>OR</span>
            </div>
            
            <div className="join-section">
              <form onSubmit={joinWhiteboard}>
                <input
                  type="text"
                  value={whiteboardId}
                  onChange={(e) => setWhiteboardId(e.target.value)}
                  placeholder="Enter Whiteboard ID"
                  required
                  className="whiteboard-input"
                />
                <button type="submit" className="join-button">
                  <span className="button-icon">🚀</span>
                  Join
                </button>
              </form>
            </div>
          </div>
          
          {error && <div className="error-message">{error}</div>}
        </div>
        
        <div className="hero-image">
          <div className="illustration">
            <div className="illustration-whiteboard">
              <div className="illustration-scribble"></div>
              <div className="illustration-scribble"></div>
              <div className="illustration-scribble"></div>
            </div>
            <div className="illustration-cursor"></div>
          </div>
        </div>
      </div>
      
      <footer className="home-footer">
        <p>Collaborative Whiteboard — Real-time collaboration made simple</p>
      </footer>
    </div>
  );
};

export default Home; 