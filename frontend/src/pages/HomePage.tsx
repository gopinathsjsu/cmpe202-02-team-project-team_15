import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const handleSearchClick = () => {
    navigate('/search');
  };

  return (
    <div className="home-page">
      <div className="home-container">
        <header className="home-header">
          <h1>Campus Marketplace</h1>
          <p>Find everything you need for campus life</p>
        </header>
        
        <div className="home-content">
          <button 
            className="search-cta-button"
            onClick={handleSearchClick}
          >
            Browse Products
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
