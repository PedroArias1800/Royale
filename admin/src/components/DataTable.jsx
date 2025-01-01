import { useNavigate } from "react-router-dom";
import { columnMappings, excludedColumns } from "../js/mappings";

export const DataTable = ({ data, idCategory }) => {
    const navigate = useNavigate();

    if (!Array.isArray(data)) {
      console.error("Invalid data format received:", data);
      return <p>No hay datos disponibles o el formato es inválido.</p>;
    }
  
    const headers = Object.keys(data[0] || {}).filter(
        (header) => !excludedColumns.includes(header)
      )

      const handleRowClick = (id) => {
        navigate(`/data?id=${idCategory}&reg=${id}`);
      };

    return (
      <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header} style={{ padding: '8px', textAlign: 'left' }}>
                {columnMappings[header] || header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row._id}
            onClick={() => handleRowClick(row._id)}>
              {headers.map((header) => (
                <td key={header} style={{ padding: '8px' }}>
                  {row[header]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };
  