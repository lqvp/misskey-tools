import { AdminSettingsRepo } from '../models/index.js';
import cron from 'node-cron';

/**
 * Resets the daily user registration count at midnight
 */
const resetDailyUserCount = async () => {
  const settings = await AdminSettingsRepo.findOne({ where: { id: 1 } });
  if (!settings) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Only reset if the date has changed
  if (!settings.currentDate || settings.currentDate.getTime() < today.getTime()) {
    settings.currentDate = today;
    settings.todayUserCount = 0;
    await AdminSettingsRepo.save(settings);
    console.log('Daily user registration count has been reset');
  }
};

/**
 * Starts the daily reset service
 * Runs every minute to check and reset the count if needed
 */
export const startDailyResetService = () => {
  // Run immediately on startup
  resetDailyUserCount();

  // Schedule to run every minute
  cron.schedule('* * * * *', resetDailyUserCount);
};
