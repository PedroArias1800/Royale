import Brand from '../models/brand.model.js'

export const postBrand = async(req, res) => {
    const { brand_name } = req.body

    try {
        const newBrand = new Brand({
            brand_name
        });
    
        const brandSaved = await newBrand.save() 
        res.json(brandSaved)   
    } catch (error) {
        console.log(error)
    }

    res.send('Registrando')
}

