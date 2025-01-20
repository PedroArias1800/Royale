import Brand from '../models/brand.model.js'
import Parfum from '../models/parfum.model.js'

export const getAllBrands = async(req, res) => {
    try{
        const brands = await Brand.find()
        .sort({ brand_name: 1 })

        res.json(brands)
    } catch (error) {
        res.status(500).json({ message: "Brand not Found" })
    }
}

export const getBrands = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 15;

        const skip = (page - 1) * limit;

        const brand = await Brand.find()
            .sort({ title: 1 })
            .skip(skip)
            .limit(limit);

        const total = await Brand.countDocuments();
        const totalPages = Math.ceil(total / limit);

        res.json({
            data: brand,
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


export const getFilteredBrands = async (req, res) => {
    try {
        const { filter } = req.body;
        const page = parseInt(req.query.page) || 1;
        const limit = 15;

        const skip = (page - 1) * limit;

        const query = filter
            ? {
                  $or: [
                      { brand_name: { $regex: filter, $options: "i" } }
                  ],
              }
            : {};

        const brand = await Brand.find(query)
            .skip(skip)
            .limit(limit);

        const total = await Brand.countDocuments();
        const totalPages = Math.ceil(total / limit);

        res.json({
            data: brand,
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


export const getBrand = async(req, res) => {
    try{
        const brand = await Brand.findById(req.params.id)
        if (!brand) return res.status(404).json({ message: "Brand not Found" })
    } catch (error) {
        res.status(500).json({ message: "Brand not Found" })
    }
}

export const createBrand = async(req, res) => {
    try{
        const { brand_name } = req.body

        const newBrand = new Brand({
            brand_name
        })

        const brandSaved = await newBrand.save()
        res.json(brandSaved);
    } catch (error) {
        res.status(500).json({ message: "Brand not Found" })
    }
}

export const updateBrand = async(req, res) => {
    try{
        const brand = await Brand.findByIdAndUpdate(req.params.id, req.body, {
            new: true
        });
        if (!brand) return res.status(404).json({ message: "Brand not Found" })
        res.json(brand)
    } catch (error) {
        res.status(500).json({ message: "Brand not Found" })
    }
}

export const deleteBrand = async(req, res) => {
    try{

        const parfumCount = await Parfum.countDocuments({ brand_id_fk: req.params.id });
        if (parfumCount > 0) {
            return res.status(202).json({ message: "Esta Marca está siendo usado en Perfumes, no se puede eliminar." });
        }
        
        const brand = await Brand.findByIdAndDelete(req.params.id, {
            new: true
        });
        if (!brand) return res.status(404).json({ message: "Brand not Found" })
            res.json(brand)
    } catch (error) {
        res.status(500).json({ message: "Brand not Found" })
    }
}