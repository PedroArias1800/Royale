import { pool } from "../dbPg.js";

export const postCart = async (req, res) => {
    const cartItems = req.body;
    const placeholders = cartItems
        .map((_, index) => `(p.parfum_id = $${index * 2 + 1} AND t.types_id = $${index * 2 + 2})`)
        .join(" OR ");
    const values = cartItems.flatMap(item => [item.id, item.types_id]);

    const query = `
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
            ${placeholders}
        ORDER BY 
            p.parfum_id, (CAST(t.ml AS INTEGER) = 100) DESC, t.types_id ASC;
    `;

    try {
        const { rows } = await pool.query(query, values); // PostgreSQL devuelve resultados en `rows`
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error al obtener los productos");
    }
};
