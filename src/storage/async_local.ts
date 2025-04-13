import { AsyncLocalStorage } from 'node:async_hooks';
import { RequestContext } from 'src/models';

const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

export default asyncLocalStorage;
