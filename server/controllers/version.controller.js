import Version from '../models/version.model.js'
import Parfum from '../models/parfum.model.js'

export const getAllVersions = async(req, res) => {
    const versions = await Version.find()
    res.json(versions)
}

export const getVersions = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 15;

        const skip = (page - 1) * limit;

        const version = await Version.find()
            .skip(skip)
            .limit(limit);

        const total = await Version.countDocuments();
        const totalPages = Math.ceil(total / limit);

        res.json({
            data: version,
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

export const getVersion = async(req, res) => {
    const version = await Version.findById(req.params.id)
    if (!version) return res.status(404).json({ message: "Version not Found" })
}

export const createVersion = async(req, res) => {
    const { version_name, description } = req.body

    const newVersion = new Version({
        version_name,
        description,
    })

    const versionSaved = await newVersion.save()
    res.json(versionSaved);
}

export const updateVersion = async(req, res) => {
    const version = await Version.findByIdAndUpdate(req.params.id, req.body, {
        new: true
    });
    if (!version) return res.status(404).json({ message: "Version not Found" })
    res.json(version)
}

export const deleteVersion = async(req, res) => {
    const parfumCount = await Parfum.countDocuments({ version_id_fk: req.params.id });
    if (parfumCount > 0) {
        return res.status(202).json({ message: "Esta Versión está siendo usado en Perfumes, no se puede eliminar." });
    }

    const version = await Version.findByIdAndDelete(req.params.id, {
        new: true
    });
    if (!version) return res.status(404).json({ message: "Version not Found" })
    res.json(version)
}