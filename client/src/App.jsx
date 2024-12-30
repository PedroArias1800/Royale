import AOS from 'aos';
import { useEffect } from "react";
import { Index } from "./Pages/Index";
import { Route, Routes } from "react-router-dom";
import { Search } from "./Pages/Search";
import { ParfumContextProvider } from "./context/ParfumContext";
import { NotFound } from "./Pages/NotFound";
import { ParfumDetails } from "./Pages/ParfumDetails";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Cart } from "./Pages/Cart.";
import { PrivacyTermModal } from './components/PrivacyTermModal.jsx';

import 'aos/dist/aos.css';
import { Login } from './Pages/Login.jsx';
import { Admin } from './Pages/Admin.jsx';

const App = () => {

  useEffect(() => {
    AOS.init();
  }, []);

  return (
    <ParfumContextProvider>
      <Header />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/search" element={<Search />} />
        <Route path="/parfum" element={<ParfumDetails />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <PrivacyTermModal />
      <Footer />
    </ParfumContextProvider>
  );
};

export default App;
