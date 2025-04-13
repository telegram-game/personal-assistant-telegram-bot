import { CoreResponse, InvalidParam } from 'src/interfaces';
export class SuccessResponse<T>
  implements
    Omit<
      CoreResponse<T>,
      'title' | 'detail' | 'instance' | 'status' | 'invalidParams'
    >
{
  cid: string;
  timestamp: number;
  responseTime: string;
  data: T;
  constructor(data: Partial<SuccessResponse<T>>) {
    Object.assign(this, data);
  }
}

export class ErrorResponse implements Omit<CoreResponse, 'data'> {
  cid: string;
  detail: string;
  title: string;
  timestamp: number;
  responseTime: string;
  instance: string;
  status: number;
  invalidParams: InvalidParam[];
  errorCode: string;
  constructor(data: Partial<ErrorResponse>) {
    Object.assign(this, data);
  }
}
