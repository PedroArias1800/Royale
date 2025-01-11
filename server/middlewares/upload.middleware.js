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
        fileFilter: (req, file, cb) => {
            if (!file.mimetype.startsWith('image/')) {
                return cb(new Error('Solo se permiten archivos de imagen'));
            }
            cb(null, true);
        },    
    })
};
