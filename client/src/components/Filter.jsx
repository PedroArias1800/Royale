import { faChevronDown, faMagnifyingGlass, faSort } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const SORT_OPTIONS = [
  { value: '',           label: 'Relevancia'           },
  { value: 'price_asc',  label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
  { value: 'name_asc',   label: 'Nombre A–Z'            },
  { value: 'name_desc',  label: 'Nombre Z–A'            },
];

export const Filter = ({ onFilter, onSort, brands, type }) => {
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
  const [sortOpen, setSortOpen]   = useState(false);
  const [sortValue, setSortValue] = useState("");
  const sortRef = useRef(null);

  const prevSearch   = useRef(search);
  const prevGender   = useRef(gender);
  const prevMinPrice = useRef(minPrice);
  const prevMaxPrice = useRef(maxPrice);
  const prevBrand    = useRef(brand);

  useEffect(() => {
    const handleClick = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

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

  const handleSort = (value) => {
    setSortValue(value);
    onSort?.(value);
    setSortOpen(false);
  };

  const sortLabel = SORT_OPTIONS.find(o => o.value === sortValue)?.label || 'Ordenar';

  const handleSearchChange   = (e) => setSearch(e.target.value);
  const handleGenderChange   = (e) => setGender(e.target.value);
  const handleMinPriceChange = (e) => setMinPrice(e.target.value);
  const handleMaxPriceChange = (e) => setMaxPrice(e.target.value);
  const handleBrandChange    = (e) => setBrand(e.target.value);

  const anyActive = search || gender || minPrice || maxPrice || brand;

  return (
    <div className="filters">
      <div className="filtersStatic">

        {/* ── Cabecera ── */}
        <div className="headerFilter">
          <h5>Filtros</h5>
        </div>

        {/* ── Búsqueda + Limpiar ── */}
        <div className={`filters__group filters__group--search${search ? ' filter--active' : ''}`}>
          <div className="filter__search-row">
            <div className="filterInputWrapper filter__search-input">
              <FontAwesomeIcon icon={faMagnifyingGlass} className="filterIcon" />
              <input
                type="text"
                id="search"
                value={search}
                onChange={handleSearchChange}
                placeholder="Nombre o fragancia..."
              />
            </div>
            <button
              className={`filter__limpiar-btn${anyActive ? ' filter__limpiar-btn--active' : ''}`}
              onClick={resetFilters}
              title="Limpiar filtros"
            >
              Limpiar
            </button>
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

        {/* ── Ordenar ── */}
        <div className="filters__group filters__group--sort filters__actions" ref={sortRef}>
          <button
            className={`filter__sort-btn${sortValue ? ' filter__sort-btn--active' : ''}`}
            onClick={() => setSortOpen(o => !o)}
            aria-expanded={sortOpen}
          >
            <FontAwesomeIcon icon={faSort} />
            <span>{sortLabel}</span>
          </button>
          {sortOpen && (
            <div className="filter__sort-dropdown">
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  className={`filter__sort-option${sortValue === opt.value ? ' filter__sort-option--active' : ''}`}
                  onClick={() => handleSort(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

      </div>

      {createPortal(
        <button className="subirTop" onClick={scrollToTop} aria-label="Volver arriba">
          <FontAwesomeIcon icon={faChevronDown} />
        </button>,
        document.body
      )}
    </div>
  );
};
