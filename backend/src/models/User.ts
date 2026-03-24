import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  role: 'STORE_OWNER' | 'DISTRIBUTOR';
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role:     { type: String, enum: ['STORE_OWNER', 'DISTRIBUTOR'], required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
