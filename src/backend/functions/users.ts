import { User } from '../models/entities/user.js';
import { Users } from '../models/index.js';
import { DeepPartial } from 'typeorm';
import { genToken } from './gen-token.js';
import { IUser } from '../../common/types/user.js';
import { config } from '../../config.js';
import { currentTokenVersion } from '../const.js';

/**
 * IUser インターフェイスに変換します。
 */
const packUser = (user: User | null): IUser | undefined => {
  if (!user) return undefined;
  const { username: adminName, host: adminHost } = config.admin;

  return {
    ...user,
    isAdmin: adminName === user.username && adminHost === user.host,
  };
};

/**
 * ユーザーを取得します
 * @param username ユーザー名
 * @param host ホスト名
 * @returns ユーザー
 */
export const getUser = (username: string, host: string): Promise<IUser | undefined> => {
  return Users.findOne({
    where: { username, host }
  }).then(packUser);
};

/**
 * ユーザーのミス廃トークンを更新します。
 * @param user ユーザー
 * @returns ミス廃トークン
 */
export const updateUsersToolsToken = async (user: User | User['id']): Promise<string> => {
  const id = typeof user === 'number'
    ? user
    : user.id;

  const misshaiToken = await genToken();
  Users.update(id, { misshaiToken });
  return misshaiToken;
};

/**
 * ミス廃トークンからユーザーを取得します。
 * @param token ミス廃トークン
 * @returns ユーザー
 */
export const getUserByToolsToken = (token: string): Promise<IUser | undefined> => {
  return Users.findOne({
    where: { misshaiToken: token }
  }).then(packUser);
};

/**
 * ユーザー情報を更新するか新規作成します。
 * @param username ユーザー名
 * @param host ホスト名
 * @param token トークン
 */
export const upsertUser = async (username: string, host: string, token: string): Promise<void> => {
  const u = await getUser(username, host);
  if (u) {
    await Users.update(u.id, { token, tokenVersion: currentTokenVersion });
  } else {
    const result = await Users.save({ username, host, token, tokenVersion: currentTokenVersion });
    await updateUsersToolsToken(result.id);
  }
};

/**
 * ユーザー情報を更新します。
 * @param username ユーザー名
 * @param host ホスト名
 * @param record 既存のユーザー情報
 */
export const updateUser = async (username: string, host: string, record: DeepPartial<User>): Promise<void> => {
  const sanitizedRecord: DeepPartial<User> = {
    ...record,
    prevNotesCount: typeof record.prevNotesCount === 'number' ? record.prevNotesCount : 0,
    prevFollowingCount: typeof record.prevFollowingCount === 'number' ? record.prevFollowingCount : 0,
    prevFollowersCount: typeof record.prevFollowersCount === 'number' ? record.prevFollowersCount : 0,
  };

  await Users.update({ username, host }, sanitizedRecord);
};

/**
 * 指定したユーザーを削除します。
 * @param username ユーザー名
 * @param host ホスト名
 */
export const deleteUser = async (username: string, host: string): Promise<void> => {
  await Users.delete({ username, host });
};

/**
 * ユーザー数を取得します。
 * @returns ユーザー数
 */
export const getUserCount = (): Promise<number> => {
  return Users.count();
};
