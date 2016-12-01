import { Device } from './device.model';
export class User {
  nickname: string;
  realname: string;
  mobile: string;
  isChatForbidden: boolean;
  device: Device;
}