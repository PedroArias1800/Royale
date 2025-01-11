import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Obtener la ruta del directorio actual (equivalente a __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const getParfumsGallery = (req, res) => {
    const directoryPath = path.join(__dirname, '../uploads/parfum'); // Ruta de la carpeta

    // Leer los archivos de la carpeta
    fs.readdir(directoryPath, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Error al leer la carpeta' });
        }

        // Filtrar solo archivos de imagen (extensiones .jpg, .jpeg, .png, .gif)
        const imageFiles = files.filter(file => {
            return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(path.extname(file));
        });

        // Devolver la lista de nombres de archivos de imagen
        res.status(200).json({ images: imageFiles });
    });
};

export const getParfumsIconGallery = (req, res) => {
    const directoryPath = path.join(__dirname, '../uploads/parfumIcon'); // Ruta de la carpeta

    // Leer los archivos de la carpeta
    fs.readdir(directoryPath, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Error al leer la carpeta' });
        }

        // Filtrar solo archivos de imagen (extensiones .jpg, .jpeg, .png, .gif)
        const imageFiles = files.filter(file => {
            return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(path.extname(file));
        });

        // Devolver la lista de nombres de archivos de imagen
        res.status(200).json({ images: imageFiles });
    });
};