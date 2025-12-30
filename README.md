# 🌊 MoveFlow

### Visual Transaction Builder for Movement Blockchain

> **TL;DR**: MoveFlow lets developers interact with any Move smart contract through a visual interface instead of writing JSON payloads or CLI commands. Build → Simulate → Execute → Track, all in one place.

---

## 📋 Table of Contents
- [What is MoveFlow?](#-what-is-moveflow)
- [Why We Built This](#-why-we-built-this)
- [Live Demo](#-live-demo)
- [Key Features](#-key-features)
- [Technical Deep Dive](#-technical-deep-dive)
- [How It Works](#-how-it-works)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation)
- [Usage Guide](#-usage-guide)
- [Smart Contract Integration](#-smart-contract-integration)
- [Future Roadmap](#-future-roadmap)

---

## 🎯 What is MoveFlow?

MoveFlow is a **visual transaction builder** that makes it easy to interact with smart contracts deployed on Movement blockchain. Think of it as a "Postman for blockchain" - but instead of testing APIs, you're building and testing blockchain transactions.

### In Simple Terms:
| Before MoveFlow | With MoveFlow |
|-----------------|---------------|
| Write JSON payloads manually | Click and fill forms |
| Hope your transaction works | Simulate first, see exactly what happens |
| Lose track of past transactions | Full history with human-readable receipts |
| Start from scratch every time | Save templates and reuse them |

---

## 💡 Why We Built This

### The Problem
Interacting with Move smart contracts currently requires:

1. **Knowing exact module addresses** - Like `0x1::coin::transfer`
2. **Constructing JSON payloads** - Getting the format exactly right
3. **Using CLI tools** - Not beginner-friendly
4. **No preview** - You don't know if your transaction will succeed until you pay gas

This creates a steep learning curve and slows down development.

### Our Solution
MoveFlow provides a **point-and-click interface** where you:
- Select from popular contracts OR enter any custom contract
- Fill in parameters with helpful placeholders and type hints
- **Simulate for free** to see gas costs and state changes
- Execute only when you're confident
- Track everything in a clean receipt history

---

## 🎬 Live Demo

**Deployed URL**: [Coming Soon / Add your Vercel URL]

**Video Walkthrough**: [Link to demo video]

---

## ✨ Key Features

### 1. 🏗️ Visual Transaction Builder

**Two Modes:**
- **Built-in Contracts**: Quick access to common modules (`0x1::coin`, `0x1::account`, `0x1::aptos_account`)
- **Custom Contracts**: Interact with ANY deployed Move contract

**What you can do:**
- Select module and function from dropdowns
- Add parameters with correct types (address, u64, u128, bool, string, vector<u8>)
- Add type arguments for generic functions
- Dynamic form that adapts to what you select

### 2. ⚡ Transaction Simulation

Before spending any gas, you can simulate to see:
- ✅ Will it succeed or fail?
- 💰 Estimated gas cost
- 📝 State changes (what data will change on-chain)
- 📢 Events that will be emitted
- ❌ Error messages if something's wrong

**How it works technically:**
```
Your Input → Build Payload → Send to Movement RPC → Parse Response → Show Results
```

### 3. 💾 Saved Flows

Save any transaction as a reusable "Flow":
- Give it a name (e.g., "Daily Token Transfer")
- Load it anytime with one click
- Smart detection: Custom contract flows open in Custom mode automatically
- Stored in localStorage (no backend needed)

### 4. 🧾 Transaction Receipts

After execution, every transaction is saved with:
- Transaction hash (clickable to explorer)
- Status (Success/Failed with color coding)
- Gas used
- Timestamp
- Full parameter details
- State changes

### 5. 🔐 Wallet Integration

Connect any Movement-compatible wallet:
- **Nightly Wallet**
- **Razor Wallet**
- Auto-detection of installed wallets
- Secure client-side signing

---

## 🔬 Technical Deep Dive

### How Transaction Building Works

**Step 1: User Input**
```typescript
// User selects or enters:
{
  module: "0x1::coin",           // Contract address::module
  function: "transfer",          // Function name
  typeArguments: ["0x1::aptos_coin::AptosCoin"], // Generic types
  parameters: {
    to: "0xabc...123",           // Recipient address
    amount: "1000000"            // Amount (in smallest unit)
  }
}
```

**Step 2: Build Transaction Payload**
```typescript
// We construct the Move function call:
const payload = {
  function: `${module}::${functionName}`,
  typeArguments: ["0x1::aptos_coin::AptosCoin"],
  functionArguments: ["0xabc...123", 1000000]
};
```

**Step 3: Simulate via API**
```typescript
// Server-side simulation using Aptos SDK:
const transaction = await aptos.transaction.build.simple({
  sender: accountAddress,
  data: {
    function: payload.function,
    typeArguments: payload.typeArguments,
    functionArguments: payload.functionArguments,
  },
});

const [simulation] = await aptos.transaction.simulate.simple({
  signerPublicKey: publicKey,
  transaction,
});
```

**Step 4: Decode & Display**
```typescript
// Parse simulation response:
{
  success: true,
  gasUsed: "1234",
  vmStatus: "Executed successfully",
  changes: [...stateChanges],
  events: [...emittedEvents]
}
```

**Step 5: Execute (if user confirms)**
```typescript
// Sign and submit via wallet:
const response = await signAndSubmitTransaction({
  data: {
    function: payload.function,
    typeArguments: payload.typeArguments,
    functionArguments: payload.functionArguments,
  },
});
// Save receipt to localStorage
```

### The Simulation API (`/api/simulate`)

This is the core technical component. Here's what it does:

```typescript
// POST /api/simulate
// Request body:
{
  moduleAddress: "0x1",
  moduleName: "coin",
  functionName: "transfer",
  typeArguments: ["0x1::aptos_coin::AptosCoin"],
  args: [
    { type: "address", value: "0xabc...123" },
    { type: "u64", value: "1000000" }
  ],
  signerAddress: "0xdef...456"
}

// Response:
{
  success: true,
  result: {
    success: true,
    vmStatus: "Executed successfully",
    gasUsed: "1234",
    changes: [...],
    events: [...]
  }
}
```

**Key Technical Decisions:**
1. **Server-side simulation**: Required because we need to use the Aptos SDK to build transactions, which needs a public key derivation
2. **Type argument passthrough**: Generic Move functions need type arguments; we parse and forward them
3. **Error handling**: We catch and decode VM errors to show human-readable messages

---

## 🔄 How It Works

```
┌──────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│   │   SELECT    │───►│   ENTER     │───►│  SIMULATE   │         │
│   │   MODULE    │    │  PARAMETERS │    │ TRANSACTION │         │
│   └─────────────┘    └─────────────┘    └──────┬──────┘         │
│                                                 │                 │
│                                                 ▼                 │
│                                    ┌────────────────────┐        │
│                                    │ Preview Gas, State │        │
│                                    │ Changes, Events    │        │
│                                    └─────────┬──────────┘        │
│                                              │                    │
│                      ┌───────────────────────┴──────────────┐    │
│                      ▼                                      ▼    │
│            ┌─────────────────┐                   ┌──────────────┐│
│            │  SAVE AS FLOW   │                   │   EXECUTE    ││
│            │  (for reuse)    │                   │  (on-chain)  ││
│            └─────────────────┘                   └──────┬───────┘│
│                                                         │        │
│                                                         ▼        │
│                                              ┌──────────────────┐│
│                                              │ RECEIPT SAVED    ││
│                                              │ (with tx hash)   ││
│                                              └──────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

---

## 🏛️ Architecture

### Project Structure

```
moveflow/
├── app/                              # Next.js App Router (Pages)
│   ├── api/
│   │   └── simulate/
│   │       └── route.ts             # ⭐ Simulation API endpoint
│   │
│   ├── create/
│   │   └── page.tsx                 # ⭐ Main transaction builder (1400+ lines)
│   │
│   ├── flows/
│   │   └── page.tsx                 # Saved flows library
│   │
│   ├── receipts/
│   │   └── page.tsx                 # Transaction history
│   │
│   ├── layout.tsx                   # App shell with sidebar
│   ├── page.tsx                     # Landing page
│   └── globals.css                  # Design system (CSS variables)
│
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx              # Navigation with active indicators
│   │   └── Topbar.tsx               # Header with network badge
│   │
│   ├── wallet/
│   │   ├── WalletButton.tsx         # Connect/disconnect UI
│   │   ├── WalletModal.tsx          # Wallet selection dialog
│   │   └── WalletProvider.tsx       # Aptos wallet adapter setup
│   │
│   ├── ui/                          # 49 shadcn/ui components
│   └── providers.tsx                # React Query + Wallet providers
│
├── lib/
│   └── utils.ts                     # Helper functions (cn for classnames)
│
└── hooks/                           # Custom React hooks
```

### Key Files Explained

| File | Purpose | Lines |
|------|---------|-------|
| `app/create/page.tsx` | Main transaction builder UI | ~1400 |
| `app/api/simulate/route.ts` | Transaction simulation backend | ~150 |
| `app/receipts/page.tsx` | Transaction history with modals | ~500 |
| `app/flows/page.tsx` | Saved templates library | ~250 |
| `app/globals.css` | Design tokens and animations | ~380 |

---

## 🛠️ Tech Stack

| Layer | Technology | Why We Chose It |
|-------|------------|-----------------|
| **Framework** | Next.js 15 (App Router) | Server components, API routes, great DX |
| **Language** | TypeScript | Type safety for blockchain data |
| **Styling** | Tailwind CSS | Rapid UI development |
| **Components** | shadcn/ui | Beautiful, accessible, customizable |
| **Blockchain SDK** | @aptos-labs/ts-sdk | Official SDK for Move transactions |
| **Wallet** | @aptos-labs/wallet-adapter-react | Industry standard wallet connection |
| **State** | React hooks + localStorage | Simple, no backend needed |
| **Icons** | Lucide React | Consistent, lightweight icons |

### Movement Network Config

```typescript
const MOVEMENT_TESTNET = {
  name: "Movement Porto Testnet",
  rpcUrl: "https://aptos.testnet.porto.movementlabs.xyz/v1",
  explorerUrl: "https://explorer.movementnetwork.xyz",
  chainId: 177
};
```

---

## 🚀 Installation

### Prerequisites
- Node.js 18.17+
- npm, yarn, or bun
- A Movement-compatible wallet browser extension

### Setup

```bash
# Clone repository
git clone https://github.com/Madhav-Gupta-28/MoveFlow.git
cd MoveFlow/moveflow

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000`

### Build for Production

```bash
npm run build
npm start
```

---

## 📖 Usage Guide

### Connecting Your Wallet

1. Click **"Connect Wallet"** in the top right
2. Select your installed wallet (Nightly, Razor, etc.)
3. Approve the connection in your wallet extension
4. You'll see your address displayed

### Building a Transaction (Built-in)

1. Go to **Create Transaction**
2. Select **Built-in Contracts** tab
3. Choose a module (e.g., `0x1::coin`)
4. Choose a function (e.g., `transfer`)
5. Fill in parameters with correct types
6. Click **Simulate Transaction**
7. Review gas cost and changes
8. Click **Execute on Movement Testnet**

### Building a Transaction (Custom Contract)

1. Go to **Create Transaction**
2. Select **Custom Contract** tab
3. Enter:
   - Module Address: `0x123...abc`
   - Module Name: `my_module`
   - Function Name: `my_function`
   - Type Arguments: (if generic)
4. Add parameters with name, type, and value
5. Simulate and execute as above

### Saving a Flow

1. Build your transaction
2. Click **Save as Flow**
3. Give it a descriptive name
4. Find it in the **Saved Flows** page
5. Click **Load** to reuse anytime

---

## 🔗 Smart Contract Integration

MoveFlow works with ANY Move smart contract on Movement. Here's how:

### Built-in Contracts
We provide quick access to common modules:
- `0x1::coin` - Token transfers
- `0x1::account` - Account management
- `0x1::aptos_account` - Movement account functions

### Custom Contracts
For your own contracts, you need:
1. **Module Address**: Where your contract is deployed (e.g., `0xabc123...`)
2. **Module Name**: The module name in your Move code
3. **Function Name**: The entry function to call
4. **Type Arguments**: For generic functions
5. **Parameters**: Function arguments with correct types

**Supported Parameter Types:**
- `address` - 64-character hex address
- `u64` - Unsigned 64-bit integer
- `u128` - Unsigned 128-bit integer
- `bool` - true/false
- `string` - UTF-8 string
- `vector<u8>` - Byte array

---

## 🗺️ Future Roadmap

### ✅ Phase 1 - Core Features (Complete)
- [x] Visual transaction builder
- [x] Transaction simulation
- [x] Built-in contract support
- [x] Custom contract support
- [x] Saved flows
- [x] Transaction receipts
- [x] Wallet integration (Nightly, Razor)

### 🔄 Phase 2 - Enhanced UX (Planned)
- [ ] ABI fetching - Auto-populate function signatures
- [ ] Parameter validation suggestions
- [ ] Recent contracts quick-access
- [ ] Mobile responsive improvements

### 🚀 Phase 3 - Advanced Features (Future)
- [ ] Batch transactions (execute multiple in one)
- [ ] Transaction scheduling
- [ ] Team collaboration
- [ ] Mainnet support

---

## 👨‍💻 Team

**Built by**: Madhav Gupta

---

## 📄 License

MIT License - feel free to fork and build upon this!

---

## 🙏 Acknowledgments

- **Movement Labs** - For the amazing blockchain infrastructure
- **Aptos Labs** - For the SDK and wallet adapter
- **shadcn** - For the beautiful UI components

---

<div align="center">

### Built for the Movement Blockchain Hackathon 🚀

**MoveFlow - Making Move transactions visual and accessible**

</div>
