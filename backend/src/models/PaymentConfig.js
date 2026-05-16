import mongoose from 'mongoose';

const paymentConfigSchema = new mongoose.Schema(
  {
    razorpayKeyId: {
      type: String,
      default: '',
    },
    currency: {
      type: String,
      default: 'INR',
      enum: ['INR', 'USD'],
    },
    codEnabled: {
      type: Boolean,
      default: true,
    },
    codCharges: {
      type: Number,
      default: 30,
      min: 0,
    },
    allowedMethods: {
      type: [String],
      default: ['card', 'google_pay', 'phonepe', 'paytm_wallet', 'cod'],
      enum: ['card', 'google_pay', 'phonepe', 'upi', 'paytm_wallet', 'cod'],
    },
    googlePayTestId: {
      type: String,
      default: 'success@razorpay',
    },
    phonePeTestId: {
      type: String,
      default: 'success@razorpay',
    },
    testCardNumber: { type: String, default: '4111 1111 1111 1111' },
    testCardExpiry: { type: String, default: '12/28' },
    testCardCvv: { type: String, default: '123' },
    testCardHolder: { type: String, default: 'Test User' },
    testCardType: { type: String, default: 'visa' },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model('PaymentConfig', paymentConfigSchema);
