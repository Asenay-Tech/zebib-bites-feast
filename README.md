# 🚀 Zebib Foods – Restaurant Website

A modern, multilingual restaurant website built with React, TypeScript, and Supabase.

## ✨ Features

- 🌍 Multilingual support (English/German)
- 🍽️ Dynamic menu management
- 📅 Table reservations
- 🛒 Online ordering with Stripe payment integration
- 👤 User authentication
- 📱 Fully responsive design
- 🎨 Dark theme with elegant design system

## 🏗️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Supabase (Database, Auth, Storage, Edge Functions)
- **Payment**: Stripe
- **Routing**: React Router v6
- **Forms**: React Hook Form with Zod validation
- **Date Handling**: date-fns

---

## 📋 Menu System Architecture

### Single Source of Truth

The menu data is centralized using a shared hook at `src/hooks/useMenuData.tsx`. This ensures **exact consistency** between the Homepage Menu and Order page.

**Key Components:**

1. **`useMenuData` Hook** - Central data fetching
   - Fetches menu items from `menu_items` table
   - Fetches category settings from `category_settings` table
   - Sets up real-time subscriptions for live updates
   - Returns: `menuItems`, `categories`, `categorySettings`, `loading`, `error`

2. **Helper Functions** - Exported utilities
   - `getItemImageSrc(item)` - Constructs correct image URLs
   - `formatPrice(price)` - Consistent EUR price formatting
   - `getItemVariants(price)` - Extracts size/variant options
   - `shouldShowImages(category, items, settings)` - Determines image display logic

3. **Usage Across Pages:**
   - **Homepage Menu** (`src/components/sections/Menu.tsx`) - Public display
   - **Order Page** (`src/pages/Order.tsx`) - Interactive ordering with cart

### Category Image Settings

Each category has a `show_image` flag in `category_settings`:
- `true` (default): Card layout with images
- `false`: Clean list layout without images

**Display Rules:**
- When `show_image=false`, images are hidden for all items in that category
- Layout automatically switches between card grid and list view
- Both pages respect these settings identically

### Price Handling

Prices support multiple formats:
- **Simple**: `15.90` (single price)
- **Variants**: `{"Small": 12.90, "Large": 18.90}` (multiple sizes)

All prices are formatted using European format (comma as decimal separator).

---

## 📦 Project Structure

```
src/
├── components/
│   ├── admin/          # Admin panel components
│   ├── navigation/     # Header, footer
│   ├── sections/       # Page sections (Hero, Menu, Reviews, etc.)
│   └── ui/            # Reusable UI components (shadcn)
├── hooks/
│   └── useMenuData.tsx # ⭐ Shared menu data hook
├── pages/
│   ├── admin/         # Admin pages
│   ├── Index.tsx      # Homepage
│   ├── Order.tsx      # Online ordering
│   ├── Reserve.tsx    # Table reservations
│   ├── Privacy.tsx    # Privacy policy
│   └── Imprint.tsx    # Legal imprint
├── lib/               # Utility functions
└── integrations/      # Supabase client & types
```

---

## 🔧 Environment Variables

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_SUPABASE_PROJECT_ID=your_project_id
```

---

## 🚀 Deployment Workflow

### 1. Make Changes Locally

```bash
git checkout main
# edit your code...
git add -A
git commit -m "Describe what you changed"
git push origin main
```

### 2. Build and Deploy

```bash
# After pushing to main, run:
./deploy.sh
```

---

## 🗂️ Project File Structure

```
├── public/
├── src/
├── deploy-support/
│   └── .htaccess      # needed for routing on Hostinger
├── dist/              # generated after build
├── deploy.sh          # auto-deploy script
└── README.md
```

---

## 🆕 First-Time Setup

For new team members:

```bash
# Clone the repo
git clone https://github.com/Asenay-Tech/zebib-bites-feast.git
cd zebib-bites-feast

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Make sure you have `deploy-support/.htaccess` and `deploy.sh`.

---

## 📋 Requirements

- Node.js + npm
- Git
- Bash (for running `deploy.sh`)

---

## 🌐 Hosting

We deploy using **Hostinger Git Integration** with a webhook tied to the `deploy` branch. All files in `dist/` are synced to `public_html/`.

---

## 📞 Contact

**Zebib Foods**
- Address: Dettinger Str. 2, 63450 Hanau, Germany
- Email: ale@zebibfood.de
- Phone: +49 177 4629585

---

## 📄 License

© 2025 Zebib Foods. All rights reserved.
