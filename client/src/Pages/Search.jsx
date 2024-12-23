import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ProductList } from "../components/ProductList";
import { Filter } from '../components/Filter';
import { getParfumsRequest } from '../api/Parfum.api.js';
import '../css/Search.css';

export const Search = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const type = params.get('type');

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [brands, setBrands] = useState([]); // Marcas disponibles

  // Cargar productos desde la API
  useEffect(() => {
    async function loadParfums() {
      try {
        const response = await getParfumsRequest(50);
        setProducts(response.data);
        setFilteredProducts(response.data); // Inicializa con todos los productos
        const uniqueBrands = [...new Set(response.data.map((product) => product.brand))];
        setBrands(uniqueBrands);
      } catch (error) {
        console.error("Error al cargar los perfumes:", error);
        setProducts([]);
        setFilteredProducts([]);
      }
    }
    loadParfums();
  }, []);

  // Filtro inicial basado en el parámetro "type"
  useEffect(() => {
    if (!products || products.length === 0) return;

    const gender = type === "1" ? "Damas" : type === "2" ? "Caballeros" : null;

    if (gender) {
      const filtered = products.filter((product) => product.gender === gender);
      setFilteredProducts(filtered);
    }
  }, [products, type]); // Ejecutar solo cuando se cargan productos o cambia el tipo

  // Lógica para manejar los filtros personalizados
  const handleFilter = ({ search, gender, minPrice, maxPrice, brand }) => {
    if (!products || products.length === 0) return;

    const filtered = products.filter((product) => {
      const matchesSearch = search
        ? product.title?.toLowerCase().includes(search.toLowerCase()) ||
          product.brand?.toLowerCase().includes(search.toLowerCase())
        : true;
      const matchesGender = gender ? product.gender === gender : true;
      const matchesBrand = brand ? product.brand === brand : true;
      const matchesPrice = product.types.some((type) => {
        const price = parseFloat(type.price);
        return (
          (minPrice ? price >= minPrice : true) &&
          (maxPrice ? price <= maxPrice : true)
        );
      });
      return matchesSearch && matchesGender && matchesBrand && matchesPrice;
    });

    setFilteredProducts(filtered);
  };

  return (
    <div className="app">
      <Filter onFilter={handleFilter} brands={brands} id={id} type={type} />
      <ProductList products={{ Parfum: filteredProducts }} />
    </div>
  );
};
