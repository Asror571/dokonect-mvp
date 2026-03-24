import { IUser } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: IUser & {
        storeOwner?: any;
        distributor?: any;
      };
    }
  }
}

export {};
