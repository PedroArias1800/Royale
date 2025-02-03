import { columnMappings, excludedColumns } from "../js/mappings";
import { useAuth } from "../context/AuthProvider.jsx";
import { useEffect } from "react";

export const DataTable = ({ data, idCategory }) => {
  const { setModalData, setIdNumber, closeModal, URLServer, URLFrontend } = useAuth();

  useEffect(() => {
    closeModal()
  }, [])

  if (!Array.isArray(data)) {
    console.error("Invalid data format received:", data);
    return <p>No hay datos disponibles o el formato es inválido.</p>;
  }

  // Filtramos las columnas excluidas y mapeamos las cabeceras
  const headers = Object.keys(data[0] || {}).filter((header) => {
    if (excludedColumns.includes(header)) {
        return false;
    }

    if (header === "status" && idCategory == 7) {
      return false;
    }
    else if (header === "createdAt" && idCategory == 7) {
      return true;
    }

    return true;
  });

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
                  : header === "createdAt"
                  ? `${(row[header]).split('T')[0]} a las ${(row[header]).split('T')[1].split('.')[0]}`
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
                    ? <img src={`${URLServer}${row[header]}`} alt="Imagen" style={{ width: "100px", height: "100px", margin: 'auto !important' }} />
                    : (["media"].includes(header)) && row[header]
                      ? row[header]?.includes('.mp4') || row[header]?.includes(".webm") || row[header]?.includes(".ogg") 
                        ? <video src={`${URLServer}${row[header]}`} alt="Imagen" style={{ width: "100%", height: "200px", margin: 'auto !important' }} autoPlay={true} />
                        : <img src={`${URLServer}${row[header]}`} alt={row[header]} style={{ width: "100%", height: "200px", margin: 'auto !important', objectFit: 'contain'}} />
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
