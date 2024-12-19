import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { HashLink } from "react-router-hash-link";
import React, { useState, useEffect, useRef } from "react";

export const Filter = ({ onFilter, brands, type }) => {
  const [search, setSearch] = useState("");
  const [gender, setGender] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [brand, setBrand] = useState("");
  const [desplegarFlecha, setDesplegarFlecha] = useState(false);

  // Usamos useRef para comparar los valores anteriores con los nuevos
  const prevSearch = useRef(search);
  const prevGender = useRef(gender);
  const prevMinPrice = useRef(minPrice);
  const prevMaxPrice = useRef(maxPrice);
  const prevBrand = useRef(brand);

  // Establecer el género solo cuando llega "type"
  useEffect(() => {
    if (type === 1) {
        setGender("Damas");
    } else {
        setGender("Caballeros");
    }
  }, [type]); // Solo se ejecuta cuando 'type' cambia

  // Llamar a onFilter solo si los valores han cambiado
  useEffect(() => {
    // Solo actualizar el filtro si hay cambios en los valores
    if (
      search !== prevSearch.current ||
      gender !== prevGender.current ||
      minPrice !== prevMinPrice.current ||
      maxPrice !== prevMaxPrice.current ||
      brand !== prevBrand.current
    ) {
      onFilter({
        search,
        gender,
        minPrice: minPrice ? parseFloat(minPrice) : null,
        maxPrice: maxPrice ? parseFloat(maxPrice) : null,
        brand,
      });

      // Actualizamos las referencias para la próxima comparación
      
      prevSearch.current = search;
      prevGender.current = gender;
      prevMinPrice.current = minPrice;
      prevMaxPrice.current = maxPrice;
      prevBrand.current = brand;
    }
  }, [search, gender, minPrice, maxPrice, brand, onFilter]); // Dependemos de los valores de los filtros

  const resetFilters = () => {
    setSearch("");
    setGender("");
    setMinPrice("");
    setMaxPrice("");
    setBrand("");
  };

  // Manejar el cambio en el filtro de género
  const handleSearchChange = (e) => setSearch(e.target.value);
  const handleGenderChange = (e) => setGender(e.target.value);
  const handleMinPriceChange = (e) => setMinPrice(e.target.value);
  const handleMaxPriceChange = (e) => setMaxPrice(e.target.value);
  const handleBrandChange = (e) => setBrand(e.target.value);

  const handleDesplegar = () => {
    setDesplegarFlecha(!desplegarFlecha)
  }
  
  return (
    <div className="filters">
      <div className="headerFilter">
        <h5>Filtros</h5>
        <FontAwesomeIcon icon={faChevronDown} onClick={handleDesplegar} className={`${desplegarFlecha ? 'desplegar' : ''}`}/>
      </div>

      <div className="filters__group">
        <label htmlFor="search">Búsqueda:</label>
        <input
          type="text"
          id="search"
          value={search}
          onChange={handleSearchChange}
          placeholder="Buscar productos..."
        />
      </div>

      <div className="filters__group">
        <label htmlFor="brand">Marca:</label>
        <select
          id="brand"
          value={brand}
          onChange={handleBrandChange}
          >
          <option value="">Todas</option>
          {brands.map((b, index) => (
            <option key={index} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>

      <div className="filters__group">
        <label htmlFor="gender">Género:</label>
        <select
          id="gender"
          value={gender}
          onChange={handleGenderChange}
          >
          <option value="">Todos</option>
          <option value="Caballeros">Caballeros</option>
          <option value="Damas">Damas</option>
        </select>
      </div>

      <div className="filters__group">
        <label htmlFor="minPrice">Precio Mínimo:</label>
        <input
          type="number"
          id="minPrice"
          value={minPrice}
          onChange={handleMinPriceChange}
          placeholder="Ej. 50.00"
          />
      </div>

      <div className="filters__group">
        <label htmlFor="maxPrice">Precio Máximo:</label>
        <input
          type="number"
          id="maxPrice"
          value={maxPrice}
          onChange={handleMaxPriceChange}
          placeholder="Ej. 200.00"
          />
      </div>

      <div className="filters__actions">
        <button className={'resetFilters'} onClick={resetFilters}>Restablecer</button>
      </div>

      <HashLink to={'/search/#Top'} className="subirTop">
        <FontAwesomeIcon icon={faChevronDown}/>
      </HashLink>
    </div>
  );
};
