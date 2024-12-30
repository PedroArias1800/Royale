import mongoose from 'mongoose';
import Parfum from '../models/parfum.model.js'
import Body from '../models/body.model.js'


export const parfumVersion = async (req, res) => {
    const id = req.query.id;
    try {
        const parfums = await Parfum.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(id) // Filtrar únicamente los Parfum donde status es igual a 1
                }
            },
            {
                $lookup: {
                    from: "types", // Nombre de la colección de MongoDB (debe estar en minúscula/pluralizada por defecto)
                    localField: "_id", // Campo de referencia en Parfum
                    foreignField: "parfum_id_fk", // Campo de referencia en Types
                    as: "types" // Nombre del array resultante que contendrá los datos de Types
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
        console.error(error);
        res.status(500).json({ message: "Error al obtener los datos" });
    }
};


export const allParfums = async (req, res) => {
    try {
        const parfums = await Parfum.aggregate([
            {
                $match: {
                    status: 1
                }
            },
            {
                $lookup: {
                    from: "types", // Nombre de la colección de MongoDB (debe estar en minúscula/pluralizada por defecto)
                    localField: "_id", // Campo de referencia en Parfum
                    foreignField: "parfum_id_fk", // Campo de referencia en Types
                    as: "types" // Nombre del array resultante que contendrá los datos de Types
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

        res.json(parfums); // Responder con los datos combinados
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al obtener los datos" });
    }
};


export const parfumsBody = async (req, res) => {
    const versions = await Body.find()
    res.json(versions)
};
