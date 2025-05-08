import mongoose from 'mongoose';
import Parfum from '../models/parfum.model.js'
import Body from '../models/body.model.js'
import Coupon from '../models/coupon.model.js'
import Transaction from '../models/transaction.model.js'


export const parfumVersion = async (req, res) => {
    try {
        const id = req.query.id;
        const parfums = await Parfum.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(id)
                }
            },
            {
                $lookup: {
                    from: "types",
                    localField: "_id",
                    foreignField: "parfum_id_fk",
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$status", 1] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "types"
                }
            },
            {
                $lookup: {
                    from: "versions",
                    localField: "version_id_fk",
                    foreignField: "_id",
                    as: "version"
                }
            },
            {
                $lookup: {
                    from: "brands",
                    localField: "brand_id_fk",
                    foreignField: "_id",
                    as: "brand"
                }
            },
            {
                $unwind: "$version" // Desanidar la versión (si solo quieres un objeto en lugar de un array)
            },
            {
                $unwind: "$brand" // Desanidar la marca
            }
        ]);

        res.json(parfums[0]); // Responder con los datos combinados
    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: "Error al obtener los datos" });
    }
};


export const allParfums = async (req, res) => {
    const typeOfSale = req.query.type;
    try {
        const parfums = await Parfum.aggregate([
            {
                // Filtrar los Parfum con status 1
                $match: {
                    status: 1
                }
            },
            {
                // Realizar el lookup con la colección Types
                $lookup: {
                    from: "types",
                    let: { parfumId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$parfum_id_fk", "$$parfumId"] }, // Relación entre Parfum y Types
                                        { $eq: ["$status", 1] }, // Filtrar Types con status 1
                                        {
                                            $or: [
                                                { $eq: ["$type_of_sale", typeOfSale] }, // Coincide con typeOfSale
                                                { 
                                                    $and: [
                                                        { $eq: [typeOfSale, "Normal"] }, // Si typeOfSale es "Normal"
                                                        { $not: [{ $ifNull: ["$type_of_sale", false] }] } // Si type_of_sale no existe
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "types"
                }
            },
            {
                // Filtrar únicamente Parfum donde existan Types asociados con status 1
                $match: {
                    "types.0": { $exists: true } // Asegurarse de que la lista no esté vacía
                }
            },
            {
                // Realizar el lookup con la colección Versions
                $lookup: {
                    from: "versions",
                    localField: "version_id_fk",
                    foreignField: "_id",
                    as: "version"
                }
            },
            {
                // Desanidar la versión (si solo quieres un objeto en lugar de un array)
                $unwind: "$version"
            },
            {
                // Realizar el lookup con la colección Brands
                $lookup: {
                    from: "brands",
                    localField: "brand_id_fk",
                    foreignField: "_id",
                    as: "brand"
                }
            },
            {
                // Desanidar la marca
                $unwind: "$brand"
            }
        ]);

        res.json(parfums); // Responder con los datos combinados
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Error al obtener los datos" });
    }
};


export const parfumsBody = async (req, res) => {
    try {
        const bodies = await Body.find({ status: 1 })
            .populate({
                path: 'parfum_id_fk',
                select: 'title',
            })
            .sort({ updatedAt: -1 });

        res.json(bodies);
    } catch (error) {
        console.log(error.message)
        res.status(500).send("Error al obtener los bodies");
    }
};


export const getTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.aggregate([
            {
                $match: {
                    status: false
                }
            }
        ])

        res.json(transaction);
    } catch (error) {
        console.log(error.message)
        res.status(500).send("Error al obtener las transacciones");
    }
}


export const createTransaction = async (req, res) => {
    try {
        const { userName, phone, direction, email, subTotal, total, products, productsTypes, quantities } = req.body
    
        const newTransaction = new Transaction({
            userName,
            phone,
            direction,
            email,
            subTotal,
            total,
            products,
            productsTypes,
            quantities,
        })
    
        const transactionSaved = await newTransaction.save()
        res.json(transactionSaved);
    } catch (error) {
        console.log(error.message)
        res.status(500).send("Error al guardar la transacción");
    }
};


export const updateTransaction = async (req, res) => {
    try {
        // Buscar la transacción por ID
        const transaction = await Transaction.findById(req.params.id);
        
        // Validar si la transacción existe
        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        // Actualizar solo el campo `status` a true
        transaction.status = true;

        // Guardar los cambios en la base de datos
        const transactionUpdated = await transaction.save();

        const transactionReload = await Transaction.aggregate([
            {
                $match: {
                    status: false
                }
            }
        ])
        
        res.json(transactionReload);
    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: "Error updating transaction status" });
    }
};


export const getCupon = async(req, res) => {
    try {
        const code = req.query.id
        const cupon = await Coupon.findOne({ code })
        if (cupon){
            if (cupon.status == 0) return res.status(200).json({
                _id: '',
                valido: false,
                texto: `Este cupón no está disponible`,
                percentage: 0,
            })
            return res.status(200).json({
                _id: cupon._id,
                valido: true,
                texto: `${cupon.percentage}% de descuento por ${cupon.title}`,
                percentage: cupon.percentage,
                code: cupon.code
            })
        }
        else {
            return res.status(404).json({
                _id: '',
                valido: false,
                texto: "Cupón no Válido"
            })
        }
    } catch (error) {
        console.log(error.message)
        res.status(500).json({
            _id: '',
            valido: false,
            texto: "Cupón no Válido"
        })
    }
}


export const getParfumsTypesOfSales = async (req, res) => {
    try {
        const parfums = await Parfum.aggregate([
            {
                // Filtrar los Parfum con status 1
                $match: {
                    status: 1
                }
            },
            {
                // Realizar el lookup con la colección Types
                $lookup: {
                    from: "types",
                    let: { parfumId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$parfum_id_fk", "$$parfumId"] }, // Relación entre Parfum y Types
                                        { $eq: ["$status", 1] } // Filtrar Types con status 1
                                    ]
                                }
                            }
                        }
                    ],
                    as: "types"
                }
            },
            {
                // Filtrar únicamente Parfum donde existan Types asociados con status 1
                $match: {
                    "types.0": { $exists: true } // Asegurarse de que la lista no esté vacía
                }
            },
            {
                // Realizar el lookup con la colección Versions
                $lookup: {
                    from: "versions",
                    localField: "version_id_fk",
                    foreignField: "_id",
                    as: "version"
                }
            },
            {
                // Desanidar la versión (si solo quieres un objeto en lugar de un array)
                $unwind: "$version"
            },
            {
                // Realizar el lookup con la colección Brands
                $lookup: {
                    from: "brands",
                    localField: "brand_id_fk",
                    foreignField: "_id",
                    as: "brand"
                }
            },
            {
                // Desanidar la marca
                $unwind: "$brand"
            }
        ]);

        res.json(parfums); // Responder con los datos combinados
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Error al obtener los datos" });
    }
};