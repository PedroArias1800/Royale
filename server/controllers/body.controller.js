import Body from '../models/body.model.js'

export const getAllBodies = async(req, res) => {
    try{
        const bodies = await Body.find()
        .populate({
            path: 'parfum_id_fk',
            select: 'title',
        });

        res.json(bodies)
    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: "Brand not Found" })
    }
}

export const getBodies = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 15;

        const skip = (page - 1) * limit;

        const body = await Body.find()
            .populate({
                path: 'parfum_id_fk',
                select: 'title',
            })
            .skip(skip)
            .limit(limit);

        const total = await Body.countDocuments();
        const totalPages = Math.ceil(total / limit);

        res.json({
            data: body,
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


export const getFilteredBodies = async (req, res) => {
    try {
        const { filter } = req.body; // Filtro ingresado por el usuario
        const page = parseInt(req.query.page) || 1;
        const limit = 15;

        const skip = (page - 1) * limit;

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
                      { align: { $regex: filter, $options: "i" } },
                      { parfum_img: { $regex: filter, $options: "i" } },
                      { back_img: { $regex: filter, $options: "i" } },
                      { color: { $regex: filter, $options: "i" } },
                      { color2: { $regex: filter, $options: "i" } },
                      ...(statusFilter !== null
                        ? [{ status: statusFilter }]
                        : []),
                      { "parfum_id_fk.title": { $regex: filter, $options: "i" } }, // Filtro en el título de Parfum
                  ],
              }
            : {};

        // Búsqueda con filtros y paginación
        const bodies = await Body.find(query)
            .populate({
                path: "parfum_id_fk",
                select: "title",
            })
            .skip(skip)
            .limit(limit);

        // Conteo total de registros que coinciden con el filtro
        const total = await Body.countDocuments(query);
        const totalPages = Math.ceil(total / limit);

        res.json({
            data: bodies,
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


export const getBody = async(req, res) => {
    try{
        const body = await Body.findById(req.params.id).sort({ updatedAt: -1 })
        if (!body) return res.status(404).json({ message: "Body not Found" })
    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: "Brand not Found" })
    }
}

export const createBody = async(req, res) => {
    try{
        const { title, align, url, color, color2, status, parfum_id_fk } = req.body
        const img1Path = req.files?.img1 ? `/uploads/body/${req.files.img1[0].filename}` : null;
        const img2Path = req.files?.img2 ? `/uploads/body/${req.files.img2[0].filename}` : null;

        const newBody = new Body({
            title,
            align,
            parfum_img: img1Path,
            back_img: img2Path,
            url,
            color,
            color2,
            status,
            parfum_id_fk,
        })

        const bodySaved = await newBody.save()
        res.json(bodySaved);
    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: "Brand not Found" })
    }
}

export const updateBody = async(req, res) => {
    try{
        const { title, align, url, color, color2, status, parfum_id_fk } = req.body
        const img1Path = req.files?.img1 ? `/uploads/body/${req.files.img1[0].filename}` : null;
        const img2Path = req.files?.img2 ? `/uploads/body/${req.files.img2[0].filename}` : null;
    
        const updatedData = { title, align, url, color, color2, status, parfum_id_fk };
        if (img1Path) updatedData.parfum_img = img1Path;
        if (img2Path) updatedData.back_img = img2Path;

        const body = await Body.findByIdAndUpdate(req.params.id, updatedData, {
            new: true
        });
        if (!body) return res.status(404).json({ message: "Body not Found" })
        res.json(body)
    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: "Body not Found" })
    }
}

export const deleteBody = async(req, res) => {
    try{
        const body = await Body.findByIdAndDelete(req.params.id, req.body, {
            new: true
        });
        if (!body) return res.status(404).json({ message: "Body not Found" })
        res.json(body)
    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: "Body not Found" })
    }
}