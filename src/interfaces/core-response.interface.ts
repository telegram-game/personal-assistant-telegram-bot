export interface InvalidParam {
  name: string;
  reason: string;
}

export interface CoreResponse<T = any> {
  cid: string;
  detail: string;
  title: string;
  timestamp: number;
  responseTime: string;
  instance: string;
  status: number;
  invalidParams: InvalidParam[];
  data: T;
}
