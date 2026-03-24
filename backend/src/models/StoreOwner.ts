import mongoose, { Document, Schema } from 'mongoose';

export interface IStoreOwner extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  storeName: string;
  address: string;
  phone: string;
}

const StoreOwnerSchema = new Schema<IStoreOwner>(
  {
    userId:    { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    storeName: { type: String, required: true },
    address:   { type: String, required: true },
    phone:     { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IStoreOwner>('StoreOwner', StoreOwnerSchema);
