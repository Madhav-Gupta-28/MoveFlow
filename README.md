# MoveFlow - Visual Transaction Builder for Movement

A visual transaction builder and simulator for the Movement blockchain. Build, simulate, and execute Move transactions with ease.

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm or yarn package manager

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd movement-flow-studio

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the production application
- `npm start` - Start the production server
- `npm run lint` - Run ESLint to check code quality

## Tech Stack

This project is built with:

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **React 18** - UI library
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Re-usable component library
- **TanStack Query** - Data fetching and caching
- **Lucide React** - Icon library

## Project Structure

```
movement-flow-studio/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Dashboard page (/)
│   ├── create/            # Create transaction page
│   ├── flows/             # Saved flows page
│   ├── receipts/          # Receipts page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── layout/           # Layout components
├── lib/                  # Utility functions
├── hooks/                # Custom React hooks
└── public/               # Static assets
```

## Features

- **Visual Transaction Builder** - Build Move transactions with an intuitive UI
- **Transaction Simulation** - Test transactions before execution
- **Saved Flows** - Create reusable transaction templates
- **Execution History** - View human-readable transaction receipts
- **Dark Mode** - Developer-friendly dark theme

## Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new).

Check out the [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
