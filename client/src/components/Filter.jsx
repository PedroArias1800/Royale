import { faChevronDown, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState, useEffect, useRef } from "react";

export const Filter = ({ onFilter, brands, type }) => {
  const scrollToTop = () => {
    const container = document.querySelector('.searchDisplayStyle');
    if (container) {
      container.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [search, setSearch]       = useState("");
  const [gender, setGender]       = useState("");
  const [minPrice, setMinPrice]   = useState("");
  const [maxPrice, setMaxPrice]   = useState("");
  const [brand, setBrand]         = useState("");
  const [desplegarFlecha, setDesplegarFlecha] = useState(false);

  const prevSearch   = useRef(search);
  const prevGender   = useRef(gender);
  const prevMinPrice = useRef(minPrice);
  const prevMaxPrice = useRef(maxPrice);
  const prevBrand    = useRef(brand);

  useEffect(() => {
    if (type === '1')      setGender('Damas');
    else if (type === '2') setGender('Caballeros');
    else                   setGender('');
  }, [type]);

  useEffect(() => {
    if (
      search   !== prevSearch.current   ||
      gender   !== prevGender.current   ||
      minPrice !== prevMinPrice.current ||
      maxPrice !== prevMaxPrice.current ||
      brand    !== prevBrand.current
    ) {
      onFilter({
        search,
        gender,
        minPrice: minPrice ? parseFloat(minPrice) : null,
        maxPrice: maxPrice ? parseFloat(maxPrice) : null,
        brand,
      });
      prevSearch.current   = search;
      prevGender.current   = gender;
      prevMinPrice.current = minPrice;
      prevMaxPrice.current = maxPrice;
      prevBrand.current    = brand;
    }
  }, [search, gender, minPrice, maxPrice, brand, onFilter]);

  const resetFilters = () => {
    setSearch(""); setGender(""); setMinPrice(""); setMaxPrice(""); setBrand("");
  };

  const handleSearchChange   = (e) => setSearch(e.target.value);
  const handleGenderChange   = (e) => setGender(e.target.value);
  const handleMinPriceChange = (e) => setMinPrice(e.target.value);
  const handleMaxPriceChange = (e) => setMaxPrice(e.target.value);
  const handleBrandChange    = (e) => setBrand(e.target.value);
  const handleDesplegar      = () => setDesplegarFlecha(!desplegarFlecha);

  const anyActive = search || gender || minPrice || maxPrice || brand;

  return (
    <div className="filters">
      <div className="filtersStatic">

        {/* ── Cabecera ── */}
        <div className="headerFilter">
          <h5>Filtros</h5>
          <FontAwesomeIcon
            icon={faChevronDown}
            onClick={handleDesplegar}
            className={desplegarFlecha ? 'desplegar' : ''}
          />
        </div>

        {/* ── Búsqueda ── */}
        <div className={`filters__group filters__group--search${search ? ' filter--active' : ''}`}>
          <label htmlFor="search">Búsqueda</label>
          <div className="filterInputWrapper">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="filterIcon" />
            <input
              type="text"
              id="search"
              value={search}
              onChange={handleSearchChange}
              placeholder="Nombre o fragancia..."
            />
          </div>
        </div>

        <div className="filterDivider" />

        {/* ── Marca ── */}
        <div className={`filters__group filters__group--brand${brand ? ' filter--active' : ''}`}>
          <label htmlFor="brand">Marca</label>
          <div className="filterSelectWrapper">
            <select id="brand" value={brand} onChange={handleBrandChange}>
              <option value="">Todas las marcas</option>
              {brands.map((b, index) => (
                <option key={index} value={b}>{b}</option>
              ))}
            </select>
            <span className="filterSelectChevron">&#8964;</span>
          </div>
        </div>

        <div className="filterDivider" />

        {/* ── Género ── */}
        <div className={`filters__group filters__group--gender${gender ? ' filter--active' : ''}`}>
          <label htmlFor="gender">Género</label>
          <div className="filterSelectWrapper">
            <select id="gender" value={gender} onChange={handleGenderChange}>
              <option value="">Todos</option>
              <option value="Caballeros">Caballeros</option>
              <option value="Damas">Damas</option>
            </select>
            <span className="filterSelectChevron">&#8964;</span>
          </div>
        </div>

        <div className="filterDivider" />

        {/* ── Rango de precio ── */}
        <div className={`filters__group filters__group--price${(minPrice || maxPrice) ? ' filter--active' : ''}`}>
          <label>Precio <span className="filterLabelSub">(USD)</span></label>
          <div className="filterPriceRange">
            <input
              type="number"
              id="minPrice"
              value={minPrice}
              onChange={handleMinPriceChange}
              placeholder="Mín"
            />
            <span className="filterPriceSep">—</span>
            <input
              type="number"
              id="maxPrice"
              value={maxPrice}
              onChange={handleMaxPriceChange}
              placeholder="Máx"
            />
          </div>
        </div>

        <div className="filterDivider" />

        {/* ── Restablecer ── */}
        <div className="filters__actions">
          <button
            className={`resetFilters${anyActive ? ' resetFilters--active' : ''}`}
            onClick={resetFilters}
          >
            Restablecer filtros
          </button>
        </div>

      </div>

      {/* ── Botón volver arriba ── */}
      <button className="subirTop" onClick={scrollToTop} aria-label="Volver arriba">
        <FontAwesomeIcon icon={faChevronDown} />
      </button>
    </div>
  );
};
