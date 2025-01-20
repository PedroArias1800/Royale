import Parfum from '../models/parfum.model.js'
import Body from '../models/body.model.js'
import Type from '../models/types.model.js'

export const getAllParfums = async(req, res) => {
    try{
        const parfums = await Parfum.find()
            .populate({
                path: 'version_id_fk',
                select: 'version_name',
            })
            .populate({
                path: 'brand_id_fk',
                select: 'brand_name',
            });
        res.json(parfums)
    } catch (error) {
        res.status(500).json({ message: "Parfums not Found" })
    }
}


export const getFilteredParfums = async (req, res) => {
    try {
        const { filter } = req.body; // Filtro ingresado por el usuario
        const page = parseInt(req.query.page) || 1;
        const limit = 15;

        const skip = (page - 1) * limit;

        let genderFilter = null;
        if ("damas".toLowerCase().includes(filter)) {
            genderFilter = 1;
        } else if ("caballeros".toLowerCase().includes(filter)) {
            genderFilter = 2;
        }
        
        let statusFilter = null
        if ("activado".toLowerCase().includes(filter)) {
            statusFilter = 1;
        } else if ("desactivado".toLowerCase().includes(filter)) {
            statusFilter = 0;
        }

        // Construcción de la consulta dinámica
        const query = filter
            ? {
                $or: [
                    { title: { $regex: filter, $options: "i" } },
                    { description: { $regex: filter, $options: "i" } },
                    ...(genderFilter !== null
                        ? [{ gender: genderFilter }]
                        : []),
                    ...(statusFilter !== null
                        ? [{ status: statusFilter }]
                        : []),
                    { "version_id_fk.title": { $regex: filter, $options: "i" } },
                    { "brand_id_fk.title": { $regex: filter, $options: "i" } },
                ],
              }
            : {};

        // Búsqueda con filtros y paginación
        const parfums = await Parfum.find(query)
            .populate({
                path: 'version_id_fk',
                select: 'version_name',
            })
            .populate({
                path: 'brand_id_fk',
                select: 'brand_name',
            })
            .skip(skip)
            .limit(limit);

        // Conteo total de registros que coinciden con el filtro
        const total = await Parfum.countDocuments(query);
        const totalPages = Math.ceil(total / limit);

        res.json({
            data: parfums,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalItems: total,
                itemsPerPage: limit,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al obtener los registros filtrados" });
    }
};


export const getParfums = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 15;

        const skip = (page - 1) * limit;

        const parfums = await Parfum.find()
            .populate({
                path: 'version_id_fk',
                select: 'version_name',
            })
            .populate({
                path: 'brand_id_fk',
                select: 'brand_name',
            })
            .skip(skip)
            .limit(limit);

        const total = await Parfum.countDocuments();
        const totalPages = Math.ceil(total / limit);

        res.json({
            data: parfums,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalItems: total,
                itemsPerPage: limit,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener los perfumes' });
    }
};

export const getParfum = async(req, res) => {
    try{
        const parfum = await Parfum.findById(req.params.id)
        if (!parfum) return res.status(404).json({ message: "Parfum not Found" })
    } catch (error) {
        res.status(500).json({ message: "Parfum not Found" })
    }
}

export const createParfum = async(req, res) => {
    try{
        const { title, description, gender, status, version_id_fk, brand_id_fk, } = req.body

        const newParfum = new Parfum({
            title,
            description,
            gender,
            status,
            version_id_fk,
            brand_id_fk,
        })

        const parfumSaved = await newParfum.save()
        res.json(parfumSaved);
    } catch (error) {
        res.status(500).json({ message: "Parfum not Found" })
    }
}

export const updateParfum = async(req, res) => {
    try{
        const parfum = await Parfum.findByIdAndUpdate(req.params.id, req.body, {
            new: true
        });
        if (!parfum) return res.status(404).json({ message: "Parfum not Found" })
        res.json(parfum)
    } catch (error) {
        res.status(500).json({ message: "Parfum not Found" })
    }
}

export const deleteParfum = async(req, res) => {
    try{
        const bodyCount = await Body.countDocuments({ parfum_id_fk: req.params.id });
        if (bodyCount > 0) {
            return res.status(202).json({ message: "Este Parfum está siendo usado en Fondos de Inicio, no se puede eliminar." });
        }

        const typeCount = await Type.countDocuments({ parfum_id_fk: req.params.id });
        if (typeCount > 0) {
            return res.status(202).json({ message: "Este Parfum está siendo usado en Tipos de Perfumes, no se puede eliminar." });
        }

        const parfum = await Parfum.findByIdAndDelete(req.params.id, {
            new: true
        });

        if (!parfum) return res.status(404).json({ message: "Parfum not Found" })
        res.json(parfum)
    } catch (error) {
        res.status(500).json({ message: "Parfum not Found" })
    }
}