import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import Profile from './components/Profile';
import BrowseUsers from './components/BrowseUsers';
import UserDetail from './components/UserDetail';
import MySwaps from './components/MySwaps';
import AdminAccess from './components/AdminAccess';
import AdminDashboard from './components/AdminDashboard';
import Debug from './components/Debug';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="App">
            <Navbar />
            <main>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/browse" element={<BrowseUsers />} />
                <Route path="/user/:id" element={<UserDetail />} />
                <Route path="/my-swaps" element={<MySwaps />} />
                <Route path="/admin-access" element={<AdminAccess />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/debug" element={<Debug />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
