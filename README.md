# 🌊 MoveFlow

### Visual Transaction Builder for Movement Blockchain

> **TL;DR**: MoveFlow lets developers interact with any Move smart contract through a visual interface instead of writing JSON payloads or CLI commands. Build → Simulate → Execute → Track, all in one place.

---

## 📋 Table of Contents
- [What is MoveFlow?](#-what-is-moveflow)
- [Why We Built This](#-why-we-built-this)
- [Key Features](#-key-features)
- [How It Works](#-how-it-works)
- [Built-in vs Custom Contracts](#-built-in-vs-custom-contracts)
- [Installation](#-installation)
- [Usage Guide](#-usage-guide)
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
Interacting with Move smart contracts currently requires knowing exact module addresses, constructing complex payloads manually, or using CLI tools that aren't beginner-friendly. There's often no preview of what a transaction will actually do until you spend gas.

### Our Solution
MoveFlow provides a **point-and-click interface** where you:
- Select from popular contracts OR enter any custom contract
- Fill in parameters with helpful placeholders and type hints
- **Simulate for free** to see gas costs and state changes
- Execute only when you're confident
- Track everything in a clean receipt history

---

## ✨ Key Features

### 1. 🏗️ Visual Transaction Builder
Build transactions visually without writing scripts. The interface adapts to your input, ensuring you provide the correct data types.

### 2. ⚡ Transaction Simulation
Before spending any gas, verify your transaction. MoveFlow runs a full simulation on the Movement testnet to show you:
- Success/Failure status
- Estimated gas cost
- Exact on-chain state changes
- Emitted events

### 3. 💾 Saved Flows
Save your frequently used transactions as "Flows". Name them (e.g., "Daily Token Transfer"), save them locally, and reload them anytime with a single click.

### 4. 🧾 Transaction Receipts
Keep a permanent record of your activity. Every executed transaction generates a detailed receipt showing the hash, status, gas used, and all parameter details.

### 5. 🔐 Wallet Integration
Seamlessly connect with **Nightly** or **Razor** wallets. MoveFlow detects your installed wallets and handles secure signing.

---

## 🔄 How It Works

1. **Select**: Choose a built-in contract or enter a custom one.
2. **Configure**: Fill in the function parameters.
3. **Simulate**: Run a check to see gas costs and state changes.
4. **Execute**: Sign with your wallet to send it to the blockchain.
5. **Track**: View the receipt and history.

---

## 🏛️ Built-in vs Custom Contracts

MoveFlow is designed to work with **ANY** smart contract on the Movement network.

### Built-in Contracts
We provide quick access to common essential modules:
- **Coin Transfer** (`0x1::coin`)
- **Account Management** (`0x1::account`)
- **Move Account** (`0x1::aptos_account`)

### Custom Contracts
You can interact with your own deployed contracts or any other contract on the network. Just provide:
- **Module Address** (where the contract lives)
- **Module Name**
- **Function Name**
- **Parameters**

---

## 🚀 Installation

### Prerequisites
- Node.js installed
- A Movement-compatible wallet browser extension (Nightly or Razor)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Madhav-Gupta-28/MoveFlow.git
   ```

2. **Install dependencies**
   ```bash
   cd MoveFlow/moveflow
   npm install
   ```

3. **Start the app**
   ```bash
   npm run dev
   ```

4. Open `http://localhost:3000` in your browser.

---

## 📖 Usage Guide

### 1. Connect Wallet
Click "Connect Wallet" on the top right and select your installed wallet extension.

### 2. Create Transaction
Go to the "Create" page. Choose "Built-in Contracts" for standard actions or "Custom Contract" to explore other modules.

### 3. Simulate & Execute
Fill in the details and hit "Simulate". If everything looks good (green success status), click "Execute" to sign the transaction.

### 4. Save & Reuse
Click "Save as Flow" on any transaction you've built to save it for later.

---

## 🗺️ Future Roadmap

- **ABI Fetching**: Auto-populate function names and parameters from the blockchain.
- **Parameter Validation**: Smarter hints and error checking for inputs.
- **Batch Transactions**: Execute multiple actions in one go.
- **Mainnet Support**: Launch on Movement Mainnet.

---

## 👨‍💻 Team

**Built by**: Madhav Gupta

---

## 📄 License

MIT License - feel free to fork and build upon this!

---

<div align="center">

### Built for the Movement Blockchain Hackathon 🚀
**MoveFlow - Making Move transactions visual and accessible**

</div>
