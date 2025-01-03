import Type from '../models/types.model.js'

export const getTypes = async(req, res) => {
    const types = await Type.find()
    .populate({
        path: 'parfum_id_fk',
        select: 'title',
    });

    res.json(types)
}

export const getType = async(req, res) => {
    const type = await Type.findById(req.params.id)
    if (!type) return res.status(404).json({ message: "Type not Found" })
}

export const createType = async(req, res) => {
    const { ml, price, old_price, status, parfum_id_fk } = req.body
    const imgPath = req.file ? `/uploads/${req.file.filename}` : null;

    const newType = new Type({
        ml,
        img: imgPath,
        price,
        old_price,
        status,
        parfum_id_fk
    })

    const typeSaved = await newType.save()
    res.json(typeSaved);
}

export const updateType = async (req, res) => {
    const { ml, price, old_price, status, parfum_id_fk } = req.body;
    const imgPath = req.file ? `/uploads/${req.file.filename}` : null;

    const updatedData = {
        ml,
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
