import Type from '../models/types.model.js'

export const getAllTypes = async(req, res) => {
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
        console.log(error.message)
        res.status(500).json({ message: "Types not Found" })
    }
}

export const getTypes = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 15;
        
        const skip = (page - 1) * limit;

        const types = await Type.aggregate([
            {
                $lookup: {
                    from: 'parfums', // Nombre de la colección relacionada
                    localField: 'parfum_id_fk', // Campo en `Type` que se relaciona con `_id` en `Parfum`
                    foreignField: '_id', // Campo en `Parfum` que coincide con `localField`
                    as: 'parfum', // Nombre del campo que contendrá los datos relacionados
                },
            },
            {
                $unwind: '$parfum', // Desempaqueta el array `parfum` para que sea un documento individual
            },
            {
                $sort: { 'parfum.title': 1 }, // Ordenar por el campo `title` de la colección `Parfum`
            },
            {
                $skip: skip, // Paginación: número de documentos a saltar
            },
            {
                $limit: limit, // Paginación: número máximo de documentos a devolver
            },
            {
                $project: {
                    _id: 1, // Incluye el ID del documento principal
                    name: 1, // Incluye otros campos necesarios de la colección principal (`Type`)
                    'parfum.title': 1, // Incluye el campo `title` de la colección relacionada
                },
            },
        ]);
        

        const total = await Type.countDocuments();
        const totalPages = Math.ceil(total / limit);

        res.json({
            data: types,
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


export const getFilteredTypes = async (req, res) => {
    try {
        const { filter } = req.body; // Filtro ingresado por el usuario
        const page = parseInt(req.query.page) || 1;
        const limit = 15;

        const skip = (page - 1) * limit;

        let costFilter = null
        if ("activado".toLowerCase().includes(filter)) {
            costFilter = 1;
        } else if ("desactivado".toLowerCase().includes(filter)) {
            costFilter = 0;
        }

        // Construcción de la consulta dinámica
        const query = filter
            ? {
                $or: [
                    { ml: { $regex: filter, $options: "i" } },
                    { description: { $regex: filter, $options: "i" } },
                    ...(costFilter !== null
                        ? [{ cost: costFilter }]
                        : []),
                    { "parfum_id_fk.title": { $regex: filter, $options: "i" } },
                ],
              }
            : {};

        // Búsqueda con filtros y paginación
        const parfums = await Type.find(query)
            .populate({
                path: 'parfum_id_fk',
                select: 'title',
            })
            .skip(skip)
            .limit(limit);

        // Ordenar manualmente después del populate
        types.sort((a, b) => {
            const titleA = a.parfum_id_fk?.title?.toLowerCase() || '';
            const titleB = b.parfum_id_fk?.title?.toLowerCase() || '';
            return titleA.localeCompare(titleB);
        });

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
        console.log(error.message)
        res.status(500).json({ message: "Error al obtener los registros filtrados" });
    }
};


export const getType = async(req, res) => {
    try{
        const type = await Type.findById(req.params.id)
        if (!type) return res.status(404).json({ message: "Type not Found" })
    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: "Type not Found" })
    }
}

export const createType = async(req, res) => {
    try{
        const { ml, cost, price, old_price, status, imgServer, parfum_id_fk } = req.body
        const imgPath = req.files?.img ? `/uploads/parfumIcon/${req.files.img[0].filename}` : imgServer !== undefined ? `/uploads/parfumIcon/${imgServer}` : null;

        const newType = new Type({
            ml,
            img: imgPath,
            cost,
            price,
            old_price,
            status,
            parfum_id_fk
        })

        const typeSaved = await newType.save()
        res.json(typeSaved);
    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: "Type not Found" })
    }
}

export const updateType = async (req, res) => {
    try{
        const { ml, cost, price, old_price, status, imgServer, parfum_id_fk } = req.body;
        const imgPath = req.files?.img ? `/uploads/parfumIcon/${req.files.img[0].filename}` : imgServer !== undefined ? `/uploads/parfumIcon/${imgServer}` : null;

        const updatedData = {
            ml,
            cost,
            price,
            old_price,
            status,
            parfum_id_fk
        };

        if (imgPath) updatedData.img = imgPath;

        const type = await Type.findByIdAndUpdate(req.params.id, updatedData, {
            new: true,
            runValidators: true
        });

        if (!type) return res.status(404).json({ message: "Type not Found" });
        
        res.json(type);
    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: "Type not Found" })
    }
}

export const deleteType = async(req, res) => {
    try{
        const type = await Type.findByIdAndDelete(req.params.id, req.body, {
            new: true
        });
        if (!type) return res.status(404).json({ message: "Type not Found" })
        res.json(type)
    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: "Type not Found" })
    }
}