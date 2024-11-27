import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class AdminSettings {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({
    type: 'boolean',
    default: true,
    comment: 'Whether new user registration is allowed'
  })
  public allowNewUsers: boolean;

  @Column({
    type: 'integer',
    default: 0,
    comment: 'Maximum number of new users allowed per day (0 = unlimited)'
  })
  public maxNewUsersPerDay: number;

  @Column({
    type: 'timestamp without time zone',
    nullable: true,
    comment: 'The date to track daily user count'
  })
  public currentDate: Date | null;

  @Column({
    type: 'integer',
    default: 0,
    comment: 'Number of users registered today'
  })
  public todayUserCount: number;
}
