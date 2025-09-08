import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext'; // Import the useAuth hook
import { auth } from './firebase';

import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage'; // Import the LoginPage

function HomePageComponent() {
  return <h1>Welcome to PantherMarket!</h1>;
}

function Navbar() {
  const { currentUser } = useAuth(); // Get the current user from context
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/login'); // Redirect to login page after logout
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <nav>
      <ul>
        <li><Link to="/">Home</Link></li>
        {currentUser ? (
          <>
            <li><Link to="/profile">Profile</Link></li>
            <li><button onClick={handleLogout}>Logout</button></li>
          </>
        ) : (
          <>
            <li><Link to="/register">Register</Link></li>
            <li><Link to="/login">Login</Link></li>
          </>
        )}
      </ul>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div>
        <Navbar /> {/* Use the new Navbar component */}
        <hr />
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<HomePageComponent />} />
          {/* Add a /profile route here later */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;