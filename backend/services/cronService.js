const cron = require('node-cron');
const { createDatabaseBackup } = require('./backupService');

let backupTask;

const startBackupCron = () => {
  if (backupTask) {
    return backupTask;
  }

  const schedule = process.env.BACKUP_CRON_SCHEDULE || '0 1 * * *';

  backupTask = cron.schedule(schedule, async () => {
    try {
      const backup = await createDatabaseBackup();
      console.log(`Daily database backup created: ${backup.fileName}`);
    } catch (error) {
      console.error('Daily database backup failed:', error.message);
    }
  }, {
    scheduled: true,
    timezone: process.env.BACKUP_CRON_TIMEZONE || 'UTC'
  });

  return backupTask;
};

module.exports = { startBackupCron };
