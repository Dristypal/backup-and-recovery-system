const express = require('express');
const multer = require('multer');
const {
  deleteFile,
  downloadFile,
  getFiles,
  getFileVersions,
  restoreFileVersion,
  uploadFile
} = require('../controllers/fileController');
const { protect } = require('../middleware/auth');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => cb(null, true),
  limits: {
    fileSize: 100 * 1024 * 1024
  }
});

router.post('/upload', protect, upload.single('file'), uploadFile);
router.get('/', protect, getFiles);
router.get('/:id/download', protect, downloadFile);
router.get('/:id/versions', protect, getFileVersions);
router.delete('/:id', protect, deleteFile);
router.post('/restore/:backupId', protect, restoreFileVersion);

module.exports = router;
