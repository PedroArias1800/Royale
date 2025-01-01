import AOS from 'aos';
import { useEffect } from "react";
import { Index } from "./Pages/Index";
import { Route, Routes } from "react-router-dom";
import { Header } from './components/Header.jsx';
import { Footer } from "./components/Footer.jsx";
import { AuthProvider } from './context/AuthProvider.jsx';

import 'aos/dist/aos.css';
import { Login } from './Pages/Login.jsx';
import { Admin } from './Pages/Admin.jsx';
import { Register } from './pages/Register.jsx';
import { Data } from './pages/Data.jsx';

const App = () => {

  useEffect(() => {
    AOS.init();
  }, []);

  return (
    <AuthProvider>
      <Header />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/data" element={<Data />} />
        <Route path="*" element={<Index />} />
      </Routes>
      <Footer />
    </AuthProvider>
  );
};

export default App;
