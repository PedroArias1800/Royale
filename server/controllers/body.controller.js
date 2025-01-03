import Body from '../models/body.model.js'

export const getBodies = async(req, res) => {
    const bodies = await Body.find()
    .populate({
        path: 'parfum_id_fk',
        select: 'title',
    });

    res.json(bodies)
}

export const getBody = async(req, res) => {
    const body = await Body.findById(req.params.id)
    if (!body) return res.status(404).json({ message: "Body not Found" })
}

export const createBody = async(req, res) => {
    const { title, align, url, color, color2, status, parfum_id_fk } = req.body
    const img1Path = req.files?.img1 ? `/uploads/${req.files.img1[0].filename}` : null;
    const img2Path = req.files?.img2 ? `/uploads/${req.files.img2[0].filename}` : null;

    console.log(img1Path, img2Path);

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
}

export const updateBody = async(req, res) => {
    const { title, align, url, color, color2, status, parfum_id_fk } = req.body
    const img1Path = req.files?.img1 ? `/uploads/${req.files.img1[0].filename}` : null;
    const img2Path = req.files?.img2 ? `/uploads/${req.files.img2[0].filename}` : null;
    
    console.log(img1Path, img2Path);

    const updatedData = { title, align, url, color, color2, status, parfum_id_fk };
    if (img1Path) updatedData.parfum_img = img1Path;
    if (img2Path) updatedData.back_img = img2Path;

    const body = await Body.findByIdAndUpdate(req.params.id, updatedData, {
        new: true
    });
    if (!body) return res.status(404).json({ message: "Body not Found" })
    res.json(body)
}