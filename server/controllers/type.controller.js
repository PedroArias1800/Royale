import XLSX from "xlsx";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import Type from '../models/types.model.js'

export const getAllTypes = async(req, res) => {
    try{
        const parfums = await Parfum.find()
            .populate({
                path: 'version_id_fk',
                select: 'version_name',
            })
            .populate({
                path: 'brand_id_fk',
                select: 'brand_name',
            });
        res.json(parfums)
    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: "Types not Found" })
    }
}

export const getTypes = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 15;
        
        const skip = (page - 1) * limit;

        const types = await Type.aggregate([
            {
                $lookup: {
                    from: 'parfums', // Nombre de la colección relacionada
                    localField: 'parfum_id_fk', // Campo en `Type` que se relaciona con `_id` en `Parfum`
                    foreignField: '_id', // Campo en `Parfum` que coincide con `localField`
                    as: 'parfum_data', // Nombre temporal del campo que contendrá los datos relacionados
                },
            },
            {
                $unwind: '$parfum_data', // Desempaqueta el array `parfum_data`
            },
            {
                $sort: { 'parfum_data.title': 1 }, // Ordena por el campo `title` de la colección `Parfum`
            },
            {
                $skip: skip, // Paginación: número de documentos a omitir
            },
            {
                $limit: limit, // Paginación: número máximo de documentos a devolver
            },
            {
                $addFields: {
                    parfum_id_fk: '$parfum_data', // Mueve el contenido de `parfum_data` a `parfum_id_fk`
                },
            },
            {
                $project: {
                    parfum_data: 0, // Elimina el campo temporal `parfum_data`
                },
            },
        ]);

        // Agregar los campos en JavaScript
        const typesWithProfit = types.map(type => {
            const cost = type.cost || 0;
        
            const price = typeof type.price === 'number' && type.price > 0 ? type.price : null;
            const priceFlash = typeof type.price_flash === 'number' && type.price_flash > 0 ? type.price_flash : null;
        
            const seller_profit = price !== null ? ((price - cost) * .5).toFixed(2) : null;
            let flash_seller_profit = priceFlash !== null ? ((priceFlash - cost) * .5).toFixed(2) : null;

            if (flash_seller_profit == null || seller_profit == flash_seller_profit){
                flash_seller_profit = seller_profit
            }

            return {
                ...type,
                seller_profit,
                flash_seller_profit,
            };
        });

        const total = await Type.countDocuments();
        const totalPages = Math.ceil(total / limit);

        res.json({
            data: typesWithProfit,
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


export const getFilteredTypes = async (req, res) => {
    try {
        const { filter } = req.body; // Filtro ingresado por el usuario
        const page = parseInt(req.query.page) || 1;
        const limit = 15;

        const skip = (page - 1) * limit;

        let costFilter = null
        if ("activado".toLowerCase().includes(filter)) {
            costFilter = 1;
        } else if ("desactivado".toLowerCase().includes(filter)) {
            costFilter = 0;
        }

        // Construcción de la consulta dinámica
        const query = filter
            ? {
                $or: [
                    { ml: { $regex: filter, $options: "i" } },
                    { description: { $regex: filter, $options: "i" } },
                    ...(costFilter !== null
                        ? [{ cost: costFilter }]
                        : []),
                    { "parfum_id_fk.title": { $regex: filter, $options: "i" } },
                ],
              }
            : {};

        // Búsqueda con filtros y paginación
        const parfums = await Type.find(query)
            .populate({
                path: 'parfum_id_fk',
                select: 'title',
            })
            .skip(skip)
            .limit(limit);

        // Ordenar manualmente después del populate
        types.sort((a, b) => {
            const titleA = a.parfum_id_fk?.title?.toLowerCase() || '';
            const titleB = b.parfum_id_fk?.title?.toLowerCase() || '';
            return titleA.localeCompare(titleB);
        });

        // Conteo total de registros que coinciden con el filtro
        const total = await Parfum.countDocuments(query);
        const totalPages = Math.ceil(total / limit);

        res.json({
            data: parfums,
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


export const getType = async(req, res) => {
    try{
        const type = await Type.findById(req.params.id)
        if (!type) return res.status(404).json({ message: "Type not Found" })
    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: "Type not Found" })
    }
}

export const createType = async(req, res) => {
    try{
        const { ml, cost, price, old_price, status, type_of_sale, price_flash, quantity_flash, imgServer, parfum_id_fk } = req.body
        const imgPath = req.files?.img ? `/uploads/parfumIcon/${req.files.img[0].filename}` : imgServer !== undefined ? `/uploads/parfumIcon/${imgServer}` : null;

        const newType = new Type({
            ml,
            img: imgPath,
            cost,
            price,
            old_price,
            status,
            type_of_sale,
            price_flash,
            quantity_flash,
            parfum_id_fk
        })

        const typeSaved = await newType.save()
        res.json(typeSaved);
    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: "Type not Found" })
    }
}

export const updateType = async (req, res) => {
    try{
        const { ml, cost, price, old_price, status, type_of_sale, price_flash, quantity_flash, imgServer, parfum_id_fk } = req.body;
        const imgPath = req.files?.img ? `/uploads/parfumIcon/${req.files.img[0].filename}` : imgServer !== undefined ? `/uploads/parfumIcon/${imgServer}` : null;

        const updatedData = {
            ml,
            cost,
            price,
            old_price,
            status,
            type_of_sale,
            price_flash,
            quantity_flash,
            parfum_id_fk
        };

        if (imgPath) updatedData.img = imgPath;

        const type = await Type.findByIdAndUpdate(req.params.id, updatedData, {
            new: true,
            runValidators: true
        });

        if (!type) return res.status(404).json({ message: "Type not Found" });
        
        res.json(type);
    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: "Type not Found" })
    }
}

