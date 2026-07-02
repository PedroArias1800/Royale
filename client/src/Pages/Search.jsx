import { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { ProductList } from "../components/ProductList";
import { Filter } from '../components/Filter';
import { getParfumsRequest } from '../api/Parfum.api.js';
import '../css/Search.css';

const PER_PAGE = 12;

export const Search = () => {
  const location = useLocation();
  const containerRef = useRef(null);
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const type = params.get('type');

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [page, setPage] = useState(1);

  const scrollTop = () => {
    window.scrollTo(0, 0);
    if (containerRef.current) containerRef.current.scrollTop = 0;
  };

  useEffect(() => { scrollTop(); }, [location.key]);

  useEffect(() => {
    async function loadParfums() {
      try {
        const response = await getParfumsRequest(50, 'Normal');
        setProducts(response.data);
        setFilteredProducts(response.data);
        const uniqueBrands = [...new Set(response.data.map(p => p.brand.brand_name))];
        setBrands(uniqueBrands);
      } catch (error) {
        console.error("Error al cargar los perfumes:", error);
        setProducts([]);
        setFilteredProducts([]);
      }
    }
    loadParfums();
  }, []);

  useEffect(() => {
    if (!products || products.length === 0) return;
    const gender = type === "1" ? 1 : type === "2" ? 2 : null;
    if (gender) {
      setFilteredProducts(products.filter(p => p.gender === gender));
      setPage(1);
    }
  }, [products, type]);

  const handleFilter = useCallback(({ search, gender, minPrice, maxPrice, brand }) => {
    if (!products || products.length === 0) return;
    const genderTemp = gender === 'Damas' ? 1 : 2;
    const filtered = products.filter(product => {
      const matchesSearch = search
        ? product.title?.toLowerCase().includes(search.toLowerCase()) ||
          product.brand.brand_name?.toLowerCase().includes(search.toLowerCase())
        : true;
      const matchesGender = gender ? product.gender === genderTemp : true;
      const matchesBrand = brand ? product.brand.brand_name === brand : true;
      const matchesPrice = product.types.some(t => {
        const isFlashActive = t?.type_of_sale === 'Flash' && t?.quantity_flash > 0;
        const price = parseFloat(isFlashActive ? t.price_flash : t.price);
        return (minPrice ? price >= minPrice : true) && (maxPrice ? price <= maxPrice : true);
      });
      return matchesSearch && matchesGender && matchesBrand && matchesPrice;
    });
    setFilteredProducts(filtered);
    setPage(1);
  }, [products]);

  const totalPages = Math.ceil(filteredProducts.length / PER_PAGE);
  const pagedProducts = filteredProducts.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const changePage = (newPage) => {
    setPage(newPage);
    scrollTop();
  };

  const pageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = [];
    if (page <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i);
      pages.push('…');
      pages.push(totalPages);
    } else if (page >= totalPages - 3) {
      pages.push(1);
      pages.push('…');
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push('…');
      pages.push(page - 1, page, page + 1);
      pages.push('…');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="app searchDisplayStyle" ref={containerRef}>
      <Filter onFilter={handleFilter} brands={brands} id={id} type={type} />

      <div className="search-results">
        {filteredProducts.length === 0 ? (
          <div className='sinDatosParaMostrar'>
            <h1>No hay datos para mostrar</h1>
          </div>
        ) : (
          <>
            <div className="search-results__count">
              {filteredProducts.length} perfume{filteredProducts.length !== 1 ? 's' : ''}
              {totalPages > 1 && ` · Página ${page} de ${totalPages}`}
            </div>

            <ProductList products={{ Parfum: pagedProducts }} />

            {totalPages > 1 && (
              <nav className="pagination" aria-label="Paginación">
                <button
                  className="pagination__btn pagination__btn--prev"
                  onClick={() => changePage(page - 1)}
                  disabled={page === 1}
                  aria-label="Página anterior"
                >‹</button>

                <div className="pagination__pages">
                  {pageNumbers().map((p, i) =>
                    p === '…' ? (
                      <span key={`ellipsis-${i}`} className="pagination__ellipsis">…</span>
                    ) : (
                      <button
                        key={p}
                        className={`pagination__page ${p === page ? 'pagination__page--active' : ''}`}
                        onClick={() => changePage(p)}
                        aria-label={`Página ${p}`}
                        aria-current={p === page ? 'page' : undefined}
                      >
                        {p}
                      </button>
                    )
                  )}
                </div>

                <button
                  className="pagination__btn pagination__btn--next"
                  onClick={() => changePage(page + 1)}
                  disabled={page === totalPages}
                  aria-label="Página siguiente"
                >›</button>
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
};
