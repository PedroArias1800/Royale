import Type from '../models/types.model.js'

export const getAllTypes = async(req, res) => {
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

export const getTypes = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 15;
        
        const skip = (page - 1) * limit;

        const types = await Type.find()
            .populate({
                path: 'parfum_id_fk',
                select: 'title',
            })
            .skip(skip)
            .limit(limit);

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
        console.error(error);
        res.status(500).json({ message: 'Error al obtener los tipos' });
    }
};


export const getType = async(req, res) => {
    const type = await Type.findById(req.params.id)
    if (!type) return res.status(404).json({ message: "Type not Found" })
}

export const createType = async(req, res) => {
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
}

export const updateType = async (req, res) => {
    const { ml, cost, price, old_price, status, imgServer, parfum_id_fk } = req.body;
    console.log(imgServer, 'prueba')
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

    console.log(req.params.id, updatedData);

    const type = await Type.findByIdAndUpdate(req.params.id, updatedData, {
        new: true,
        runValidators: true
    });

    if (!type) return res.status(404).json({ message: "Type not Found" });
    
    res.json(type);
}

export const deleteType = async(req, res) => {
    const type = await Type.findByIdAndDelete(req.params.id, req.body, {
        new: true
    });
    if (!type) return res.status(404).json({ message: "Type not Found" })
    res.json(type)
}