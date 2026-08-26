import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  name: String,
  email: String,
  mobile: String,
  state: String,
  city: String,
  role: String,
  category: String,
});

export const User = mongoose.model('User', userSchema);

const contractSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  buyerId: String,
  buyerName: String,
  buyerRating: Number,
  category: String,
  product: String,
  productImage: String,
  quantity: String,
  quality: String,
  price: String,
  totalPrice: String,
  timeline: String,
  deliveryLocation: String,
  distance: String,
  transportIncluded: Boolean,
  status: String,
  progress: String,
  createdAt: Date,
  farmerId: String,
});

export const Contract = mongoose.model('Contract', contractSchema);

const chatSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  name: String,
  avatar: String,
  lastMessage: String,
  time: String,
  unread: Number,
});

export const Chat = mongoose.model('Chat', chatSchema);
