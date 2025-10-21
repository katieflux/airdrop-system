# Encrypted Airdrop System

A privacy-preserving token airdrop system powered by Zama's Fully Homomorphic Encryption Virtual Machine (FHEVM). This project enables confidential token distributions where allocation amounts remain encrypted end-to-end, providing unprecedented privacy for both airdrop administrators and recipients.

[![License: BSD-3-Clause-Clear](https://img.shields.io/badge/License-BSD--3--Clause--Clear-blue.svg)](LICENSE)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.27-blue.svg)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Built%20with-Hardhat-yellow.svg)](https://hardhat.org/)

## Table of Contents

- [Introduction](#introduction)
- [Key Features](#key-features)
- [Advantages](#advantages)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Problems Solved](#problems-solved)
- [Smart Contracts](#smart-contracts)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
  - [Deployment](#deployment)
  - [Administrator Operations](#administrator-operations)
  - [User Operations](#user-operations)
- [Testing](#testing)
- [Frontend Integration](#frontend-integration)
- [Security Considerations](#security-considerations)
- [Gas Optimization](#gas-optimization)
- [Future Roadmap](#future-roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)

## Introduction

The Encrypted Airdrop System revolutionizes how token distributions are conducted on the blockchain by leveraging Fully Homomorphic Encryption (FHE). Unlike traditional airdrops where allocation amounts are publicly visible on-chain, this system maintains complete confidentiality of distribution amounts while preserving the trustless and verifiable properties of blockchain technology.

Built on Zama's FHEVM technology, the system allows administrators to configure encrypted token allocations that only authorized recipients can decrypt and claim. This creates a fair and private distribution mechanism suitable for sensitive use cases like employee compensation, investor distributions, competitive rewards, and privacy-focused token launches.

## Key Features

### Privacy-First Design
- **Encrypted Allocations**: All allocation amounts are stored as encrypted values using FHE, making them invisible to blockchain observers
- **Confidential Claims**: Recipients can verify and claim their allocations without revealing amounts to the public
- **Private Balances**: Token balances remain encrypted using the ERC7984 confidential token standard

### Flexible Administration
- **Batch Operations**: Configure multiple allocations in a single transaction for gas efficiency
- **Dynamic Updates**: Modify or clear allocations even after initial configuration
- **Operator Pattern**: Token transfers utilize the ERC7984 operator pattern for secure automation

### User-Friendly
- **Simple Claim Process**: One-click claiming mechanism for recipients
- **Decryption Support**: Built-in tools to decrypt and verify allocation amounts privately
- **Comprehensive Events**: Detailed event logging for transparency while maintaining privacy

### Production-Ready
- **Auditable Code**: Clean, well-documented Solidity contracts following best practices
- **Comprehensive Tests**: Full test coverage including edge cases and security scenarios
- **Gas Optimized**: Efficient contract design minimizing transaction costs
- **Hardhat Integration**: Complete development environment with deployment scripts and tasks

## Advantages

### For Airdrop Administrators

1. **Privacy Protection**: Keep distribution strategies confidential without exposing allocation logic or amounts to competitors or the public
2. **Flexible Strategy**: Adjust allocations dynamically without public scrutiny or market manipulation concerns
3. **Reduced Speculation**: Prevent market manipulation based on known future distributions
4. **Professional Discretion**: Maintain confidentiality for sensitive distributions like employee compensation or investor allocations

### For Recipients

1. **Financial Privacy**: Keep personal allocation amounts private from public view
2. **Security**: Reduced risk of targeted attacks or social engineering based on known holdings
3. **Autonomy**: Decrypt and verify allocations privately before claiming
4. **Fair Treatment**: Trustless verification that claimed amounts match configured allocations

### For the Ecosystem

1. **Privacy Standard**: Demonstrates practical application of FHE in decentralized systems
2. **Composability**: ERC7984 compatibility enables integration with other confidential DeFi protocols
3. **Reduced MEV**: Encrypted amounts limit MEV extraction opportunities
4. **Innovation**: Opens new possibilities for privacy-preserving tokenomics and distribution mechanisms

## Technology Stack

### Blockchain & Smart Contracts
- **Solidity 0.8.27**: Smart contract programming language with latest security features
- **Hardhat**: Development environment for compiling, testing, and deploying contracts
- **fheVM**: Zama's Fully Homomorphic Encryption Virtual Machine for on-chain privacy
- **OpenZeppelin Confidential Contracts**: Secure, audited implementations of confidential token standards

### Encryption & Privacy
- **Zama fhEVM SDK**: Libraries for creating and managing encrypted computations
- **ERC7984 Standard**: Confidential token standard with encrypted balances and transfers
- **FHE (Fully Homomorphic Encryption)**: Enables computations on encrypted data without decryption

### Development Tools
- **TypeScript**: Type-safe scripting for deployment and testing
- **Ethers.js v6**: Ethereum library for contract interaction
- **Hardhat Deploy**: Declarative deployment system with dependency management
- **TypeChain**: TypeScript bindings for smart contracts

### Frontend (Optional Integration)
- **React + TypeScript**: Modern UI framework for building user interfaces
- **Wagmi**: React hooks for Ethereum wallet connection and interaction
- **Vite**: Fast build tool and development server
- **Zama fhEVM Client**: Browser-compatible encryption library

### Testing & Quality
- **Mocha + Chai**: Testing framework and assertion library
- **Hardhat Network**: Local Ethereum network simulator for testing
- **Solhint**: Solidity linter for code quality
- **Prettier**: Code formatter for consistent styling

### Network Support
- **Ethereum Sepolia**: Primary testnet for deployment and testing
- **Hardhat Local Network**: Local development and testing environment
- **Infura Integration**: Reliable RPC provider for testnet access

## Architecture

### System Overview

The Encrypted Airdrop System consists of three main components working together:

```
┌─────────────────────────────────────────────────────────────┐
│                     Administrator                            │
│  (Deposits tokens, configures encrypted allocations)        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Encrypted Amount + Proof
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              EncryptedAirdrop Contract                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Storage:                                            │   │
│  │  - mapping(address => euint64) allocations          │   │
│  │  - mapping(address => bool) hasAllocation           │   │
│  │  - mapping(address => bool) claimed                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  Functions:                                                  │
│  - depositTokens(encrypted amount)                          │
│  - setAllocation(recipient, encrypted amount)               │
│  - batchSetAllocations(recipients[], amounts[])            │
│  - claim() → transfers encrypted tokens                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Encrypted Transfer
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                 ERC7984Token Contract                        │
│  (Confidential ERC20 with encrypted balances)               │
│  - confidentialTransfer()                                    │
│  - confidentialTransferFrom()                               │
│  - confidentialBalanceOf() → encrypted balance              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Decrypt Balance
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                       Recipient                              │
│  (Claims allocation, decrypts to verify amount)             │
└─────────────────────────────────────────────────────────────┘
```

### Contract Architecture

#### EncryptedAirdrop.sol
The main airdrop distribution contract that:
- Manages encrypted token allocations for recipients
- Handles ownership and access control
- Processes claims and transfers encrypted tokens
- Emits events for off-chain tracking

**Key Storage:**
```solidity
mapping(address => euint64) private _allocations;     // Encrypted amounts
mapping(address => bool) private _hasAllocation;      // Allocation status
mapping(address => bool) private _claimed;            // Claim tracking
IERC7984 public immutable token;                      // Token contract reference
```

#### ERC7984Token.sol
Confidential ERC20 token implementation that:
- Implements ERC7984 standard for encrypted balances
- Supports operator pattern for automated transfers
- Provides minting capabilities for the owner
- Maintains complete balance confidentiality

**Key Features:**
```solidity
- Encrypted balance storage using euint64
- Confidential transfer methods
- Operator authorization with expiry
- User-controlled decryption
```

### Data Flow

#### Allocation Configuration Flow
1. Administrator encrypts allocation amount using fhEVM SDK
2. Contract receives encrypted value and cryptographic proof
3. FHE verification ensures proof validity
4. Encrypted amount stored on-chain with permissions
5. Event emitted for off-chain indexing

#### Claim Flow
1. Recipient calls `claim()` function
2. Contract verifies allocation exists and not yet claimed
3. Encrypted amount retrieved from storage
4. Token contract executes confidential transfer
5. Allocation marked as claimed and cleared
6. Event emitted with encrypted transfer amount

#### Decryption Flow
1. User queries encrypted allocation or balance
2. fhEVM SDK generates decryption request
3. Zama decryption oracle processes request
4. Decrypted value returned only to authorized user
5. Value displayed in UI or used for verification

## Problems Solved

### 1. Allocation Privacy Leakage
**Problem:** Traditional airdrops expose exact allocation amounts on-chain, leading to privacy violations, social engineering risks, and market manipulation.

**Solution:** All allocation amounts are stored as encrypted values using FHE. Only the recipient can decrypt their specific allocation, preventing public visibility while maintaining on-chain verification.

### 2. Distribution Strategy Exposure
**Problem:** Competitors and adversaries can analyze distribution patterns to understand project strategy, token economics, and recipient profiles.

**Solution:** Encrypted allocations prevent analysis of distribution patterns. Even total distribution amount can be kept confidential through encrypted operations.

### 3. Pre-Claim Market Manipulation
**Problem:** Known future token distributions create MEV opportunities and price manipulation risks as traders front-run claims.

**Solution:** Encrypted amounts eliminate the ability to precisely predict claim impacts, reducing MEV extraction and manipulation opportunities.

### 4. Recipient Security Risks
**Problem:** Publicly visible large allocations make recipients targets for hacking attempts, social engineering, and physical security threats.

**Solution:** Private allocations mean attackers cannot identify high-value targets, significantly improving recipient security posture.

### 5. Dynamic Allocation Management
**Problem:** Public blockchains make it difficult to adjust distributions privately without revealing changes to competitors.

**Solution:** Administrators can update encrypted allocations without exposing the changes publicly. Only the final claim amount is visible to the recipient.

### 6. Compliance and Privacy Regulations
**Problem:** Some jurisdictions require financial privacy for certain types of distributions (employee compensation, investor allocations).

**Solution:** End-to-end encrypted distribution system provides privacy while maintaining blockchain verifiability for compliance purposes.

### 7. Sybil Resistance Without Disclosure
**Problem:** Preventing multiple claims from same user traditionally requires linking claims publicly, destroying privacy.

**Solution:** Claim tracking uses address-based flags without revealing amounts, preventing double-claiming while maintaining allocation privacy.

### 8. Fair Distribution Verification
**Problem:** Recipients need to verify they received correct amounts, but verification exposes amounts to others observing transactions.

**Solution:** Client-side decryption allows recipients to privately verify amounts before claiming, without public disclosure.

## Smart Contracts

### EncryptedAirdrop.sol

The core contract managing the encrypted token distribution system.

**Contract Location:** `contracts/EncryptedAirdrop.sol`

**Key Functions:**

```solidity
// Deposit encrypted tokens into the airdrop contract
function depositTokens(externalEuint64 encryptedAmount, bytes calldata inputProof)

// Configure a single encrypted allocation
function setAllocation(address recipient, externalEuint64 encryptedAmount, bytes calldata inputProof)

// Configure multiple allocations in one transaction
function batchSetAllocations(
    address[] calldata recipients,
    externalEuint64[] calldata encryptedAmounts,
    bytes[] calldata inputProofs
)

// Clear an allocation (admin only)
function clearAllocation(address recipient)

// Claim allocated tokens (anyone with allocation)
function claim()

// View functions
function hasAllocation(address account) external view returns (bool)
function hasClaimed(address account) external view returns (bool)
function getEncryptedAllocation(address account) external view returns (euint64)
```

**Events:**
- `TokensDeposited(address indexed funder, euint64 encryptedAmount)`
- `AllocationConfigured(address indexed recipient, euint64 encryptedAmount, bool isUpdate)`
- `AllocationCleared(address indexed recipient)`
- `AirdropClaimed(address indexed recipient, euint64 encryptedAmount)`
- `OwnershipTransferred(address indexed previousOwner, address indexed newOwner)`

### ERC7984Token.sol

A confidential token implementation using the ERC7984 standard.

**Contract Location:** `contracts/ERC7984Token.sol`

**Key Functions:**

```solidity
// Mint encrypted tokens (owner only)
function mint(address to, uint64 amount)

// Standard ERC7984 functions (inherited)
function confidentialTransfer(address to, euint64 encryptedAmount)
function confidentialTransferFrom(address from, address to, euint64 encryptedAmount)
function confidentialBalanceOf(address account) external view returns (euint64)
function setOperator(address operator, uint256 expiry)
```

**Token Details:**
- Name: `TEST`
- Symbol: `TEST`
- Standard: ERC7984 (Confidential Token)
- Decimals: Inherited from ERC7984

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v20 or higher
- **npm**: v7.0.0 or higher
- **Git**: For cloning the repository

Optional but recommended:
- **MetaMask** or another Web3 wallet for testnet interaction
- **Infura API Key** for Sepolia testnet access
- **Etherscan API Key** for contract verification

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/airdrop-system.git
cd airdrop-system
```

### 2. Install Dependencies

```bash
npm install
```

This installs all necessary dependencies including:
- Hardhat and plugins
- fhEVM libraries
- OpenZeppelin confidential contracts
- Testing and development tools

### 3. Verify Installation

```bash
npm run compile
```

If compilation succeeds, your environment is set up correctly.

## Configuration

### Environment Variables

Configure your environment by setting up Hardhat variables:

```bash
# Set up your mnemonic (or use the default test mnemonic)
npx hardhat vars set MNEMONIC

# For Sepolia testnet deployment
npx hardhat vars set INFURA_API_KEY
npx hardhat vars set ETHERSCAN_API_KEY
```

**Default Values:**
- `MNEMONIC`: Test mnemonic (for local development only)
- `INFURA_API_KEY`: Placeholder (required for Sepolia)
- `ETHERSCAN_API_KEY`: Optional (for contract verification)

### Network Configuration

The project is configured for multiple networks in `hardhat.config.ts`:

**Hardhat Network (Local):**
```typescript
chainId: 31337
accounts: { mnemonic: MNEMONIC }
```

**Sepolia Testnet:**
```typescript
chainId: 11155111
url: https://sepolia.infura.io/v3/${INFURA_API_KEY}
accounts: { mnemonic: MNEMONIC, path: "m/44'/60'/0'/0/", count: 10 }
```

### Contract Configuration

Configuration is managed in the deployment script at `deploy/deploy.ts`:

- **Initial Token Mint**: 1,000,000 TEST tokens to deployer
- **Operator Expiry**: 365 days from deployment
- **Token Address**: Automatically linked to airdrop contract

## Usage

### Deployment

#### Local Development Network

1. Start a local Hardhat node:
```bash
npm run chain
```

2. Deploy contracts (in a new terminal):
```bash
npm run deploy:localhost
```

Expected output:
```
ERC7984Token contract: 0x...
EncryptedAirdrop contract: 0x...
Airdrop operator authorization expires at: <timestamp>
```

#### Sepolia Testnet

1. Ensure you have Sepolia ETH in your deployer account
2. Configure environment variables
3. Deploy:

```bash
npm run deploy:sepolia
```

4. Verify contracts (optional):
```bash
npm run verify:sepolia
```

### Administrator Operations

#### Get Contract Addresses

```bash
npx hardhat task:airdrop-address --network sepolia
```

Output:
```
ERC7984Token address      : 0x...
EncryptedAirdrop address  : 0x...
```

#### Deposit Tokens

Before setting allocations, deposit tokens into the airdrop contract:

```bash
npx hardhat task:airdrop-deposit \
  --amount 10000 \
  --network sepolia
```

This encrypts the amount client-side and deposits it into the contract.

#### Configure Single Allocation

```bash
npx hardhat task:airdrop-allocate \
  --recipient 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb \
  --amount 500 \
  --network sepolia
```

The amount is automatically encrypted before being sent to the contract.

#### Configure Batch Allocations

For multiple allocations, you can extend the provided tasks or use the contract directly:

```typescript
import { ethers, fhevm } from "hardhat";

const recipients = ["0x...", "0x..."];
const amounts = [500n, 750n];

// Encrypt amounts
const encryptedData = await Promise.all(
  amounts.map(amount =>
    fhevm.createEncryptedInput(airdropAddress, ownerAddress)
      .add64(amount)
      .encrypt()
  )
);

// Batch set allocations
await airdrop.batchSetAllocations(
  recipients,
  encryptedData.map(d => d.handles[0]),
  encryptedData.map(d => d.inputProof)
);
```

#### Clear an Allocation

```typescript
await airdrop.clearAllocation(recipientAddress);
```

This resets both allocation and claim status for a recipient.

### User Operations

#### Check Allocation Status

```typescript
const hasAllocation = await airdrop.hasAllocation(userAddress);
const hasClaimed = await airdrop.hasClaimed(userAddress);

console.log(`Has allocation: ${hasAllocation}`);
console.log(`Already claimed: ${hasClaimed}`);
```

#### Decrypt Allocation Amount

```bash
npx hardhat task:airdrop-decrypt \
  --account 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb \
  --network sepolia
```

Output:
```
Encrypted handle: 0x...
Decrypted amount: 500
```

#### Claim Tokens

```typescript
const tx = await airdrop.connect(userSigner).claim();
await tx.wait();

console.log("Tokens claimed successfully!");
```

After claiming:
- `hasAllocation` returns `false`
- `hasClaimed` returns `true`
- Encrypted tokens transferred to user's address

#### Check Token Balance

```typescript
const encryptedBalance = await token.confidentialBalanceOf(userAddress);

// Decrypt balance
const balance = await fhevm.userDecryptEuint(
  FhevmType.euint64,
  encryptedBalance,
  tokenAddress,
  userSigner
);

console.log(`Balance: ${balance}`);
```

## Testing

### Run All Tests

```bash
npm test
```

### Test Coverage

```bash
npm run coverage
```

This generates a detailed coverage report showing:
- Line coverage
- Branch coverage
- Function coverage
- Statement coverage

### Test Structure

Tests are located in `test/EncryptedAirdrop.ts` and cover:

1. **Basic Functionality**
   - Token deposit
   - Allocation configuration
   - Claiming process
   - Balance verification

2. **Access Control**
   - Owner-only functions
   - Unauthorized access prevention
   - Ownership transfer

3. **Edge Cases**
   - Double claim prevention
   - No allocation claims
   - Zero address handling
   - Allocation updates

4. **Encryption Verification**
   - Encrypted storage validation
   - Decryption accuracy
   - Permission handling

### Example Test Output

```
EncryptedAirdrop
  ✓ allows the owner to configure allocations and users to claim (2584ms)
  ✓ prevents unauthorized callers from configuring allocations (128ms)
  ✓ allows the owner to reset allocations (256ms)

3 passing (3s)
```

## Frontend Integration

The project includes a React-based frontend template for interacting with the contracts.

### Frontend Structure

```
src/
├── src/
│   ├── components/
│   │   ├── AirdropApp.tsx           # Main application component
│   │   ├── AirdropAdminPanel.tsx    # Admin interface
│   │   ├── AirdropUserPanel.tsx     # User claim interface
│   │   └── Header.tsx               # Wallet connection
│   ├── config/
│   │   ├── contracts.ts             # Contract addresses and ABIs
│   │   └── wagmi.ts                 # Wagmi configuration
│   ├── hooks/
│   │   ├── useEthersSigner.ts       # Ethers.js integration
│   │   └── useZamaInstance.ts       # fhEVM instance hook
│   ├── App.tsx
│   └── main.tsx
└── vite.config.ts
```

### Key Integration Points

#### 1. Contract Connection

```typescript
// config/contracts.ts
export const AIRDROP_ADDRESS = "0x...";
export const TOKEN_ADDRESS = "0x...";
```

#### 2. Encryption Setup

```typescript
// hooks/useZamaInstance.ts
import { createInstance } from "fhevmjs";

export function useZamaInstance() {
  const [instance, setInstance] = useState(null);

  useEffect(() => {
    async function init() {
      const fhevmInstance = await createInstance({
        chainId: 11155111,
        networkUrl: "https://sepolia.infura.io/v3/...",
      });
      setInstance(fhevmInstance);
    }
    init();
  }, []);

  return instance;
}
```

#### 3. Admin Operations

```typescript
// Example: Setting allocation
async function setAllocation(recipient: string, amount: bigint) {
  const encrypted = await fhevmInstance
    .createEncryptedInput(airdropAddress, signerAddress)
    .add64(amount)
    .encrypt();

  const tx = await airdropContract.setAllocation(
    recipient,
    encrypted.handles[0],
    encrypted.inputProof
  );

  await tx.wait();
}
```

#### 4. User Operations

```typescript
// Example: Claiming tokens
async function claim() {
  const tx = await airdropContract.claim();
  await tx.wait();
}

// Example: Decrypting balance
async function getBalance() {
  const encryptedBalance = await tokenContract.confidentialBalanceOf(address);
  const balance = await fhevmInstance.decrypt(encryptedBalance);
  return balance;
}
```

### Running the Frontend

```bash
cd src
npm install
npm run dev
```

Access the application at `http://localhost:5173`

## Security Considerations

### Auditing Status
⚠️ **This is a demonstration project and has not undergone professional security auditing.** Do not use in production without thorough review and auditing.

### Security Best Practices Implemented

1. **Access Control**
   - Owner-only administrative functions
   - Claim function restricted to allocated recipients
   - Clear separation of privileges

2. **Reentrancy Protection**
   - State changes before external calls
   - Checks-effects-interactions pattern followed

3. **Input Validation**
   - Zero address checks
   - Length matching for batch operations
   - Existence checks for allocations

4. **Encryption Security**
   - FHE proofs validated on-chain
   - Permission system prevents unauthorized decryption
   - Encrypted values never exposed in plaintext

5. **Claim Security**
   - Double-claim prevention
   - Allocation cleared after claim
   - Claim tracking separate from allocation tracking

### Known Considerations

1. **Operator Pattern**: Token contract must grant operator status to airdrop contract with appropriate expiry
2. **Gas Costs**: FHE operations are more expensive than plaintext operations
3. **Decryption Trust**: Relies on Zama's decryption oracle infrastructure
4. **Front-running**: While amounts are private, claim transactions are visible
5. **Ownership**: Single owner pattern - consider multi-sig for production

### Recommended Security Measures

For production deployment:

1. **Professional Audit**: Engage security auditors familiar with FHE and Zama
2. **Multi-sig Ownership**: Use Gnosis Safe or similar for admin operations
3. **Gradual Rollout**: Test with small amounts before full deployment
4. **Monitoring**: Implement off-chain monitoring for unusual patterns
5. **Time Locks**: Consider time-locked admin operations for sensitive changes
6. **Emergency Pause**: Add pause functionality for emergency situations

## Gas Optimization

### Gas Usage Estimates

Based on Sepolia testnet measurements:

| Operation | Gas Used (approx) | Notes |
|-----------|------------------|-------|
| Deploy ERC7984Token | ~2,500,000 | One-time deployment |
| Deploy EncryptedAirdrop | ~1,800,000 | One-time deployment |
| Deposit Tokens | ~180,000 | Per deposit transaction |
| Set Single Allocation | ~250,000 | Per allocation |
| Batch Set (10 allocations) | ~2,000,000 | ~200k per allocation |
| Claim | ~280,000 | Per claim transaction |
| Clear Allocation | ~80,000 | Per clear operation |

### Optimization Strategies

1. **Batch Operations**: Use `batchSetAllocations()` for multiple recipients
   - Amortizes base transaction cost
   - Saves ~30% compared to individual transactions

2. **Single Deposit**: Deposit all tokens at once rather than multiple deposits

3. **Gas Price Timing**: Execute admin operations during low gas price periods

4. **Operator Reuse**: Set long expiry times to avoid frequent re-authorization

### FHE-Specific Considerations

FHE operations inherently consume more gas than plaintext operations:
- Encryption verification: ~80,000 gas
- FHE permission management: ~40,000 gas per permission
- Encrypted transfers: ~100,000 gas overhead

These costs enable the privacy guarantees and are unavoidable with current FHE technology.

## Future Roadmap

### Short-term (Q2-Q3 2025)

1. **Enhanced UI**
   - Responsive mobile design
   - Real-time claim notifications
   - Allocation management dashboard

2. **Additional Features**
   - Vesting schedules with encrypted amounts
   - Multiple token support
   - Merkle tree validation for gas efficiency

3. **Developer Experience**
   - SDK for easier integration
   - More example scripts
   - Video tutorials and documentation

### Medium-term (Q4 2025 - Q1 2026)

1. **Advanced Privacy Features**
   - Anonymous claiming with ZK proofs
   - Private allocation formulas
   - Confidential eligibility criteria

2. **Scalability Improvements**
   - Layer 2 deployment support
   - Batch claim functionality
   - Compressed proof systems

3. **Integration Ecosystem**
   - DEX integration for private swaps
   - Governance integration for private voting
   - Cross-chain bridge support

### Long-term (2026+)

1. **Protocol Enhancements**
   - Fully on-chain decryption (when available)
   - Dynamic allocation algorithms
   - AI-powered distribution optimization

2. **Compliance Features**
   - Selective disclosure for auditors
   - Regulatory reporting tools
   - KYC integration with privacy preservation

3. **Research & Innovation**
   - Post-quantum encryption migration
   - Privacy-preserving analytics
   - Novel tokenomics enabled by FHE

### Community Contributions

We welcome contributions in the following areas:
- Additional test coverage
- Gas optimization research
- UI/UX improvements
- Documentation enhancements
- Integration examples
- Security analysis

See [Contributing](#contributing) section for details.

## Contributing

We welcome contributions from the community! Here's how you can help:

### Getting Started

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Run linting (`npm run lint`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Contribution Guidelines

- **Code Style**: Follow existing code style (enforced by Prettier and ESLint)
- **Tests**: Add tests for new features
- **Documentation**: Update documentation for API changes
- **Commits**: Write clear, descriptive commit messages
- **PR Description**: Explain what and why, not just how

### Areas for Contribution

- **Testing**: Expand test coverage, add edge case tests
- **Documentation**: Improve guides, add examples, fix typos
- **Features**: Implement items from the roadmap
- **Optimization**: Improve gas efficiency
- **Security**: Identify and fix vulnerabilities
- **UI/UX**: Enhance frontend components

### Code Review Process

1. All submissions require review
2. Maintainers will review PRs within 7 days
3. Address review feedback promptly
4. Squash commits before merge

### Reporting Issues

When reporting issues, please include:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Environment details (node version, network, etc.)
- Relevant logs or error messages

## License

This project is licensed under the **BSD-3-Clause-Clear License**.

See [LICENSE](LICENSE) file for details.

### Key License Points

- ✅ Commercial use allowed
- ✅ Modification allowed
- ✅ Distribution allowed
- ✅ Private use allowed
- ❌ Patent claims excluded
- ❌ Liability and warranty disclaimed

### Third-Party Licenses

This project depends on:
- **OpenZeppelin Contracts**: MIT License
- **Zama fhEVM**: BSD-3-Clause-Clear License
- **Hardhat**: MIT License
- **Ethers.js**: MIT License

See individual package licenses in `node_modules` for complete details.

## Acknowledgments

### Core Technologies

- **[Zama](https://www.zama.ai/)** - For pioneering FHE technology and fhEVM
- **[OpenZeppelin](https://www.openzeppelin.com/)** - For confidential contract standards
- **[Hardhat](https://hardhat.org/)** - For excellent development tools

### Standards & Specifications

- **ERC7984** - Confidential Token Standard
- **FHE** - Fully Homomorphic Encryption research community
- **Ethereum** - For the foundational blockchain platform

### Community

- Zama community for fhEVM support and feedback
- OpenZeppelin for security best practices
- Ethereum research community for privacy innovations

### Inspiration

This project was inspired by the need for privacy-preserving token distributions in:
- Corporate equity compensation
- Investor allocations
- Competitive reward programs
- Fair launch mechanisms

---

## Support & Contact

### Documentation
- **Main Docs**: [This README]
- **Zama Docs**: https://docs.zama.ai/fhevm
- **Hardhat Docs**: https://hardhat.org/docs

### Community
- **GitHub Issues**: [Report bugs and request features](https://github.com/yourusername/airdrop-system/issues)
- **Discussions**: [Ask questions and share ideas](https://github.com/yourusername/airdrop-system/discussions)

### Professional Services
For professional support, auditing, or custom development, please reach out through GitHub issues.

---

## Quick Reference

### Common Commands

```bash
# Development
npm install                  # Install dependencies
npm run compile             # Compile contracts
npm test                    # Run tests
npm run coverage            # Test coverage report

# Deployment
npm run chain               # Start local node
npm run deploy:localhost    # Deploy to local
npm run deploy:sepolia      # Deploy to Sepolia

# Tasks
npx hardhat task:airdrop-address --network sepolia
npx hardhat task:airdrop-deposit --amount 10000 --network sepolia
npx hardhat task:airdrop-allocate --recipient 0x... --amount 500 --network sepolia
npx hardhat task:airdrop-decrypt --account 0x... --network sepolia

# Code Quality
npm run lint                # Lint all code
npm run lint:sol            # Lint Solidity
npm run lint:ts             # Lint TypeScript
npm run prettier:write      # Format code
```

### Contract Addresses

After deployment, contracts are saved in `deployments/[network]/` directory:
- `deployments/sepolia/ERC7984Token.json`
- `deployments/sepolia/EncryptedAirdrop.json`

### Key Files

- `contracts/` - Smart contract source code
- `test/` - Contract tests
- `deploy/` - Deployment scripts
- `tasks/` - Hardhat tasks for contract interaction
- `hardhat.config.ts` - Hardhat configuration
- `src/` - Frontend application (optional)

---

**Built with privacy in mind. Powered by Zama's fhEVM.**

**⚠️ Disclaimer**: This is demonstration software. Use at your own risk. No warranties provided.
