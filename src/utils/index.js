import multer from "multer";
import path from "path";

const attachmentPath = path.join("./", "src/uploads");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, attachmentPath);
    },
    filename: (req, file, cb) => {
        const uploadSuffix = Date.now() + Math.round(Math.random() * 100);
        cb(null, uploadSuffix + path.extname(file.originalname));
    },
});
const utils = {
    updateObject: (oldObject, newObject) => {
        for (const key in newObject) {
            oldObject[key] = newObject[key];
        }
        return oldObject;
    },
    uploadFile: multer({ storage: storage }),
};

export default utils;