export const deleteType = async(req, res) => {
    try{
        const type = await Type.findByIdAndDelete(req.params.id, req.body, {
            new: true
        });
        if (!type) return res.status(404).json({ message: "Type not Found" })
        res.json(type)
    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: "Type not Found" })
    }
}


export const getExportTypesData = async (req, res) => {
    try {
        // 1️⃣ Obtener los datos de MongoDB
        const parfums = await Parfum.find()
            .populate({ path: "parfum_id_fk", select: "title" })
            .sort({ title: 1 });

        if (!parfums.length) {
            return res.status(404).json({ message: "No hay Tipos de Perfumes disponibles" });
        }

        // 2️⃣ Convertir los datos en un formato compatible con Excel
        const data = types.map((type) => ({
            Mililitros: type.ml,
            Imagen: type.img,
            'Precio Costo': type.cost,
            'Precio de Nosotros': type.price,
            'Precio al Público': type.old_price,
            'Tipo de Venta': type_of_sale,
            'Precio Flash': price_flash,
            'Cantidad Flash': quantity_flash,
            Estado: type.status==1 ? "Activado" : "Desactivado",
            Perfume: type.parfum_id_fk ? type.parfum_id_fk.title : "N/A",
        }));

        // 3️⃣ Crear una hoja de Excel
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Tipos de Perfumes");

        // 4️⃣ Guardar el archivo en el servidor (opcional)
        const filePath = path.join(__dirname, "../exports/Royale-Tipos-de-Perfumes.xlsx");
        XLSX.writeFile(wb, filePath);

        // 5️⃣ Enviar el archivo como respuesta
        res.download(filePath, "Royale-Tipos-de-Perfumes.xlsx", (err) => {
            if (err) {
                console.error("Error al enviar el archivo:", err);
                res.status(500).json({ message: "Error al generar el archivo" });
            }
            // Elimina el archivo después de enviarlo (opcional)
            fs.unlinkSync(filePath);
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Error al obtener los Tipos de Perfumes" });
    }
};