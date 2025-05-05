import XLSX from "xlsx";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import Transaction from '../models/transaction.model.js'
import Parfum from '../models/parfum.model.js'
import User from '../models/user.model.js'


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
            .populate({
                path: 'seller_id_fk',
                model: 'User',
                select: 'firstname lastname _id',
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const transformedTransactions = transactions.map(transaction => ({
            ...transaction.toObject(),
            seller: transaction.seller_id_fk?.lastname ? transaction.seller_id_fk?.firstname + ' ' + transaction.seller_id_fk?.lastname : 'Sitio Web',
            seller_id_fk: transaction.seller_id_fk?._id,
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
            .populate({
                path: 'seller',
                model: 'User',
                select: 'firstname lastname -_id',
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const transformedTransactions = transactions.map(transaction => ({
            ...transaction.toObject(),
            seller_id_fk: transaction.seller?.firstname + ' ' + transaction.seller?.lastname ?? 'Sitio Web',
            products: transaction.products.map(product => (`${product._id}=${product.brand_id_fk?.brand_name} ${product.title}`)),
            productsTypes: transaction.productsTypes.map(productType => (`${productType.ml}`)),
        }));

        console.log(transformedTransactions)

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


export const getTransactionsByUser = async (req, res) => {
    try {
        const userId = req.params.id;

        // Verificar si el usuario existe (opcional pero recomendado)
        const user = await User.findById(userId).select('firstname lastname');
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = 15;
        const skip = (page - 1) * limit;

        // Buscar transacciones donde seller_id_fk sea igual al id recibido
        const transactions = await Transaction.find({ seller_id_fk: userId })
            .populate({
                path: 'productsTypes',
                model: 'Types',
                select: 'ml -_id',
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Transformar las transacciones para mostrar el nombre completo del usuario
        const transformedTransactions = transactions.map(transaction => ({
            ...transaction.toObject(),
            seller: `${user.firstname} ${user.lastname}`,
            productsTypes: transaction.productsTypes.map(productType => `${productType.ml}`),
        }));

        const total = await Transaction.countDocuments({ seller_id_fk: userId });
        const totalPages = Math.ceil(total / limit);

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
        console.error(error.message);
        res.status(500).json({ message: 'Error al obtener las transacciones del usuario' });
    }
};


export const getCountTransactionsByUserThisMonth = async (req, res) => {
    try {
        const userId = req.params.id;

        // Verificar si el usuario existe
        const user = await User.findById(userId).select('firstname lastname');
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Obtener el primer y último día del mes actual
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        // Obtener las transacciones del usuario para este mes
        const transactions = await Transaction.find({
            seller_id_fk: userId,
            createdAt: { $gte: firstDayOfMonth, $lte: lastDayOfMonth }
        }).select('quantities');

        // Sumar todos los números dentro de todos los arrays de quantities
        const totalQuantities = transactions.reduce((sum, transaction) => {
            const quantitiesSum = transaction.quantities.reduce((a, b) => a + b, 0);
            return sum + quantitiesSum;
        }, 0);

        res.json({
            seller: `${user.firstname} ${user.lastname}`,
            totalQuantitiesThisMonth: totalQuantities
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Error al calcular la suma de quantities del usuario este mes' });
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