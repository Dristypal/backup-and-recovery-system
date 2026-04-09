

const File = require('../models/File');
const Log = require('../models/Log');
const path = require('path');
const fs = require('fs');

const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }

    const fileData = {
      userId: req.user.id,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype
    };

    const file = await File.create(fileData);

    await Log.create({
      userId: req.user.id,
      action: 'upload',
      description: `Uploaded file ${req.file.originalname}`,
      ipAddress: req.ip
    });

    res.status(201).json({
      message: 'File uploaded successfully',
      file: {
        id: file._id,
        fileName: file.originalName,
        fileSize: file.fileSize,
        uploadedAt: file.uploadedAt
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getFiles = async (req, res) => {
  try {
    const files = await File.find({ userId: req.user.id }).sort({ uploadedAt: -1 });

    res.json({
      message: 'Files retrieved successfully',
      count: files.length,
      files
    });
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const downloadFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    if (file.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to access this file' });
    }

    await Log.create({
      userId: req.user.id,
      action: 'download',
      description: `Downloaded file ${file.originalName}`,
      ipAddress: req.ip
    });

    res.download(file.filePath, file.originalName);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    if (file.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this file' });
    }

    await Log.create({
      userId: req.user.id,
      action: 'delete',
      description: `Deleted file ${file.originalName}`,
      ipAddress: req.ip
    });

    fs.unlinkSync(file.filePath);
    await File.findByIdAndDelete(req.params.id);

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { uploadFile, getFiles, downloadFile, deleteFile };
