import mongoose from 'mongoose';

const paymentConfigSchema = new mongoose.Schema({
  razorpayKeyId: {
    type: String,
    default: ''
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD']
  },
  codEnabled: {
    type: Boolean,
    default: true
  },
  codCharges: {
    type: Number,
    default: 30,
    min: 0
  },
  allowedMethods: {
    type: [String],
    default: ['card', 'upi', 'paytm_wallet', 'cod'],
    enum: ['card', 'upi', 'paytm_wallet', 'cod']
  }
}, {
  timestamps: true
});

export default mongoose.model('PaymentConfig', paymentConfigSchema);
