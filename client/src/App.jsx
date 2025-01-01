import AOS from 'aos';
import { useEffect } from "react";
import { Index } from "./Pages/Index";
import { Route, Routes } from "react-router-dom";
import { Search } from "./Pages/Search";
import { ParfumContextProvider } from "./context/ParfumContext";
import { ParfumDetails } from "./Pages/ParfumDetails";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Cart } from "./Pages/Cart.";
import { PrivacyTermModal } from './components/PrivacyTermModal.jsx';

import 'aos/dist/aos.css';

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
        <Route path="*" element={<Index />} />
      </Routes>
      <PrivacyTermModal />
      <Footer />
    </ParfumContextProvider>
  );
};

export default App;
