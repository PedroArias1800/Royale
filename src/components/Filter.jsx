import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { HashLink } from "react-router-hash-link";
import React, { useState, useEffect, useRef } from "react";

export const Filter = ({ onFilter, brands, type }) => {
  const [gender, setGender] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [brand, setBrand] = useState("");
  const [desplegarFlecha, setDesplegarFlecha] = useState(false);

  // Usamos useRef para comparar los valores anteriores con los nuevos
  const prevGender = useRef(gender);
  const prevMinPrice = useRef(minPrice);
  const prevMaxPrice = useRef(maxPrice);
  const prevBrand = useRef(brand);

  // Establecer el género solo cuando llega "type"
  useEffect(() => {
    if (type === "1") {
        setGender("Damas");
    } else if (type === "2") {
        setGender("Caballeros");
    }
  }, [type]); // Solo se ejecuta cuando 'type' cambia

  // Llamar a onFilter solo si los valores han cambiado
  useEffect(() => {
    // Solo actualizar el filtro si hay cambios en los valores
    if (
      gender !== prevGender.current ||
      minPrice !== prevMinPrice.current ||
      maxPrice !== prevMaxPrice.current ||
      brand !== prevBrand.current
    ) {
      onFilter({
        gender,
        minPrice: minPrice ? parseFloat(minPrice) : null,
        maxPrice: maxPrice ? parseFloat(maxPrice) : null,
        brand,
      });

      // Actualizamos las referencias para la próxima comparación
      prevGender.current = gender;
      prevMinPrice.current = minPrice;
      prevMaxPrice.current = maxPrice;
      prevBrand.current = brand;
    }
  }, [gender, minPrice, maxPrice, brand, onFilter]); // Dependemos de los valores de los filtros

  // Manejar el cambio en el filtro de género
  const handleGenderChange = (e) => {
    setGender(e.target.value);
  };

  // Manejar el cambio en los filtros de precio y marca
  const handleMinPriceChange = (e) => {
    setMinPrice(e.target.value);
  };

  const handleMaxPriceChange = (e) => {
    setMaxPrice(e.target.value);
  };

  const handleBrandChange = (e) => {
    setBrand(e.target.value);
  };

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
          <option value="Caballeros">Hombre</option>
          <option value="Damas">Mujer</option>
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
      <HashLink to={'#Header2'} className="subirTop">
        <FontAwesomeIcon icon={faChevronDown}/>
      </HashLink>
    </div>
  );
};
