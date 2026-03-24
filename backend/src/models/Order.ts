import mongoose, { Document, Schema } from 'mongoose';

export interface IOrderItem {
  _id?: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
}

export interface IOrder extends Document {
  _id: mongoose.Types.ObjectId;
  storeOwnerId: mongoose.Types.ObjectId;
  distributorId: mongoose.Types.ObjectId;
  status: 'PENDING' | 'CONFIRMED' | 'DELIVERING' | 'DELIVERED' | 'CANCELLED';
  totalAmount: number;
  address: string;
  note?: string;
  items: IOrderItem[];
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity:  { type: Number, required: true, min: 1 },
  price:     { type: Number, required: true },
});

const OrderSchema = new Schema<IOrder>(
  {
    storeOwnerId:  { type: Schema.Types.ObjectId, ref: 'StoreOwner',  required: true },
    distributorId: { type: Schema.Types.ObjectId, ref: 'Distributor', required: true },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'DELIVERING', 'DELIVERED', 'CANCELLED'],
      default: 'PENDING',
    },
    totalAmount: { type: Number, required: true },
    address:     { type: String, required: true },
    note:        { type: String, default: '' },
    items:       [OrderItemSchema],
  },
  { timestamps: true }
);

export default mongoose.model<IOrder>('Order', OrderSchema);
