import { pool } from "../dbPg.js";

// Función para obtener la versión de un perfume
export const parfumVersion = async (req, res) => {
    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ message: 'Falta el parámetro id' });
    }
    
    try {
        const { rows } = await pool.query(`
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
                version v ON v.version_id = p.version_id_fk
            WHERE 
                p.parfum_id = $1
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

export const ejemploPg = async(req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT * FROM body`,);


        res.json(result);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}

// Función para obtener todos los perfumes
export const allParfums = async (req, res) => {
    let { limit } = req.headers;
    limit = parseInt(limit, 10);

    try {
        const { rows } = await pool.query(`
            SELECT 
                p.parfum_id,
                b.brand_name,
                p.title,
                p.description,
                p.gender,
                t.types_id,
                v.version_name,
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
                version v ON v.version_id = p.version_id_fk
            WHERE
                p.status = 1
            ORDER BY 
                RANDOM()
            LIMIT $1;
        `, [limit]);

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

// Función para obtener los cuerpos de los perfumes
export const parfumsBody = async (req, res) => {
    try {
        const { rows } = await pool.query(`
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
                b.status = 1
        `);
        console.table(rows);

        res.json(rows);

    } catch (error) {
        console.log(`Error al consultar los Bodies activos. ${error.message}`);
        res.status(404).json(error.message);
    }
};
