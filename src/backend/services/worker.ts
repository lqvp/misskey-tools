import cron from 'node-cron';
import { deleteUser } from '../functions/users.js';
import { MiUser, updateScore } from '../functions/update-score.js';
import { updateRating } from '../functions/update-rating.js';
import { Users } from '../models/index.js';
import {sendNoteAlert, sendNotificationAlert} from './send-alert.js';
import {api, MisskeyError, TimedOutError} from './misskey.js';
import * as Store from '../store.js';
import { User } from '../models/entities/user.js';
import {groupBy} from '../utils/group-by.js';
import {clearLog, printLog} from '../store.js';
import {errorToString} from '../functions/error-to-string.js';
import {Acct, toAcct} from '../models/acct.js';
import {Count} from '../models/count.js';
import {format} from '../../common/functions/format.js';
import {delay} from '../utils/delay.js';

const ERROR_CODES_USER_REMOVED = ['NO_SUCH_USER', 'AUTHENTICATION_FAILED', 'YOUR_ACCOUNT_SUSPENDED'];

// TODO: Redisで持つようにしたい
const userScoreCache = new Map<Acct, Count>();

export default (): void => {
  cron.schedule('0 0 0 * * *', work);
};

export const work = async () => {
  Store.dispatch({ nowCalculating: true });

  clearLog();
  printLog('Started.');

  try {
    const users = await Users.find();
    const groupedUsers = groupBy(users, u => u.host);

    printLog(`${users.length} アカウントのレート計算を開始します。`);
    await calculateAllRating(groupedUsers);
    Store.dispatch({ nowCalculating: false });

    printLog(`${users.length} アカウントのアラート送信を開始します。`);
    await sendAllAlerts(groupedUsers);

    printLog('ミス廃アラートワーカーは正常に完了しました。');
  } catch (e) {
    printLog('ミス廃アラートワーカーが異常終了しました。', 'error');
    printLog(e instanceof Error ? errorToString(e) : JSON.stringify(e, null, '  '), 'error');
  } finally {
    Store.dispatch({ nowCalculating: false });
  }
};

const calculateAllRating = async (groupedUsers: [string, User[]][]) => {
  return await Promise.all(groupedUsers.map(kv => calculateRating(...kv)));
};

const calculateRating = async (host: string, users: User[]) => {
  for (const user of users) {
    let miUser: MiUser;
    try {
      miUser = await api<MiUser>(user.host, 'i', {}, user.token);
    } catch (e) {
      if (!(e instanceof Error)) {
        printLog('バグ：エラーオブジェクトはErrorを継承していないといけない', 'error');
      } else if (e instanceof MisskeyError) {
        if (ERROR_CODES_USER_REMOVED.includes(e.error.code)) {
          // ユーザーが削除されている場合、レコードからも消してとりやめ
          printLog(`アカウント ${toAcct(user)} は削除されているか、凍結されているか、トークンを失効しています。そのため、本システムからアカウントを削除します。`, 'warn');
          await deleteUser(user.username, user.host);
        } else {
          printLog(`Misskey エラー: ${JSON.stringify(e.error)}`, 'error');
        }
      } else if (e instanceof TimedOutError) {
        printLog(`サーバー ${user.host} との接続に失敗したため、このサーバーのレート計算を中断します。`, 'error');
        return;
      } else {
        // おそらく通信エラー
        printLog(`不明なエラーが発生しました。\n${errorToString(e)}`, 'error');
      }
      continue;
    }
    userScoreCache.set(toAcct(user), miUser);

    await updateRating(user, miUser);

    // Update noteLogs in database
    const newLogs = [miUser.notesCount, ...(user.noteLogs || [])].slice(0, 3);
    await Users.update(user.id, { noteLogs: newLogs });
  }
  printLog(`${host} ユーザー(${users.length}人) のレート計算が完了しました。`);
};

const checkAndDeleteInactiveUsers = async (user: User) => {
  // Check if we have 3 days of logs
  if (user.noteLogs.length === 3) {
    // Check if note count hasn't increased for 3 days
    const hasIncreased = user.noteLogs.some((count, index, arr) =>
      index > 0 && count > arr[index - 1]
    );

    if (!hasIncreased) {
      await deleteUser(user.username, user.host);
      printLog(`User ${user.username} deleted due to no activity for 3 days.`);
      await sendNotificationAlert('あなたのアカウントは3日間ノート数が増加しなかった為、misskey toolsのシステムから削除されました。', user);
    }
  }
};

const sendAllAlerts = async (groupedUsers: [string, User[]][]) => {
  return await Promise.all(groupedUsers.map(kv => sendAlerts(...kv)));
};

const sendAlerts = async (host: string, users: User[]) => {
  const models = users
    .map(user => {
      const count = userScoreCache.get(toAcct(user));
      if (count == null) return null;
      if (count.notesCount - (user.prevNotesCount ?? 0) <= 1) return null;
      return {
        user,
        count,
        message: format(user, count),
      };
    })
    .filter(u => u != null) as {user: User, count: Count, message: string}[];

  for (const {user, count} of models.filter(m => m.user.alertMode === 'nothing')) {
    await updateScore(user, count);
  }

  for (const {user, count, message} of models.filter(m => m.user.alertMode === 'notification' || m.user.alertMode === 'both')) {
    try {
      await sendNotificationAlert(message, user);
      if (user.alertMode === 'notification') {
        await updateScore(user, count);
      }
    } catch (e) {
      if (e instanceof MisskeyError && e.error.code === 'YOUR_ACCOUNT_MOVED') {
        printLog(`Account ${toAcct(user)} has moved. Discarding the account.`, 'warn');
        await deleteUser(user.username, user.host);
      } else {
        throw e;
      }
    }
  }

  for (const {user, count, message} of models.filter(m => m.user.alertMode === 'note' || m.user.alertMode === 'both')) {
    try {
      await sendNoteAlert(message, user);
      await Promise.all([
        updateScore(user, count),
        delay(1000),
      ]);
    } catch (e) {
      if (e instanceof MisskeyError && (e.error.code === 'YOUR_ACCOUNT_MOVED' || e.error.code === 'AUTHENTICATION_FAILED')) {
        printLog(`Account ${toAcct(user)} has moved or token is invalid. Discarding the account.`, 'warn');
        await deleteUser(user.username, user.host);
      } else if (e instanceof MisskeyError && e.error.code === 'CONTAINS_TOO_MANY_MENTIONS') {
        printLog(`Account ${toAcct(user)} has too many mentions. Skipping.`, 'warn');
        await sendNotificationAlert('エラー: ノートを送信することが出来るませんでした。あなたのアカウントに設定されてるテンプレートがロールに割り当てられているメンション数を超えています。', user);
        continue;
      } else {
        throw e;
      }
    }
  }

  printLog(`${host} ユーザー(${users.length}人) へのアラート送信が完了しました。`);
};

// Update the cron schedule to check inactive users
cron.schedule('0 0 * * *', async () => {
  const users = await Users.find();
  for (const user of users) {
    await checkAndDeleteInactiveUsers(user);
  }
});
