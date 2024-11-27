/**
 * Admin API
 * @author Xeltica
 */

import { BadRequestError, CurrentUser, Get, JsonController, OnUndefined, Post, Put, Body } from 'routing-controllers';
import { IUser } from '../../common/types/user.js';
import { config } from '../../config.js';
import { work } from '../services/worker.js';
import * as Store from '../store.js';
import { AdminSettingsRepo } from '../models/index.js';

@JsonController('/admin')
export class AdminController {
  @Get() getAdmin() {
    const { username, host } = config.admin;
    return {
      username, host,
      acct: `@${username}@${host}`,
    };
  }

  @Get('/misshai/log') getMisshaiLog(@CurrentUser({ required: true }) user: IUser) {
    if (!user.isAdmin) {
      throw new BadRequestError('Not an Admin');
    }

    return Store.getState().misshaiWorkerLog;
  }

  @OnUndefined(204)
  @Post('/misshai/start') startMisshai(@CurrentUser({ required: true }) user: IUser) {
    if (!user.isAdmin) {
      throw new BadRequestError('Not an Admin');
    }
    if (Store.getState().nowCalculating) {
      throw new BadRequestError('Already started');
    }

    work();
  }

  @Get('/settings')
  async getSettings(@CurrentUser({ required: true }) user: IUser) {
    if (!user.isAdmin) {
      throw new BadRequestError('Not an Admin');
    }

    const settings = await AdminSettingsRepo.findOne({ where: { id: 1 } });
    return settings;
  }

  @Put('/settings')
  @OnUndefined(204)
  async updateSettings(
    @CurrentUser({ required: true }) user: IUser,
    @Body() body: { allowNewUsers?: boolean; maxNewUsersPerDay?: number }
  ) {
    if (!user.isAdmin) {
      throw new BadRequestError('Not an Admin');
    }

    const settings = await AdminSettingsRepo.findOne({ where: { id: 1 } });
    if (!settings) {
      throw new BadRequestError('Settings not found');
    }

    if (typeof body.allowNewUsers === 'boolean') {
      settings.allowNewUsers = body.allowNewUsers;
    }

    if (typeof body.maxNewUsersPerDay === 'number') {
      settings.maxNewUsersPerDay = body.maxNewUsersPerDay;
    }

    await AdminSettingsRepo.save(settings);
  }
}
