import { columnMappings, excludedColumns } from "../js/mappings";
import { useAuth } from "../context/AuthProvider.jsx";
const URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4001'

export const DataTable = ({ data, idCategory }) => {
  const { setModalData, setIdNumber } = useAuth();

  if (!Array.isArray(data)) {
    console.error("Invalid data format received:", data);
    return <p>No hay datos disponibles o el formato es inválido.</p>;
  }

  // Filtramos las columnas excluidas y mapeamos las cabeceras
  const headers = Object.keys(data[0] || {}).filter(
    (header) => !excludedColumns.includes(header)
  );

  const handleRowClick = (row) => {
    setIdNumber(parseInt(idCategory, 10))
    setModalData(row)
  };

  return (
    <table border="1" style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          {headers.map((header) => (
            <th key={header} style={{ padding: "8px", textAlign: "left" }}>
              {columnMappings[header] || header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row) => (
          <tr key={row._id} onClick={() => handleRowClick(row)}>
            {headers.map((header) => (
              <td key={header} style={{ padding: "8px" }}>
                {
                  header === "version_id_fk"
                  ? row[header]?.version_name || "N/A"
                  : header === "brand_id_fk"
                  ? row[header]?.brand_name || "N/A"
                  : header === "parfum_id_fk"
                  ? row[header]?.title || "N/A"
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
                    ? "Izquierda"
                    : "Derecha"
                  : header === "img" && row[header]
                  ? <img src={`${URL}${row[header]}`} alt="Imagen" style={{ maxWidth: "100px", maxHeight: "100px", margin: 'auto !important' }} />
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
