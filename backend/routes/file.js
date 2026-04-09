const express = require('express');
const router = express.Router();
const { uploadFile, getFiles, downloadFile, deleteFile } = require('../controllers/fileController');
const {protect} = require('../middleware/auth');
const multer = require('multer');
const storage = multer.diskStorage({
   destination:(req,file, cb)=>{
    cb(null,'uploads/');
   },
    filename:(req , file,cb)=>{
        cb(null, Date.now() + '-'+ file.originalname);
    }
});
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        cb(null, true);
    },
    limits: {
        fileSize: 100 * 1024 * 1024
    }
});
router.post('/upload', protect,upload.single('file'),
uploadFile);
router.get('/files', protect,getFiles);
router.get('/files/:id', protect,downloadFile);
router.delete('/files/:id', protect,deleteFile);
module.exports = router;

