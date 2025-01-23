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
