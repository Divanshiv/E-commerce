import mongoose from 'mongoose';
import slugify from 'slugify';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  salePrice: {
    type: Number,
    min: 0
  },
  images: [{
    url: String,
    publicId: String
  }],
  category: {
    type: String,
    required: true,
    enum: ['men-tshirts', 'women-tshirts', 'hoodies', 'joggers', 'accessories']
  },
  subcategory: String,
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand'
  },
  sizes: [{
    name: { type: String, enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
    stock: { type: Number, default: 0 }
  }],
  colors: [{
    name: String,
    hex: String
  }],
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 }
  },
  reviews: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    createdAt: { type: Date, default: Date.now }
  }],
  isFeatured: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [String]
}, {
  timestamps: true
});

// Generate slug before saving
productSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (this.salePrice && this.price > this.salePrice) {
    return Math.round((1 - this.salePrice / this.price) * 100);
  }
  return 0;
});

// Virtual for total stock
productSchema.virtual('totalStock').get(function() {
  return this.sizes.reduce((sum, size) => sum + size.stock, 0);
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

export default mongoose.model('Product', productSchema);
