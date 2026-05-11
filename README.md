# Kalaah Studio — Full-Stack E-Commerce Platform

A modern, mobile-first e-commerce platform built for the Indian fashion market. Features a complete shopping experience with product browsing, cart management, wishlist, secure payments via Razorpay, and a full admin dashboard for store management.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19 + Vite (Pure CSS, no framework) |
| **Backend** | Node.js + Express.js |
| **Database** | MongoDB Atlas + Mongoose |
| **Authentication** | Supabase (JWT) |
| **Payments** | Razorpay |
| **Image Hosting** | Cloudinary |
| **Deployment** | Vercel (frontend) / Railway (backend) |

## Features

### Buyer Experience
- Product catalog with grid/listing view
- Advanced filtering — category, price range, size, brand, keyword search
- Sort options (newest, price, popularity)
- Product detail page with size selection, image gallery
- Shopping cart with coupon code support
- Wishlist for saving favourite items
- Secure checkout with Razorpay payment gateway
- Cash on Delivery option
- Order history and tracking
- Guest browsing → login → cart merge flow
- Mobile-responsive design

### Admin Panel
- Dashboard with sales stats, revenue, orders overview
- Product management — CRUD, stock tracking, image upload
- Brand management
- Order management — status updates, tracking
- Customer management with order history
- Coupon code management (percentage / fixed discounts)
- Shipping configuration
- Payment gateway settings

## Project Structure

```
E-commerce/
├── backend/                     # Express API server
│   ├── src/
│   │   ├── config/             # MongoDB, Supabase, Cloudinary, Razorpay configs
│   │   ├── controllers/        # Route handlers (auth, products, orders, etc.)
│   │   ├── middleware/         # Auth middleware, error handler
│   │   ├── models/             # Mongoose schemas (User, Product, Order, etc.)
│   │   └── routes/             # API route definitions
│   ├── server.js               # Entry point
│   ├── seed.js                 # Database seed script
│   └── package.json
│
├── frontend/                    # React SPA (Vite)
│   ├── src/
│   │   ├── components/         # Navbar, Footer, ProductCard, CartDrawer, etc.
│   │   ├── context/            # AuthContext, CartContext, WishlistContext
│   │   ├── pages/              # Home, Products, ProductDetail, Cart, Checkout, etc.
│   │   │   └── admin/          # Admin Dashboard, Products, Orders, Customers, Coupons, etc.
│   │   ├── lib/                # API client (Axios), Supabase client
│   │   ├── index.css           # Complete utility-class CSS (no Tailwind)
│   │   ├── App.jsx             # Root component with routing
│   │   └── main.jsx            # Vite entry
│   ├── index.html
│   └── package.json
│
└── SPEC.md                     # Full technical specification
```

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (or local MongoDB)
- Supabase account (for auth)
- Razorpay account (for payments)

### Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd E-commerce

# 2. Backend setup
cd backend
npm install
cp .env.example .env    # Fill in your environment variables
npm run seed             # Seed database with sample data
npm run dev              # Start dev server on port 5001

# 3. Frontend setup (new terminal)
cd frontend
npm install
npm run dev              # Start dev server on port 5173
```

### Environment Variables

**Backend** (`.env`):
```env
PORT=5001
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/shopkart
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

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:5001/api
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
VITE_RAZORPAY_KEY_ID=rzp_test_xxx
```

## API Overview

All API routes are prefixed with `/api`.

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/products` | List products (filters, search, pagination) |
| GET | `/products/featured` | Featured products |
| GET | `/products/categories` | Category list with counts |
| GET | `/products/slug/:slug` | Product detail by slug |
| GET | `/brands` | All brands |

### Authenticated (requires JWT)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Register |
| POST | `/auth/login` | Login |
| GET | `/cart` | Get cart |
| POST | `/cart/items` | Add to cart |
| GET | `/orders` | User orders |
| POST | `/orders` | Create order |
| GET | `/wishlist` | Get wishlist |

### Admin (requires admin role)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/dashboard/stats` | Sales & analytics |
| GET | `/admin/products` | All products |
| POST | `/admin/products` | Create product |
| GET | `/admin/orders` | All orders |
| PUT | `/admin/orders/:id/status` | Update order status |
| GET | `/admin/customers` | All customers |
| GET | `/admin/coupons` | All coupons |
| POST | `/admin/coupons` | Create coupon |

## Sample Data

Run `npm run seed` in the backend to populate:
- **4 Brands** — Urban Style, Classic Wear, Sport Elite, Minimalist
- **33 Products** across 5 categories (Men's Tees, Women's Tees, Hoodies, Joggers, Accessories)
- **3 Coupons** — WELCOME10, FLAT200, SAVE20
- **Shipping config** — Free shipping above ₹999

---

Built by **Divanshiv**
