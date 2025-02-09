import XLSX from "xlsx";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import Transaction from '../models/transaction.model.js'
import Parfum from '../models/parfum.model.js'


export const getAllTransactions = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 15;

        const skip = (page - 1) * limit;

        const transactions = await Transaction.find()
            .populate({
                path: 'productsTypes',
                model: 'Types',
                select: 'ml -_id',
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const transformedTransactions = transactions.map(transaction => ({
            ...transaction.toObject(),
            productsTypes: transaction.productsTypes.map(productType => (`${productType.ml}`)),
        }));

        const total = await Transaction.countDocuments();
        const totalPages = Math.ceil(total / limit);

        res.json({
            data: transformedTransactions ,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalItems: total,
                itemsPerPage: limit,
            },
        });
    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: 'Error al obtener los tipos' });
    }
};


export const getFilteredTransactions = async (req, res) => {
    try {
        const { filter } = req.body;
        const page = parseInt(req.query.page) || 1;
        const limit = 15;
        const skip = (page - 1) * limit;

        let statusFilter = null;
        if ("activado".toLowerCase().includes(filter)) {
            statusFilter = 1;
        } else if ("desactivado".toLowerCase().includes(filter)) {
            statusFilter = 0;
        }

        const query = filter
            ? {
                $or: [
                    { userName: { $regex: filter, $options: "i" } },
                    { phone: { $regex: filter, $options: "i" } },
                    { direction: { $regex: filter, $options: "i" } },
                    { email: { $regex: filter, $options: "i" } },
                    ...(statusFilter !== null
                        ? [{ status: statusFilter }]
                        : []),
                ],
                }
            : {};

        // Buscar transacciones con los filtros aplicados
        const transactions = await Transaction.find(query)
            .populate({
                path: 'products',
                model: 'Parfum',
                populate: {
                    path: 'brand_id_fk',
                    model: 'Brand',
                    select: 'brand_name -_id',
                },
                select: 'title brand_id_fk _id',
            })
            .populate({
                path: 'productsTypes',
                model: 'Types',
                select: 'ml -_id',
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Extraer los datos de las transacciones
        console.log('Buscados:', transactions);

        const transformedTransactions = transactions.map(transaction => ({
            ...transaction.toObject(),
            products: transaction.products.map(product => (`${product._id}=${product.brand_id_fk?.brand_name} ${product.title}`)),
            productsTypes: transaction.productsTypes.map(productType => (`${productType.ml}`)),
        }));

        // Contar el total de transacciones
        const total = await Transaction.countDocuments(query);
        const totalPages = Math.ceil(total / limit);

        // Devolver la respuesta
        res.json({
            data: transformedTransactions,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalItems: total,
                itemsPerPage: limit,
            },
        });
    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: 'Error al obtener los tipos' });
    }
};


export const getExportTransactionsData = async (req, res) => {
    try {
        // 1️⃣ Obtener los datos de MongoDB
        const transactions = await Transaction.find()
        .lean()
        .populate({
            path: 'productsTypes',
            model: 'Types',
            select: 'ml',
        })
        .sort({ title: 1 });

        // 💡 Extraer los IDs de los productos y hacer populate manualmente
        for (let transaction of transactions) {
            if (transaction.products) {
                // Obtener solo los _id antes del "="
                const productIds = transaction.products.map(p => p.split('=')[0]);

                // Buscar en la colección de Parfum usando los _id extraídos
                const parfums = await Parfum.find({ _id: { $in: productIds } }).select('title');

                // Mapear los títulos de los productos en la transacción
                transaction.products = parfums.map(p => p.title);
            }
        }

        if (!transactions.length) {
            return res.status(404).json({ message: "No hay transacciones disponibles" });
        }

        console.log(transactions[0].productsTypes.map(item => item.ml).join(', '))

        // 2️⃣ Convertir los datos en un formato compatible con Excel
        const data = transactions.map((transaction) => ({
            Cliente: transaction.userName,
            Teléfono: transaction.phone,
            Dirección: transaction.direction,
            Correo: transaction.email,
            SubTotal: transaction.subTotal,
            Total: transaction.total,
            Estado: transaction.status ? "Atentido" : "Por Atender",
            Productos: transaction.products.join(', '),
            'Tipos de Productos': transaction.productsTypes.map(item => item.ml).join(', '),
            Cantidades: transaction.quantities.join(', '),
            'Creado el': transaction.createdAt,
            'Actualizado el': transaction.updatedAt
        }));

        // 3️⃣ Crear una hoja de Excel
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Transacciones");

        // 4️⃣ Guardar el archivo en el servidor (opcional)
        const filePath = path.join(__dirname, "../exports/Royale-Transacciones.xlsx");
        XLSX.writeFile(wb, filePath);

        // 5️⃣ Enviar el archivo como respuesta
        res.download(filePath, "Royale-Transacciones.xlsx", (err) => {
            if (err) {
                console.error("Error al enviar el archivo:", err);
                res.status(500).json({ message: "Error al generar el archivo" });
            }
            // Elimina el archivo después de enviarlo (opcional)
            fs.unlinkSync(filePath);
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Error al obtener los transacciones" });
    }
};