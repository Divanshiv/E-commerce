# E-Commerce Platform V1 - Technical Specification

## 1. Project Overview

**Project Name:** ShopKart  
**Type:** Full-stack E-Commerce Platform (MERN)  
**Target Users:** Indian fashion consumers + Admin operators  
**Design Reference:** bewakoof.com style (bold, youthful, mobile-first)

---

## 2. Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + Vite + Tailwind CSS v4 |
| Backend | Node.js + Express.js |
| Database | MongoDB Atlas |
| Auth | Supabase (JWT-based) |
| Payments | Razorpay |
| Images | Cloudinary |
| Hosting | Vercel (Frontend) + Render/Railway (Backend) |
| Version Control | GitHub |

---

## 3. Project Structure

```
E-commerce/
├── backend/                 # Express API
│   ├── src/
│   │   ├── config/         # DB, Supabase, Cloudinary config
│   │   ├── controllers/     # Business logic
│   │   ├── middleware/     # Auth, error handling
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # API routes
│   │   └── utils/         # Helpers
│   ├── server.js
│   └── package.json
│
├── frontend/               # React App
│   ├── src/
│   │   ├── api/           # Axios API clients
│   │   ├── components/    # Reusable UI components
│   │   ├── context/       # React contexts (Auth, Cart, Wishlist)
│   │   ├── hooks/         # Custom hooks
│   │   ├── pages/         # Page components
│   │   │   ├── admin/     # Admin panel pages
│   │   │   └── buyer/     # Buyer pages
│   │   ├── utils/         # Helper functions
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
│
└── SPEC.md
```

---

## 4. Database Schema (MongoDB)

