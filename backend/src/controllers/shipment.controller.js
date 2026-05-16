import ShipmentConfig from '../models/ShipmentConfig.js';

// Get shipment config
export const getShipmentConfig = async (_req, res, next) => {
  try {
    let config = await ShipmentConfig.findOne();

    if (!config) {
      config = await ShipmentConfig.create({
        freeShippingThreshold: 999,
        standardRate: 49,
        expressRate: 99,
        codCharges: 30,
        standardDeliveryDays: 5,
        expressDeliveryDays: 2,
      });
    }

    res.json({ success: true, data: { config } });
  } catch (error) {
    next(error);
  }
};

// Update shipment config (admin)
export const updateShipmentConfig = async (req, res, next) => {
  try {
    const updates = req.body;

    let config = await ShipmentConfig.findOne();

    if (!config) {
      config = new ShipmentConfig();
    }

    Object.assign(config, updates);
    await config.save();

    res.json({ success: true, data: { config } });
  } catch (error) {
    next(error);
  }
};
