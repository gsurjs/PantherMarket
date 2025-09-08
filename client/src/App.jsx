import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';

// Simple component for the homepage
function HomePageComponent() {
  return (
    <div>
      <h1>Welcome to PantherMarket!</h1>
      <p>This is the homepage where listings will be displayed.</p>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div>
        {/* --- Navigation Bar --- */}
        <nav>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/register">Register</Link>
            </li>
          </ul>
        </nav>

        <hr />

        {/* --- Route Configuration --- */}
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<HomePageComponent />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;