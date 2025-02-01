import Promotion from '../models/promotion.model.js'


export const getAllPromotions = async (req, res) => {
    try {
        const promotion = await Promotion.find()
            .sort({title: 1});

        res.json(promotion);
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Error al obtener las promociones" });
    }
};


export const getActivePromotions = async (req, res) => {
    try {
        const promotion = await Promotion.find({ status: 1 })
            .sort({title: 1});

        res.json(promotion);
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Error al obtener las promociones" });
    }
};


export const getPromotions = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 15;

        const skip = (page - 1) * limit;

        const promotion = await Promotion.find()
            .skip(skip)
            .limit(limit)
            .sort({title: 1});

        const total = await Promotion.countDocuments();
        const totalPages = Math.ceil(total / limit);

        res.json({
            data: promotion,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalItems: total,
                itemsPerPage: limit,
            },
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Error al obtener las promociones" });
    }
};


export const getFilteredPromotions = async (req, res) => {
    try {
        const { filter } = req.body;
        const page = parseInt(req.query.page) || 1;
        const limit = 15;

        const skip = (page - 1) * limit;

        const query = filter
            ? {
                  $or: [
                      { title: { $regex: filter, $options: "i" } }
                  ],
              }
            : {};

        const promotion = await Promotion.find(query)
            .skip(skip)
            .limit(limit)
            .sort({title: 1});

        const total = await Promotion.countDocuments();
        const totalPages = Math.ceil(total / limit);

        res.json({
            data: promotion,
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


export const getPromotion = async(req, res) => {
    try{
        const promotion = await Promotion.findById(req.params.id)
        if (!promotion) return res.status(404).json({ message: "Promotion not Found" })
    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: "Promotion not Found" })
    }
}


export const createPromotion = async(req, res) => {
    try{
        const { title, status, mediaServer } = req.body
        const mediaPath = req.files?.media ? `/uploads/promotion/${req.files.media[0].filename}` : mediaServer !== undefined ? `/uploads/promotion/${mediaServer}` : null;

        const newPromotion = new Promotion({
            title,
            media: mediaPath,
            status
        })

        const promotionSaved = await newPromotion.save()
        res.json(promotionSaved);
    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: "Promotion not Found" })
    }
}


export const updatePromotion = async (req, res) => {
    try{
        const { title, status, mediaServer } = req.body;
        const mediaPath = req.files?.media ? `/uploads/promotion/${req.files.media[0].filename}` : mediaServer !== undefined ? `/uploads/promotion/${mediaServer}` : null;

        const updatedData = {
            title,
            status
        };

        if (mediaPath) updatedData.media = mediaPath;

        const promotion = await Promotion.findByIdAndUpdate(req.params.id, updatedData, {
            new: true,
            runValidators: true
        });

        if (!promotion) return res.status(404).json({ message: "Promotion not Found" });
        
        res.json(promotion);
    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: "Promotion not Found" })
    }
}


export const deletePromotion = async(req, res) => {
    try{
        const promotion = await Promotion.findByIdAndDelete(req.params.id, req.body, {
            new: true
        });
        if (!promotion) return res.status(404).json({ message: "Promotion not Found" })
        res.json(promotion)
    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: "Promotion not Found" })
    }
}