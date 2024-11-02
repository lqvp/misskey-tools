/**
 * バージョン情報など、サーバーのメタデータを返すAPI
 * @author Xeltica
 */

import { BadRequestError, Body, CurrentUser, Delete, Get, JsonController, NotFoundError, OnUndefined, Param, Post, Put } from 'routing-controllers';
import { IUser } from '../../common/types/user.js';
import { Announcements } from '../models/index.js';
import { AnnounceCreate } from './body/announce-create.js';
import { AnnounceUpdate } from './body/announce-update.js';
import { IdProp } from './body/id-prop.js';

@JsonController('/announcements')
export class AnnouncementController {
  @Get() get() {
    const query = Announcements.createQueryBuilder('announcement')
      .orderBy('"announcement"."createdAt"', 'DESC');

    return query.getMany();
  }

  @OnUndefined(204)
  @Post() async post(@CurrentUser({ required: true }) user: IUser, @Body({required: true}) {title, body}: AnnounceCreate) {
    if (!user.isAdmin) {
      throw new BadRequestError('Not an Admin');
    }
    if (!title || !body) {
      throw new BadRequestError();
    }
    await Announcements.insert({
      createdAt: new Date(),
      title,
      body,
    });
  }

  @OnUndefined(204)
  @Put() async update(@CurrentUser({ required: true }) user: IUser, @Body() {id, title, body}: AnnounceUpdate) {
    if (!user.isAdmin) {
      throw new BadRequestError('Not an Admin');
    }
    if (!id || !title || !body) {
      throw new BadRequestError();
    }
    if (!(await Announcements.findOne({
			where: { id }
		}))) {
      throw new NotFoundError();
    }

    await Announcements.update(id, {
      title,
      body,
    });
  }

  @OnUndefined(204)
  @Post('/like/:id') async like(@CurrentUser({ required: true }) user: IUser, @Param('id') id: string) {
    if (!user.isAdmin) {
      throw new BadRequestError('Not an Admin');
    }
    const idNumber = Number(id);
    if (isNaN(idNumber)) {
      throw new NotFoundError();
    }
    if (!id) {
      throw new BadRequestError();
    }

    const announcement = await Announcements.findOne({
			where: { id: idNumber }
		});

    if (!announcement) {
      throw new NotFoundError();
    }

    await Announcements.update(id, {
      like: announcement.like + 1,
    });

    return announcement.like + 1;
  }

  @Delete() async delete(@CurrentUser({ required: true }) user: IUser, @Body() {id}: IdProp) {
    if (!user.isAdmin) {
      throw new BadRequestError('Not an Admin');
    }

    if (!id) {
      throw new BadRequestError();
    }

    await Announcements.delete(id);
  }

  @Get('/:id') async getDetail(@Param('id') id: string) {
    const idNumber = Number(id);
    if (isNaN(idNumber)) {
      throw new NotFoundError();
    }
    const announcement = await Announcements.findOne({
			where: { id: idNumber }
		});;
    if (!announcement) {
      throw new NotFoundError();
    }
    return announcement;
  }
}
