import Parfum from '../models/parfum.model.js'

export const getAllParfums = async(req, res) => {
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
}

export const getParfums = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 4;

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
    const parfum = await Parfum.findById(req.params.id)
    if (!parfum) return res.status(404).json({ message: "Parfum not Found" })
}

export const createParfum = async(req, res) => {
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
}

export const updateParfum = async(req, res) => {
    const parfum = await Parfum.findByIdAndUpdate(req.params.id, req.body, {
        new: true
    });
    if (!parfum) return res.status(404).json({ message: "Parfum not Found" })
    res.json(parfum)
}

export const deleteParfum = async(req, res) => {
    const parfum = await Parfum.findByIdAndDelete(req.params.id, {
        new: true
    });
    if (!parfum) return res.status(404).json({ message: "Parfum not Found" })
    res.json(parfum)
}