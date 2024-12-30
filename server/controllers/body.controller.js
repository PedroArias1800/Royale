import Body from '../models/body.model.js'

export const getBodys = async(req, res) => {
    const bodys = await Body.find()
    res.json(bodys)
}

export const getBody = async(req, res) => {
    const body = await Body.findById(req.params.id)
    if (!body) return res.status(404).json({ message: "Body not Found" })
}

export const createBody = async(req, res) => {
    const { title, align, parfum_img, back_img, url, color, color2, status, parfum_id_fk } = req.body

    const newBody = new Body({
        title,
        align,
        parfum_img,
        back_img,
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
    const body = await Body.findByIdAndUpdate(req.params.id, req.body, {
        new: true
    });
    if (!body) return res.status(404).json({ message: "Body not Found" })
    res.json(body)
}