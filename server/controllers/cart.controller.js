import Parfum from '../models/parfum.model.js';
import Types from '../models/types.model.js';

export const postCart = async (req, res) => {
    try {
        const cartItems = req.body;

        // Extrae los IDs de Parfum y Types del cuerpo de la solicitud.
        const parfumIds = cartItems.map(item => item.id);
        const typesIds = cartItems.map(item => item.types_id);

        // Busca los parfums que coincidan con los IDs proporcionados.
        const parfums = await Parfum.find({ _id: { $in: parfumIds } })
            .populate({
                path: 'brand_id_fk',
                select: 'brand_name',
            })
            .populate({
                path: 'version_id_fk',
                select: 'version_name',
            });

        // Busca los types que coincidan con los IDs proporcionados.
        const types = await Types.find({
            _id: { $in: typesIds },
            parfum_id_fk: { $in: parfumIds },
        });

        // Combina cada type con su parfum correspondiente.
        const result = types.map(type => {
            const parfum = parfums.find(p => p._id.toString() === type.parfum_id_fk.toString());
            return {
                parfum,
                type,
            };
        });

        res.json(result);
    } catch (error) {
        console.log(error.message)
        res.status(500).send("Error al obtener los datos");
    }
};
