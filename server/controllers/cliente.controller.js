import { pool } from "../db.js";

export const clientId = async (req, res) => {
    const id = req.params.id;
    console.log(id)
    try {
        const [result] = await pool.query(`SELECT * FROM client WHERE id_cliente = ${id} OR cedula = '${id}'`);
        console.table(result[0]);

        if(result.length == 0)
            return res.status(500).json({ error: "Client not found"});

        res.json(result[0]);
    } catch (error) {
        console.log(error)
        res.status(500).json({error: error.message});
    }
}

export const clients = async (req, res) => {
    try {
        const [result] = await pool.query('SELECT * FROM client');
        console.table(result);
        res.json(result);

    } catch (error) {
        console.log(error);
        res.status(500).json({error: error.message})
    }
}

export const createClient = async (req, res) => {
    try {
        const { nombre, apellido, cedula, fecha_nac, direccion } = req.body;
        const [result] = await pool.query('INSERT INTO client (nombre, apellido, cedula, fecha_nac, direccion) VALUES (?,?,?,?,?)', [ nombre, apellido, cedula, fecha_nac, direccion ])
        console.log(result);
        res.json({
            clienteId: result.insertId,
            cedula: cedula
        })

    } catch (error) {
        console.log(error);
        if(error.errno == 1062)
            return res.status(405).json({error: "Ya existe un cliente con la misma cédula"})

        res.status(500).json({error: error.message})
    }
}

export const updateClient = async (req, res) => {
    try {
        const id = req.params.id
        console.log('Estoy en el PUT')
        const result = await pool.query(`UPDATE client SET ? WHERE id_cliente = ${id} OR cedula = '${id}'`, [req.body])
        res.json(result)

    } catch (error) {
        console.log(error)
        res.status(500).json({error: error.message})
    }
}

export const deleteClient = async (req, res) => {
    try { 
        const id = req.params.id;
        const [result] = await pool.query(`DELETE FROM client WHERE id_cliente = ${id}`)
        console.log(result);
        res.json(result);
        
    } catch (error) {
        console.log(error.message)
        res.status(404).json({error: error.message});
    }
}