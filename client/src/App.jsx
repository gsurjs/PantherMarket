import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage'; // importing register page
import HomePage from './pages/HomePage';

// a simple base for the homepage for now
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
            {/* Add a Login link here later */}
          </ul>
        </nav>

        <hr />

        {/* --- Route Configuration --- */}
        {/* This section tells React which component to show for each URL */}
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<HomePageComponent />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;