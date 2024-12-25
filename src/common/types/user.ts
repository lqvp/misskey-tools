import { AlertMode } from './alert-mode.js';
import { Visibility } from './visibility.js';

export interface IUser {
  id: number;
  username: string;
  host: string;
  token: string;
  misshaiToken: string;
  prevNotesCount: number;
  prevFollowingCount: number;
  prevFollowersCount: number;
  alertMode: AlertMode;
  visibility: Visibility;
  localOnly: boolean;
  remoteFollowersOnly: boolean;
  template: string | null;
  prevRating: number;
  rating: number;
  bannedFromRanking: boolean;
  isAdmin?: boolean;
  tokenVersion: number;
  useRanking: boolean;
	noteLogs: number[];
}

