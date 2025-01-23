import mongoose from 'mongoose';
import Parfum from '../models/parfum.model.js'
import Body from '../models/body.model.js'
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
    try {
        const parfums = await Parfum.aggregate([
            {
                $match: {
                    status: 1 // Solo registros con status igual a 1
                }
            },
            {
                $lookup: {
                    from: "types", // Nombre de la colección de MongoDB
                    localField: "_id", // Campo de referencia en Parfum
                    foreignField: "parfum_id_fk", // Campo de referencia en Types
                    as: "types" // Nombre del array resultante
                }
            },
            {
                $match: {
                    "types.0": { $exists: true } // Filtrar solo registros donde 'types' contenga al menos un objeto
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
                $unwind: "$version" // Desanidar la versión (si solo quieres un objeto en lugar de un array)
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
                $unwind: "$brand" // Desanidar la marca
            }
        ]);

        res.json(parfums); // Responder con los datos combinados
    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: "Error al obtener los datos" });
    }
};


export const parfumsBody = async (req, res) => {
    try {
        const bodies = await Body.find({ status: 1 })
            .populate({
                path: 'parfum_id_fk',
                select: 'title',
            });

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
