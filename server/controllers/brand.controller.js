import Brand from '../models/brand.model.js'

export const getBrands = async(req, res) => {
    const brands = await Brand.find()
    res.json(brands)
}

export const getBrand = async(req, res) => {
    const brand = await Brand.findById(req.params.id)
    if (!brand) return res.status(404).json({ message: "Brand not Found" })
}

export const createBrand = async(req, res) => {
    const { brand_name } = req.body

    const newBrand = new Brand({
        brand_name
    })

    const brandSaved = await newBrand.save()
    res.json(brandSaved);
}

export const updateBrand = async(req, res) => {
    const brand = await Brand.findByIdAndUpdate(req.params.id, req.body, {
        nre: true
    });
    if (!brand) return res.status(404).json({ message: "Brand not Found" })
}