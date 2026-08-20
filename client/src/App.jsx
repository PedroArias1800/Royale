import AOS from 'aos';
import { lazy, Suspense, useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { ParfumContextProvider } from "./context/ParfumContext";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { WhatsAppFab } from './components/WhatsAppFab.jsx';
import { PrivacyTermModal } from './components/PrivacyTermModal.jsx';

import 'aos/dist/aos.css';

const Index         = lazy(() => import('./Pages/Index').then(m => ({ default: m.Index })));
const Search        = lazy(() => import('./Pages/Search').then(m => ({ default: m.Search })));
const ParfumDetails = lazy(() => import('./Pages/ParfumDetails').then(m => ({ default: m.ParfumDetails })));
const Cart          = lazy(() => import('./Pages/Cart').then(m => ({ default: m.Cart })));
const Descuentos    = lazy(() => import('./Pages/Descuentos').then(m => ({ default: m.Descuentos })));
const PromoLanding  = lazy(() => import('./Pages/PromoLanding').then(m => ({ default: m.PromoLanding })));
const YappySuccess  = lazy(() => import('./Pages/YappySuccess').then(m => ({ default: m.YappySuccess })));
const YappyCancel   = lazy(() => import('./Pages/YappyCancel').then(m => ({ default: m.YappyCancel })));
const WompiResult   = lazy(() => import('./Pages/WompiResult').then(m => ({ default: m.WompiResult })));
const YappyPayment  = lazy(() => import('./Pages/YappyPayment').then(m => ({ default: m.YappyPayment })));

const PageLoader = () => (
  <div style={{
    minHeight: '60vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }}>
    <div style={{
      width: '36px',
      height: '36px',
      border: '2px solid rgba(253,208,94,0.15)',
      borderTopColor: '#fdd05e',
      borderRadius: '50%',
      animation: 'spin 0.75s linear infinite',
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
};

const App = () => {
  useEffect(() => { AOS.init(); }, []);

  return (
    <ParfumContextProvider>
      <ScrollToTop />
      <Header />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/"               element={<Index />} />
          <Route path="/search"         element={<Search />} />
          <Route path="/parfum"         element={<ParfumDetails />} />
          <Route path="/cart"           element={<Cart />} />
          <Route path="/descuentos"     element={<Descuentos />} />
          <Route path="/promo"          element={<PromoLanding />} />
          <Route path="/pago-exitoso"   element={<YappySuccess />} />
          <Route path="/pago-cancelado" element={<YappyCancel />} />
          <Route path="/pago-wompi"     element={<WompiResult />} />
          <Route path="/pago-yappy"     element={<YappyPayment />} />
          <Route path="*"               element={<Index />} />
        </Routes>
      </Suspense>
      <WhatsAppFab />
      <PrivacyTermModal />
      <Footer />
    </ParfumContextProvider>
  );
};

export default App;
