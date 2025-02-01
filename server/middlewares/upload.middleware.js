import multer from 'multer';

const storage = (carpeta) => multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, `uploads/${carpeta}`);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

export const upload = (carpeta) => {
    return multer({
        storage: storage(carpeta),
        limits: { fileSize: 50 * 1024 * 1024 },
        fileFilter: (req, file, cb) => {
            if (!file.mimetype.startsWith('image/') && !file.mimetype.startsWith('video/')) {
                return cb(new Error('Solo se permiten archivos de imagen o video'));
            }
            cb(null, true);
        },    
    })
};
