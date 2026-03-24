import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  _id: mongoose.Types.ObjectId;
  distributorId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  price: number;
  unit: string;
  stock: number;
  category: string;
  imageUrl?: string | null;
  isActive: boolean;
}

const ProductSchema = new Schema<IProduct>(
  {
    distributorId: { type: Schema.Types.ObjectId, ref: 'Distributor', required: true },
    name:          { type: String, required: true },
    description:   { type: String, default: '' },
    price:         { type: Number, required: true },
    unit:          { type: String, default: 'dona' },
    stock:         { type: Number, default: 0 },
    category:      { type: String, required: true },
    imageUrl:      { type: String, default: null },
    isActive:      { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IProduct>('Product', ProductSchema);
