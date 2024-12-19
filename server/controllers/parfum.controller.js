import { pool } from "../db.js";


export const parfumVersion = async (req, res) => {
    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ message: 'Falta el parámetro id' });
    }
    
    try {
        const [rows] = await pool.query(`
            SELECT 
                p.parfum_id,
                b.brand_name,
                p.title,
                p.description,
                p.gender,
                t.types_id,
                v.version_name,
                t.ml,
                t.img,
                t.price,
                t.old_price
            FROM 
                parfum p
            INNER JOIN
                brand b ON b.brand_id = p.brand_id_fk
            LEFT JOIN 
                types t ON t.parfum_id_fk = p.parfum_id
            INNER JOIN 
                version v ON v.version_id = t.version_id_fk
            WHERE 
                p.parfum_id = ?
            ORDER BY 
                p.parfum_id, t.ml = 100 DESC, t.types_id ASC;
            `, [id]);

        // Agrupar perfumes con sus respectivos types
        const result = rows.reduce((acc, row) => {
            // Buscar si el perfume ya está en el array acumulador
            const parfum = acc.find(p => p.id === row.parfum_id.toString());

            if (!parfum) {
                // Si no existe, agregar el perfume con los datos básicos y types inicial
                acc.push({
                    id: row.parfum_id.toString(),
                    brand: row.brand_name,
                    title: row.title,
                    description: row.description,
                    gender: row.gender,
                    types: row.types_id ? [{
                        types_id: row.types_id.toString(),
                        version_name: row.version_name,
                        ml: row.ml,
                        img: row.img,
                        price: parseFloat(row.price).toFixed(2),
                        old_price: parseFloat(row.old_price).toFixed(2)
                    }] : [] // Si no hay type asociado, dejar un array vacío
                });
            } else if (row.types_id) {
                // Si el perfume ya existe, agregar un nuevo type
                parfum.types.push({
                    types_id: row.types_id.toString(),
                    version_name: row.version_name,
                    ml: row.ml,
                    img: row.img,
                    price: parseFloat(row.price).toFixed(2),
                    old_price: parseFloat(row.old_price).toFixed(2)
                });
            }

            return acc;
        }, []);

        res.json(result[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};


export const allParfums = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                p.parfum_id,
                b.brand_name,
                p.title,
                p.description,
                p.gender,
                t.types_id,
                v.version_name,
                t.ml,
                t.img,
                t.price,
                t.old_price
            FROM 
                parfum p
            INNER JOIN
                brand b ON b.brand_id = p.brand_id_fk
            LEFT JOIN 
                types t ON t.parfum_id_fk = p.parfum_id
            INNER JOIN 
                version v ON v.version_id = t.version_id_fk
            ORDER BY 
                p.parfum_id, t.ml = 100 DESC, t.types_id ASC;
        `);

        // Agrupar perfumes con sus respectivos types
        const result = rows.reduce((acc, row) => {
            // Buscar si el perfume ya está en el array acumulador
            const parfum = acc.find(p => p.id === row.parfum_id.toString());

            if (!parfum) {
                // Si no existe, agregar el perfume con datos básicos
                acc.push({
                    id: row.parfum_id.toString(),
                    brand: row.brand_name,
                    title: row.title,
                    description: row.description,
                    gender: row.gender === 1 ? 'Damas' : 'Caballeros',
                    types: [] // Inicialmente vacío
                });
            }

            // Agregar types si coincide el ml o es el primero que se encuentra
            if (row.ml === 100 || !acc.find(p => p.id === row.parfum_id.toString()).types.length) {
                const currentParfum = acc.find(p => p.id === row.parfum_id.toString());
                currentParfum.types = [{
                    types_id: row.types_id.toString(),
                    version_name: row.version_name,
                    ml: row.ml,
                    img: row.img,
                    price: parseFloat(row.price).toFixed(2),
                    old_price: parseFloat(row.old_price).toFixed(2)
                }];
            }

            return acc;
        }, []);

        res.json(result);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};


export const parfumsBody = async (req, res) => {
    try {
        const [result] = await pool.query(`
            SELECT
                b.body_id,
                b.title,
                b.align,
                b.parfum_img,
                b.back_img,
                b.url,
                b.color,
                b.color2,
                p.description
            FROM
                body b
            INNER JOIN
                parfum p ON b.parfum_id_fk = p.parfum_id
            WHERE
                status = 1`);
        console.table(result);

        res.json(result)

    } catch (error) {
        console.log(`Error al consultar los Bodies activos. ${error.message}`);

        res.status(404).json(error.message);
    }
};



// export const createClient = async (req, res) => {
//     try {
//         const { nombre, apellido, cedula, fecha_nac, direccion } = req.body;
//         const [result] = await pool.query('INSERT INTO client (nombre, apellido, cedula, fecha_nac, direccion) VALUES (?,?,?,?,?)', [ nombre, apellido, cedula, fecha_nac, direccion ])
//         console.log(result);
//         res.json({
//             clienteId: result.insertId,
//             cedula: cedula
//         })

//     } catch (error) {
//         console.log(error);
//         if(error.errno == 1062)
//             return res.status(405).json({error: "Ya existe un cliente con la misma cédula"})

//         res.status(500).json({error: error.message})
//     }
// }

// export const updateClient = async (req, res) => {
//     try {
//         const id = req.params.id
//         console.log('Estoy en el PUT')
//         const result = await pool.query(`UPDATE client SET ? WHERE id_cliente = ${id} OR cedula = '${id}'`, [req.body])
//         res.json(result)

//     } catch (error) {
//         console.log(error)
//         res.status(500).json({error: error.message})
//     }
// }

// export const deleteClient = async (req, res) => {
//     try { 
//         const id = req.params.id;
//         const [result] = await pool.query(`DELETE FROM client WHERE id_cliente = ${id}`)
//         console.log(result);
//         res.json(result);
        
//     } catch (error) {
//         console.log(error.message)
//         res.status(404).json({error: error.message});
//     }
// }