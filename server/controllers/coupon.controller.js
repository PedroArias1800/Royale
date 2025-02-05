import Coupon from '../models/coupon.model.js'

export const getAllCoupons = async(req, res) => {
    try{
        const coupons = await Coupon.find()
        .sort({title: 1});

        res.json(coupons)
    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: "Coupon not Found" })
    }
}

export const getCoupons = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 15;

        const skip = (page - 1) * limit;

        const coupon = await Coupon.find()
            .skip(skip)
            .limit(limit)
            .sort({title: 1});

        const total = await Coupon.countDocuments();
        const totalPages = Math.ceil(total / limit);

        res.json({
            data: coupon,
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


export const getFilteredCoupons = async (req, res) => {
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

        const coupon = await Coupon.find(query)
            .skip(skip)
            .limit(limit)
            .sort({title: 1});

        const total = await Coupon.countDocuments();
        const totalPages = Math.ceil(total / limit);

        res.json({
            data: coupon,
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


export const getCoupon = async(req, res) => {
    try{
        const coupon = await Coupon.findById(req.params.id)
        if (!coupon) return res.status(404).json({ message: "Coupon not Found" })
    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: "Coupon not Found" })
    }
}

export const createCoupon = async(req, res) => {
    try{
        const { title, code, percentage, status } = req.body

        const newCoupon = new Coupon({
            title,
            code,
            percentage,
            status
        })

        const couponSaved = await newCoupon.save()
        res.json(couponSaved);
    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: "Coupon not Found" })
    }
}

export const updateCoupon = async(req, res) => {
    try{
        const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
            new: true
        });
        if (!coupon) return res.status(404).json({ message: "Coupon not Found" })
        res.json(coupon)
    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: "Coupon not Found" })
    }
}

export const deleteCoupon = async(req, res) => {
    try{
        const coupon = await Coupon.findByIdAndDelete(req.params.id, {
            new: true
        });
        if (!coupon) return res.status(404).json({ message: "Coupon not Found" })
            res.json(coupon)
    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: "Coupon not Found" })
    }
}