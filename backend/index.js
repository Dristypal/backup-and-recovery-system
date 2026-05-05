const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/file');
const backupRoutes = require('./routes/backup');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const { ensureBucketVersioningEnabled } = require('./services/s3Service');
const { startBackupCron } = require('./services/cronService');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectDB();
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/backups', backupRoutes);
app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);

  try {
    const versioningStatus = await ensureBucketVersioningEnabled();
    console.log(`S3 bucket versioning enabled${versioningStatus.changed ? ' (updated during startup)' : ''}.`);
  } catch (error) {
    console.error(`S3 versioning check failed: ${error.message}`);
  }

  startBackupCron();
});

