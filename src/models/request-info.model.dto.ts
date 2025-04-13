export class UserInfo {
  userId?: string;
  username?: string;
  [k: string]: any;
}
export class RequestContext {
  cid: string;
  requestTimestamp: number;
  userInfo: UserInfo;
  accesstoken?: string;
  constructor(data: Partial<RequestContext>) {
    Object.assign(this, data);
  }
}
