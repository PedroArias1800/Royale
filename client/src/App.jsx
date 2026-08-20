import AOS from 'aos';
import { useEffect } from "react";
import { Index } from "./Pages/Index";
import { Route, Routes, useLocation } from "react-router-dom";
import { Search } from "./Pages/Search";
import { ParfumContextProvider } from "./context/ParfumContext";
import { ParfumDetails } from "./Pages/ParfumDetails";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Cart } from "./Pages/Cart.";
import { YappySuccess } from "./Pages/YappySuccess";
import { YappyCancel } from "./Pages/YappyCancel";
import { WompiResult } from "./Pages/WompiResult";
import { YappyPayment } from "./Pages/YappyPayment";
import { PrivacyTermModal } from './components/PrivacyTermModal.jsx';
import { Descuentos } from './Pages/Descuentos.jsx';
import { PromoLanding } from './Pages/PromoLanding.jsx';
import { WhatsAppFab } from './components/WhatsAppFab.jsx';

import 'aos/dist/aos.css';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const App = () => {

  useEffect(() => {
    AOS.init();
  }, []);

  return (
    <ParfumContextProvider>
      <ScrollToTop />
      <Header />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/search" element={<Search />} />
        <Route path="/parfum" element={<ParfumDetails />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/descuentos" element={<Descuentos />} />
        <Route path="/pago-exitoso" element={<YappySuccess />} />
        <Route path="/pago-cancelado" element={<YappyCancel />} />
        <Route path="/pago-wompi" element={<WompiResult />} />
        <Route path="/pago-yappy" element={<YappyPayment />} />
        <Route path="/promo" element={<PromoLanding />} />
        <Route path="*" element={<Index />} />
      </Routes>
      <WhatsAppFab />
      <PrivacyTermModal />
      <Footer />
    </ParfumContextProvider>
  );
};

export default App;
