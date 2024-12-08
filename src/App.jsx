import { useEffect } from "react";
import AOS from 'aos';
import { Index } from "./Pages/Index";
import { Route, Routes } from "react-router-dom";
import { Search } from "./Pages/Search";

/* Css */
import "./css/Responsive.css";
import 'aos/dist/aos.css';
import { NotFound } from "./Pages/NotFound";
import { ParfumDetails } from "./Pages/ParfumDetails";

const App = () => {

  useEffect(() => {
    AOS.init();
  }, []);

  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/search" element={<Search />} />
        <Route path="/parfum" element={<ParfumDetails />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

export default App;
