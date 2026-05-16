import mongoose from 'mongoose';

const shipmentConfigSchema = new mongoose.Schema(
  {
    freeShippingThreshold: {
      type: Number,
      default: 999,
      min: 0,
    },
    standardRate: {
      type: Number,
      default: 49,
      min: 0,
    },
    expressRate: {
      type: Number,
      default: 99,
      min: 0,
    },
    codCharges: {
      type: Number,
      default: 30,
      min: 0,
    },
    standardDeliveryDays: {
      type: Number,
      default: 5,
      min: 1,
    },
    expressDeliveryDays: {
      type: Number,
      default: 2,
      min: 1,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model('ShipmentConfig', shipmentConfigSchema);
