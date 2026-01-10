# Arena Triumph

A responsive web application for the Arena Triumph game built with Next.js and Supabase.

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://yedigxapzhksxrhuzhhe.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_tXC7cBdyrvBBxxxP-INUrg_BDPZfNQ3
```

These values can be found in the `db.env` file.

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production

```bash
npm run build
npm start
```

## Features

- **Authentication**: Supabase user authentication with email/password
- **Protected Routes**: Middleware-based route protection
- **Navigation**: 5 main navigation pages:
  - Battle
  - Obtain Gear
  - Manage Inventory
  - Inspect
  - Settings
- **Modern UI**: Tailwind CSS with rounded edges and shadows
- **Responsive Design**: Mobile-first approach

## Project Structure

- `app/` - Next.js App Router pages and layouts
- `components/` - React components
- `lib/` - Utility functions and Supabase clients
- `middleware.ts` - Route protection middleware

Codebase for the Arena Triumph game.