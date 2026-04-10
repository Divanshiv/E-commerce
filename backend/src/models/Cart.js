import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
    // Note: index defined below via cartSchema.index()
  },
  sessionId: String, // For guest carts
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    },
    size: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    }
  }],
  couponApplied: {
    code: String,
    discountType: {
      type: String,
      enum: ['percentage', 'fixed']
    },
    discountValue: Number,
    discountAmount: Number
  }
}, {
  timestamps: true
});

// Index for efficient queries (sparse allows multiple null userId values for guest carts)
cartSchema.index({ userId: 1 }, { sparse: true });
cartSchema.index({ sessionId: 1 });

export default mongoose.model('Cart', cartSchema);
