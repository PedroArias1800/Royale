import { useState } from 'react'
import { useLocation } from 'react-router-dom';
import { ProductList } from "../components/ProductList";
import products from '../json/Parfum.json'
import { Filter } from '../components/Filter'
import { Header2 } from '../components/Header2'
import '../css/Search.css';
import { Footer } from '../components/Footer'

export const ParfumDetails = () => {
  // Obtén los parámetros de la URL
  const location = useLocation();
  const params = new URLSearchParams(location.search); // Para leer los parámetros de consulta

  const id = params.get('id');  // Obtiene el valor de "id" de la URL
  const type = params.get('type');  // Obtiene el valor de "type" de la URL

  const brands = [...new Set(products.Parfum.map((product) => product.marca))];
  const [filteredProducts, setFilteredProducts] = useState(products.Parfum);

  const handleFilter = ({ gender, minPrice, maxPrice, brand }) => {
    const filtered = products.Parfum.filter((product) => {
      const matchesGender = gender ? product.genero === gender : true;
      const matchesBrand = brand ? product.marca === brand : true;
      const matchesPrice = product.types.some((type) => {
        const price = parseFloat(type.price);
        return (
          (minPrice ? price >= minPrice : true) &&
          (maxPrice ? price <= maxPrice : true)
        );
      });
      return matchesGender && matchesBrand && matchesPrice;
    });
    setFilteredProducts(filtered);
  };

  return (
    <>
      <Header2/>
      <div className="app">
        <Filter onFilter={handleFilter} brands={brands} id={id} type={type} />
        <ProductList products={{ Parfum: filteredProducts }} />
      </div>
      <Footer />
    </>
  );
};