import React from 'react'
import { BrowserRouter as Router, Route, Link } from 'react-router-dom'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './css/main.css';
import './css/Carousel.css'
import './css/ParfumDetails.css'
import './css/Cart.css'
import './css/Alert.css'
import './js/Carousel.js'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>
)
