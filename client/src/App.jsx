import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Whiteboard from './components/Whiteboard';
import Home from './components/Home';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/whiteboard/:id" element={<Whiteboard />} />
      </Routes>
    </Router>
  );
}

export default App;
 