import mongoose, { Document, Schema } from 'mongoose';

export interface IDistributor extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  companyName: string;
  address: string;
  phone: string;
}

const DistributorSchema = new Schema<IDistributor>(
  {
    userId:      { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    companyName: { type: String, required: true },
    address:     { type: String, required: true },
    phone:       { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IDistributor>('Distributor', DistributorSchema);
