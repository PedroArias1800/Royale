import Transaction from '../models/transaction.model.js'


export const getAllTransactions = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 15;

        const skip = (page - 1) * limit;

        const transactions = await Transaction.find()
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

            console.log(transactions)

        const transformedTransactions = transactions.map(transaction => ({
            ...transaction.toObject(),
            products: transaction.products.map(product => (`${product._id}=${product.brand_id_fk?.brand_name} ${product.title}`)),
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
        console.error(error);
        res.status(500).json({ message: 'Error al obtener los tipos' });
    }
};