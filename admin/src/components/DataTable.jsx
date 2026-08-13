import { columnMappings, excludedColumns, excludedColumnsSeller } from "../js/mappings";
import { useAuth } from "../context/AuthProvider.jsx";
import { useState } from "react";

const NON_SORTABLE = new Set(['products', 'productsTypes', 'quantities', 'img', 'back_img', 'parfum_img', 'media', 'products_prices']);

export const DataTable = ({ data, idCategory }) => {
  const { user, setModalData, setIdNumber, imgSrc, URLFrontend } = useAuth();
  const [productsThatApply] = useState(['Todos', 'Damas', 'Caballeros']);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  if (!Array.isArray(data)) {
    console.error("Invalid data format received:", data);
    return <p>No hay datos disponibles o el formato es inválido.</p>;
  }

  const isAdmin = user?.roles?.includes(1) || user?.rol == 1;

  let headers = Object.keys(data[0] || {}).filter((header) => {
    if (isAdmin){
      if (excludedColumns.includes(header)) return false;
    } else {
      if (excludedColumnsSeller.includes(header)) return false;
    }
    if (header === "status" && idCategory == 7) return false;
    return true;
  });

  // Transacciones: order_number aparece primero
  if (idCategory == 7 && headers.includes('order_number')) {
    headers = ['order_number', ...headers.filter(h => h !== 'order_number')];
  }

  const handleSort = (key) => {
    if (NON_SORTABLE.has(key)) return;
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedData = sortKey
    ? [...data].sort((a, b) => {
        const va = a[sortKey] ?? '';
        const vb = b[sortKey] ?? '';
        const sa = typeof va === 'string' ? va.toLowerCase() : String(va);
        const sb = typeof vb === 'string' ? vb.toLowerCase() : String(vb);
        if (sa < sb) return sortDir === 'asc' ? -1 : 1;
        if (sa > sb) return sortDir === 'asc' ? 1 : -1;
        return 0;
      })
    : data;

  const handleRowClick = (row) => {
    if (isAdmin){
      setIdNumber(parseInt(idCategory, 10))
      setModalData(row)
    }
  };

  return (
    <table border="1" className="responsiveTable">
      <thead>
        <tr>
          {headers.map((header) => {
            const sortable = !NON_SORTABLE.has(header);
            const isActive = sortKey === header;
            return (
              <th
                key={header}
                style={{
                  padding: "8px",
                  textAlign: "left",
                  cursor: sortable ? 'pointer' : 'default',
                  userSelect: 'none',
                  whiteSpace: 'nowrap',
                }}
                onClick={() => sortable && handleSort(header)}
                title={sortable ? 'Ordenar por esta columna' : undefined}
              >
                {columnMappings[header] || header}
                {sortable && (
                  <span style={{
                    marginLeft: '5px',
                    fontSize: '0.7em',
                    opacity: isActive ? 1 : 0.25,
                    color: isActive ? '#fdd05e' : 'inherit',
                  }}>
                    {isActive ? (sortDir === 'asc' ? '▲' : '▼') : '▲'}
                  </span>
                )}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {sortedData.map((row) => (
          <tr key={row._id} onClick={() => handleRowClick(row)}>
            {headers.map((header) => (
              <td key={header} style={{ padding: "8px" }}>
                {
                  header === "version_id_fk"
                  ? row[header]?.version_name || "N/A"
                  : header === "productsThatApply"
                  ? productsThatApply[row[header]] || "N/A"
                  : header === "brand_id_fk"
                  ? row[header]?.brand_name || "N/A"
                  : header === "provider_id_fk"
                  ? row[header]?.provider_name || "N/A"
                  : header === "createdAt"
                  ? (() => { const d = new Date(row[header]); return `${d.toLocaleDateString('sv-SE', { timeZone: 'America/Panama' })} a las ${d.toLocaleTimeString('es-PA', { timeZone: 'America/Panama', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}`; })()
                  : header === "parfum_id_fk"
                  ? <a href={`${URLFrontend}/parfum?id=${row[header]?._id}`} target="_blank">{row[header]?.title}</a> || "N/A"
                  : header === "gender"
                  ? row[header] === 1
                    ? "Damas"
                    : "Caballeros"
                    : header === "status"
                  ? row[header] === 1
                    ? "Activado"
                    : "Desactivado"
                    : header === "align"
                  ? row[header] === 'auto'
                    ? "Derecha"
                    : "Izquierda"
                    : (["products", "productsTypes", "quantities"].includes(header)) && row[header]
                  ? Array.isArray(row[header]) && header == 'products'
                    ? <div style={{display: 'flex', flexDirection: 'column'}}>
                        {
                          row[header].map((item, id) => (
                            <a href={`${URLFrontend}/parfum?id=${item?.split('=')[0]}`} key={id} target="_blank" style={{width: '100% !'}}>{item?.split('=')[1]}</a> || "N/A"
                          ))
                        }
                      </div>
                    : Array.isArray(row[header])
                    ? row[header].map((item, id) => (
                      <p key={id}>{item}</p>
                    ))
                    : <p>{row[header]}</p>
                  : (["img", "back_img", "parfum_img"].includes(header)) && row[header]
                  ? <img src={imgSrc(row[header])} alt="Imagen" style={{ width: "100px", height: "100px", margin: 'auto !important' }} />
                  : (["media"].includes(header)) && row[header]
                  ? row[header]?.includes('.mp4') || row[header]?.includes(".webm") || row[header]?.includes(".ogg")
                    ? <video src={imgSrc(row[header])} alt="Imagen" style={{ width: "100%", height: "200px", margin: 'auto !important' }} autoPlay={true} />
                    : <img src={imgSrc(row[header])} alt={row[header]} style={{ width: "100%", height: "200px", margin: 'auto !important', objectFit: 'contain'}} />
                  : row[header]
                }
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
