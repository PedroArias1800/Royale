import { pool } from '../db.js';

export const getProductId = async (req, res) => {
    try {
        const id = req.params.id;
        console.log(req.params)
        const result = await pool.query(`SELECT * FROM product WHERE id_producto = ${id}`);
        console.log(result[0]);

        res.json(result[0])

    } catch (error) {
        console.log(`Error al consultar un producto. ${error.message}`)
        res.status(404).json({"error": error})
    }
}

export const getProducts = async (req, res) => {
    try {
        const [result] = await pool.query("SELECT * FROM product");
        console.table(result);

        res.json(result)

    } catch (error) {
        console.log(`Error al consultar todos los productos. ${error.message}`);

        res.status(404).json(error.message);
    }
}

export const createProduct = async (req, res) => {
    try {
        const { nombre, descripcion, precio, cantidadDisponible, imagen, tipo } = req.body;
        const [result] = await pool.query("INSERT INTO product (nombre, descripcion, precio, cantidad_disponible, imagen, tipo) VALUES (?,?,?,?,?,?)", [ nombre, descripcion, precio, cantidadDisponible, imagen, tipo ])
        console.log(result)

        res.json({
            "id_producto": result.insertId,
            "nombre": req.body.nombre,
            "estado": result.affectedRows == 1 ? 'Creado' : 'Fallido'
        })

    } catch (error) {
        res.status(500).json({"error": error.message});
    }
}

export const updateProduct = async (req, res) => {
    try {
        const id = req.params.id;
        const result = await pool.query(`UPDATE product SET ? WHERE id_producto = ${id}`, [req.body]);
        console.log(result);

        res.json(result);

    } catch (error) {
        res.status(500).json({"error": error.message});
    }
}

export const deleteProduct = async (req, res) => {
    try {
        const id = req.params.id;
        const result = await pool.query(`DELETE FROM product WHERE id_producto = ${id}`);

        res.json();

    } catch (error) {
        res.status(500).json({"error": error.message});
    }
}