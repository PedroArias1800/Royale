import Version from '../models/version.model.js'

export const getVersions = async(req, res) => {
    const versions = await Version.find()
    res.json(versions)
}

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