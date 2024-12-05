import { useEffect } from "react";
import AOS from 'aos';
import { Index } from "./Pages/Index";
import { Route, Routes } from "react-router-dom";

/* Css */
import "./css/Responsive.css";
import 'aos/dist/aos.css';

const App = () => {

  useEffect(() => {
    AOS.init();
  }, []);

  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        {/* <Route path="*" element={<NotFound />} /> */}
      </Routes>
    </>
  );
};

export default App;