### 4.1 User
```javascript
{
  _id: ObjectId,
  supabaseId: String,        // Supabase user ID
  email: String,
  name: String,
  phone: String,
  role: Enum['user', 'admin'],
  avatar: String,
  address: [{
    street: String,
    city: String,
    state: String,
    pincode: String,
    isDefault: Boolean
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### 4.2 Product
```javascript
{
  _id: ObjectId,
  name: String,
  slug: String,
  description: String,
  price: Number,
  salePrice: Number,
  images: [{ url: String, publicId: String }],
  category: String,          // men-tshirts, women-tshirts, hoodies, joggers, accessories
  subcategory: String,
  brand: ObjectId,            // Ref: Brand
  sizes: [{ name: String, stock: Number }],  // [{name: "M", stock: 10}, {name: "L", stock: 5}]
  colors: [{ name: String, hex: String }],
  rating: { average: Number, count: Number },
  reviews: [{
    user: ObjectId,
    rating: Number,
    comment: String,
    createdAt: Date
  }],
  isFeatured: Boolean,
  isActive: Boolean,
  tags: [String],
  createdAt: Date,
  updatedAt: Date
}
```

### 4.3 Brand
```javascript
{
  _id: ObjectId,
  name: String,
  slug: String,
  logo: { url: String, publicId: String },
  description: String,
  isActive: Boolean
}
```

### 4.4 Cart
```javascript
{
  _id: ObjectId,
  userId: ObjectId,          // Optional for guest
  sessionId: String,          // For guest carts
  items: [{
    product: ObjectId,
    quantity: Number,
    size: String,
    price: Number             // Price at time of adding
  }],
  couponApplied: {
    code: String,
    discountType: Enum['percentage', 'fixed'],
    discountValue: Number,
    discountAmount: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 4.5 Wishlist
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  products: [ObjectId],
  updatedAt: Date
}
```

### 4.6 Order
```javascript
{
  _id: ObjectId,
  orderNumber: String,       // "ORD-1704067200"
  user: ObjectId,
  items: [{
    product: ObjectId,
    name: String,
    image: String,
    size: String,
    quantity: Number,
    price: Number
  }],
  subtotal: Number,
  discount: Number,
  shippingCharges: Number,
  total: Number,
  couponApplied: String,
  payment: {
    method: Enum['razorpay', 'cod'],
    razorpayOrderId: String,
    razorpayPaymentId: String,
    status: Enum['pending', 'paid', 'failed']
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    phone: String
  },
  status: Enum['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
  trackingNumber: String,
  createdAt: Date,
  updatedAt: Date
}
```

### 4.7 Coupon
```javascript
{
  _id: ObjectId,
  code: String,              // "WELCOME10"
  description: String,
  discountType: Enum['percentage', 'fixed'],
  discountValue: Number,
  minOrderValue: Number,
  maxDiscount: Number,       // Cap for percentage discounts
  usageLimit: Number,
  usedCount: Number,
  validFrom: Date,
  validUntil: Date,
  isActive: Boolean
}
```

### 4.8 ShipmentConfig
```javascript
{
  _id: ObjectId,
  freeShippingThreshold: Number,  // ₹999
  standardRate: Number,           // ₹49
  expressRate: Number,            // ₹99
  codCharges: Number              // ₹30
}
```

---

## 5. API Endpoints

### 5.1 Public Endpoints (No Auth Required)
```
GET    /api/products              # List products (with filters, search, pagination)
GET    /api/products/:slug        # Get product by slug
GET    /api/products/featured      # Get featured products
GET    /api/brands                # List all brands
GET    /api/categories            # List categories
```

### 5.2 Guest User Endpoints
```
POST   /api/cart/guest            # Create/update guest cart (session-based)
POST   /api/wishlist/guest/toggle # Toggle guest wishlist
```

### 5.3 Authenticated User Endpoints
```
# Auth
POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/logout

# Cart
GET    /api/cart
POST   /api/cart/items
PUT    /api/cart/items/:itemId
DELETE /api/cart/items/:itemId
POST   /api/cart/apply-coupon
DELETE /api/cart/coupon

# Wishlist
GET    /api/wishlist
POST   /api/wishlist/:productId
DELETE /api/wishlist/:productId

# Orders
GET    /api/orders
GET    /api/orders/:orderId
POST   /api/orders                # Create order

# User
GET    /api/user/profile
PUT    /api/user/profile
GET    /api/user/addresses
POST   /api/user/addresses
```

### 5.4 Admin Endpoints (admin role required)
```
# Dashboard
GET    /api/admin/dashboard/stats

# Products
GET    /api/admin/products
POST   /api/admin/products
PUT    /api/admin/products/:id
DELETE /api/admin/products/:id
POST   /api/admin/products/:id/images

# Brands
GET    /api/admin/brands
POST   /api/admin/brands
PUT    /api/admin/brands/:id
DELETE /api/admin/brands/:id

# Orders
GET    /api/admin/orders
PUT    /api/admin/orders/:id/status
GET    /api/admin/orders/:id

# Customers
GET    /api/admin/customers

# Coupons
GET    /api/admin/coupons
POST   /api/admin/coupons
PUT    /api/admin/coupons/:id
DELETE /api/admin/coupons/:id

# Shipment
GET    /api/admin/shipment
PUT    /api/admin/shipment

# Payment Gateway
GET    /api/admin/payment-config
PUT    /api/admin/payment-config
```

### 5.5 Payment Endpoints
```
POST   /api/payments/razorpay/order    # Create Razorpay order
POST   /api/payments/razorpay/verify   # Verify payment signature
```

---

## 6. Frontend Pages

### 6.1 Buyer Pages (Public)
| Route | Page | Description |
|-------|------|-------------|
| `/` | Home | Hero banner, featured products, categories |
| `/products` | Product Listing | Grid with filters sidebar, search, sort |
| `/product/:slug` | Product Detail | Images, sizes, add to cart, reviews |
| `/cart` | Cart | Full cart with coupon apply |
| `/checkout` | Checkout | Address, payment (login required) |
| `/order/:orderId` | Order Success | Confirmation page |
| `/login` | Login | Supabase auth |
| `/signup` | Signup | Supabase auth |
| `/wishlist` | Wishlist | Saved products (login required) |
| `/orders` | Order History | User orders (login required) |

### 6.2 Admin Pages (Protected - admin role)
| Route | Page | Description |
|-------|------|-------------|
| `/admin` | Dashboard | Sales stats, recent orders, low stock |
| `/admin/products` | Products | CRUD products, images |
| `/admin/brands` | Brands | Manage brands |
| `/admin/orders` | Orders | View & update order status |
| `/admin/customers` | Customers | View all users |
| `/admin/coupons` | Coupons | Create/manage discount codes |
| `/admin/shipment` | Shipment | Configure shipping rates |
| `/admin/settings` | Settings | Payment gateway config |

---

## 7. UI Components

### 7.1 Product Card (bewakoof.com style)
```
┌─────────────────────────┐
│  [Wishlist Heart]       │
│  ┌───────────────────┐  │
│  │                   │  │
│  │   Product Image   │  │
│  │                   │  │
│  └───────────────────┘  │
│  Brand Name             │
│  Product Name           │
│  ₹499  ₹999  50% OFF    │
│  ★★★★☆ (123)           │
│  [████████░░] In Stock  │
│  [    ADD TO CART    ]  │
└─────────────────────────┘
```

### 7.2 Filter Sidebar
- Category (Men Tees, Women Tees, Hoodies, Joggers, Accessories)
- Price Range (slider or min/max inputs)
- Size (XS, S, M, L, XL, XXL)
- Brand (checkbox list)
- Sort By (Newest, Price Low-High, Price High-Low, Popular)

### 7.3 Navigation
- Logo (left)
- Search bar (center)
- Wishlist icon + count
- Cart icon + count
- Login/Signup or User dropdown

---

## 8. Auth Flow

### 8.1 Guest User Flow
1. User browses products without login
2. Can add to wishlist (stored in localStorage)
3. Can add to cart (stored in localStorage, then syncs to DB on login)
4. At checkout → prompted to login/signup
5. After login → cart merges from localStorage to DB

### 8.2 Supabase JWT Verification
```javascript
// Backend middleware
const verifySupabaseToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return next();
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ message: 'Invalid token' });
  
  req.user = user;
  next();
};
```

---

## 9. Payment Flow (Razorpay)

1. User clicks "Pay ₹X"
2. Backend creates Razorpay order
3. Frontend opens Razorpay modal
4. User completes payment
5. Frontend sends payment verification to backend
6. Backend verifies signature + creates order
7. Success page shown

---

## 10. Deployment

### 10.1 Backend (Vercel or Railway)
```
Directory: backend/
Build: npm install && npm start
Env Variables:
  - MONGODB_URI
  - SUPABASE_URL
  - SUPABASE_ANON_KEY
  - RAZORPAY_KEY_ID
  - RAZORPAY_KEY_SECRET
  - CLOUDINARY_URL
```

### 10.2 Frontend (Vercel)
```
Directory: frontend/
Build: npm install && npm run build
Env Variables:
  - VITE_API_URL=https://api.yoursite.com
  - VITE_SUPABASE_URL
  - VITE_SUPABASE_ANON_KEY
  - VITE_RAZORPAY_KEY_ID
```

---

## 11. Sample Data (Seed)

### Brands
1. Urban Style
2. Classic Wear
3. Sport Elite
4. Minimalist

### Categories
- Men Tees
- Women Tees
- Hoodies
- Joggers
- Accessories

### Products (10 sample)
1. Classic White Tee - ₹499
2. Graphic Print Tee - ₹599
3. Striped Polo - ₹799
4. Oversized Hoodie - ₹1299
5. Zipper Hoodie - ₹1499
6. Comfort Joggers - ₹899
7. Slim Fit Joggers - ₹999
8. Classic Cap - ₹299
9. Minimalist Backpack - ₹1499
10. Cotton Socks Pack - ₹199

---

## 12. Environment Variables Template

### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb+srv://...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_KEY=xxx
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
VITE_RAZORPAY_KEY_ID=rzp_test_xxx
```
