import AOS from 'aos';
import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { Header } from './components/Header.jsx';
import { Footer } from "./components/Footer.jsx";
import { AuthProvider } from './context/AuthProvider.jsx';

import 'aos/dist/aos.css';
import { Login } from './pages/Login.jsx';
import { Admin } from './pages/Admin.jsx';
import { Register } from './pages/Register.jsx';
import { Data } from './pages/Data.jsx';
import { Finanzas } from './Pages/Finanzas.jsx';
import { Delivery } from './pages/Delivery.jsx';
import { Descuentos } from './pages/Descuentos.jsx';
import { Cortes } from './pages/Cortes.jsx';

const App = () => {

  useEffect(() => {
    AOS.init();
  }, []);

  return (
    <AuthProvider>
      <Header />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/data" element={<Data />} />
        <Route path="/finanzas" element={<Finanzas />} />
        <Route path="/delivery" element={<Delivery />} />
        <Route path="/descuentos" element={<Descuentos />} />
        <Route path="/cortes" element={<Cortes />} />
        <Route path="*" element={<Login />} />
      </Routes>
      <Footer />
    </AuthProvider>
  );
};

export default App;
