# Walkthrough: Supabase Customer & Admin Authentication Integration

We have integrated full **Customer and Admin Authentication**, **PostgreSQL Database Storage**, **Row Level Security (RLS)**, and a dedicated **Admin Operations Dashboard** into the DroneVerse platform using Supabase.

---

## 1. What Has Been Built

### A. Database Schema & Migration (`supabase/schema.sql`)
A complete PostgreSQL migration script ready for execution in the Supabase SQL Editor:
- **`public.profiles`**: Linked to `auth.users` via foreign key `id`. Stores `full_name`, `phone`, `role` (`'customer'` or `'admin'`), `created_at`, `updated_at`.
- **`public.orders`**: Linked to `auth.users`. Stores `order_number`, `items` (JSONB), `total_amount`, `gst_amount`, `shipping_fee`, `status` (`'confirmed'`, `'processing'`, `'shipped'`, `'delivered'`, `'cancelled'`), `shipping_address` (JSONB), `tracking_number`, `courier`.
- **`public.wishlist`**: Stores `user_id` and `product_id` with unique constraint to prevent duplicate entries.
- **Row Level Security (RLS)**:
  - Enabled on `profiles`, `orders`, and `wishlist`.
  - Customers can only read and update their own records.
  - Admins have complete read/write access across all tables via the `public.is_admin()` Security Definer function.
- **`public.handle_new_user()` Trigger**:
  - Automatically triggered whenever a new user signs up in `auth.users`.
  - Seamlessly populates `public.profiles` with user metadata (`full_name`, `phone`) and sets role to `'customer'`.

---

### B. Core JavaScript Framework (`js/`)
1. **`js/supabase-config.js`**:
   - Exposes client-safe `window.SUPABASE_CONFIG` with Project URL and Publishable Anon Key (`sb_publishable_OYrzBndEI8AiRdykSOpNmA_3P0vMgwJ`).
2. **`js/supabase-client.js`**:
   - Initializes `window.supabaseClient` with `persistSession: true` and auto-token refresh using official Supabase v2 CDN.
3. **`js/auth.js`**:
   - `DroneVerseAuth.signIn(email, password)`: Authenticates user, refreshes session, and triggers role-based routing.
   - `DroneVerseAuth.signUp(email, password, fullName, phone)`: Registers customer with metadata.
   - `DroneVerseAuth.signOut()`: Clears active session and redirects appropriately.
   - `DroneVerseAuth.getProfile()`: Retrieves profile information with metadata fallback.
   - `DroneVerseAuth.getUserOrders()`: Queries authenticated customer's order history.
   - `DroneVerseAuth.createOrder()`: Creates new order in Supabase with items, tax, and address.
   - `DroneVerseAuth.requireAuth(redirect)`: Route guard for customer pages.
   - `DroneVerseAuth.requireAdmin(redirect)`: Route guard for admin pages.
   - `DroneVerseAuth.syncNavAuthUI()`: Updates top navigation and mobile dock across all pages to show logged-in customer name or admin badge.

---

### C. Customer Authentication Pages (`account/` & `checkout.html`)
- **`account/login.html`**:
  - Live Supabase email/password authentication.
  - Dynamic error alerts (invalid credentials, unconfirmed emails).
  - Role-based redirect: redirects `admin` to `../admin/index.html` and `customer` to `./orders.html`.
- **`account/register.html`**:
  - Registers new users with `full_name`, `phone`, `email`, and `password`.
  - Automatic redirect to order history or login upon completion.
- **`account/orders.html`**:
  - Profile header showing customer name, email, avatar initial, and role badge.
  - "Admin Panel" quick action button if logged-in user is an admin.
  - Order History list with order IDs, formatted dates, status badges, item thumbnails, tax breakdowns, and live shipment tracking links.
  - Clean empty state with call-to-action when no orders have been placed yet.
- **`checkout.html`**:
  - Integrated with `CartStore.getCart()`.
  - Calculates subtotal, 18% GST, and shipping.
  - Automatically places order into Supabase `orders` table via `DroneVerseAuth.createOrder()` when authenticated.
  - Clears cart and redirects to Order History on completion.

---

### D. Protected Admin Dashboard (`admin/` & `api/admin/`)
- **`admin/index.html` & `admin/orders.html`**:
  - Protected by `DroneVerseAuth.requireAdmin()`.
  - Top Metrics Cards: Total Orders, Gross Revenue (INR), Pending Dispatch, and Dispatched/Delivered orders.
  - Real-time Orders Table: Displays order ID, customer details, date, items, total amount, status badge, courier, and tracking codes.
  - Status Manager: Allows admin to update status (`confirmed`, `processing`, `shipped`, `delivered`, `cancelled`) and assign courier tracking codes.
  - Search & Filter bar: Search by order ID, customer name, email, or filter by status.
- **`api/admin/orders.js`**:
  - Vercel serverless API handler.
  - Validates `Authorization: Bearer <token>` against Supabase Auth.
  - Verifies user has `role === 'admin'`.
  - Serves aggregated store metrics and all customer orders securely.

---

## 2. Instructions to Finalize Setup

### Step 1: Run the Database Schema in Supabase (1-Click)
1. Open your Supabase Project Dashboard: [https://supabase.com/dashboard/project/xfyeupjlstfsxlccpltq](https://supabase.com/dashboard/project/xfyeupjlstfsxlccpltq)
2. Go to **SQL Editor** in the left sidebar (or navigate to `/sql/new`).
3. Open the file [`supabase/schema.sql`](file:///c:/Users/pc/Desktop/Drone%20Website/supabase/schema.sql) from your workspace.
4. Copy and paste the entire script into the SQL Editor and click **Run**.
5. All 3 tables (`profiles`, `orders`, `wishlist`), the RLS policies, and the `on_auth_user_created` trigger will be created immediately.

### Step 2: Make Your Account an Admin
1. Go to [`http://localhost:8080/account/register.html`](http://localhost:8080/account/register.html) (or on your live site) and sign up with your email.
2. Go back to Supabase **SQL Editor** and run:
```sql
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL@EXAMPLE.COM');
```
3. When you log in with that account, you will be automatically redirected to the **Admin Console** ([`admin/index.html`](file:///c:/Users/pc/Desktop/Drone%20Website/admin/index.html)).

### Step 3: Add Environment Variables in Vercel
Go to **Vercel Project Settings > Environment Variables** and add:
- `SUPABASE_URL` = `https://xfyeupjlstfsxlccpltq.supabase.co`
- `SUPABASE_ANON_KEY` = `sb_publishable_OYrzBndEI8AiRdykSOpNmA_3P0vMgwJ`
- `SUPABASE_SERVICE_ROLE_KEY` = *(Your secret service_role key from Supabase Dashboard > Project Settings > API)*

### Step 4: Push Commits to GitHub
All code has been committed to your local Git repository. Run the following command in your terminal to deploy live to Vercel:
```bash
git push origin main
```
