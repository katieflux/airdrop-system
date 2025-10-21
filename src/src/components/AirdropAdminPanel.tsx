import { useState } from 'react';
import type { FormEvent } from 'react';
import { ethers } from 'ethers';
import { useAccount } from 'wagmi';

import {
  AIRDROP_CONTRACT_ADDRESS,
  AIRDROP_CONTRACT_ABI,
  TOKEN_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ABI,
  TOKEN_SYMBOL,
} from '../config/contracts';
import { useZamaInstance } from '../hooks/useZamaInstance';
import { useEthersSigner } from '../hooks/useEthersSigner';

const MAX_UINT64 = (1n << 64n) - 1n;

type AirdropAdminPanelProps = {
  onActionComplete: () => void;
  isConnected: boolean;
};

export function AirdropAdminPanel({ onActionComplete, isConnected }: AirdropAdminPanelProps) {
  const { address } = useAccount();
  const { instance } = useZamaInstance();
  const signer = useEthersSigner();

  const [mintAmount, setMintAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [allocationRecipient, setAllocationRecipient] = useState('');
  const [allocationAmount, setAllocationAmount] = useState('');
  const [isMinting, setIsMinting] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [isAllocating, setIsAllocating] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const ensureSigner = async () => {
    const resolvedSigner = await signer;
    if (!resolvedSigner) {
      throw new Error('Wallet signer unavailable.');
    }
    return resolvedSigner;
  };

  const ensureInstance = () => {
    if (!instance) {
      throw new Error('Encryption tools are not ready yet.');
    }
    return instance;
  };

  const resetFeedback = () => setFeedback(null);

  const handleMint = async (event: FormEvent) => {
    event.preventDefault();
    resetFeedback();

    try {
      const rawAmount = mintAmount.trim();
      if (!rawAmount) {
        setFeedback(`Enter a ${TOKEN_SYMBOL} amount to mint.`);
        return;
      }

      const amountValue = BigInt(rawAmount);
      if (amountValue <= 0n) {
        setFeedback(`Enter a positive ${TOKEN_SYMBOL} amount to mint.`);
        return;
      }

      if (amountValue > MAX_UINT64) {
        setFeedback('Mint amount exceeds uint64 range.');
        return;
      }

      if (!address) {
        setFeedback('Connect your wallet to mint tokens.');
        return;
      }

      const resolvedSigner = await ensureSigner();

      setIsMinting(true);

      const contract = new ethers.Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        resolvedSigner,
      );

      const tx = await contract.mint(address, amountValue);
      await tx.wait();

      setFeedback(`Mint successful. ${TOKEN_SYMBOL} tokens added to your wallet.`);
      setMintAmount('');
      onActionComplete();
    } catch (error) {
      console.error('Token mint failed', error);
      setFeedback(error instanceof Error ? error.message : 'Failed to mint tokens.');
    } finally {
      setIsMinting(false);
    }
  };

  const handleDeposit = async (event: FormEvent) => {
    event.preventDefault();
    resetFeedback();

    try {
      const amount = BigInt(depositAmount.trim());
      if (amount <= 0n) {
        setFeedback(`Enter a positive ${TOKEN_SYMBOL} amount to deposit.`);
        return;
      }

      if (!address) {
        setFeedback('Connect your wallet to deposit tokens.');
        return;
      }

      const zama = ensureInstance();
      const resolvedSigner = await ensureSigner();

      setIsDepositing(true);

      const encryptedInput = await zama
        .createEncryptedInput(AIRDROP_CONTRACT_ADDRESS, address)
        .add64(amount)
        .encrypt();

      const contract = new ethers.Contract(
        AIRDROP_CONTRACT_ADDRESS,
        AIRDROP_CONTRACT_ABI,
        resolvedSigner,
      );

      const tx = await contract.depositTokens(encryptedInput.handles[0], encryptedInput.inputProof);
      await tx.wait();

      setFeedback(`Deposit successful. ${TOKEN_SYMBOL} tokens added to the airdrop pool.`);
      setDepositAmount('');
      onActionComplete();
    } catch (error) {
      console.error('Token deposit failed', error);
      setFeedback(error instanceof Error ? error.message : 'Failed to deposit tokens.');
    } finally {
      setIsDepositing(false);
    }
  };

  const handleAllocation = async (event: FormEvent) => {
    event.preventDefault();
    resetFeedback();

    try {
      const recipient = allocationRecipient.trim();
      if (!ethers.isAddress(recipient)) {
        setFeedback('Enter a valid recipient address.');
        return;
      }

      const amount = BigInt(allocationAmount.trim());
      if (amount <= 0n) {
        setFeedback(`Enter a positive ${TOKEN_SYMBOL} allocation.`);
        return;
      }

      if (!address) {
        setFeedback('Connect your wallet to configure allocations.');
        return;
      }

      const zama = ensureInstance();
      const resolvedSigner = await ensureSigner();

      setIsAllocating(true);

      const encryptedInput = await zama
        .createEncryptedInput(AIRDROP_CONTRACT_ADDRESS, address)
        .add64(amount)
        .encrypt();

      const contract = new ethers.Contract(
        AIRDROP_CONTRACT_ADDRESS,
        AIRDROP_CONTRACT_ABI,
        resolvedSigner,
      );

      const tx = await contract.setAllocation(recipient, encryptedInput.handles[0], encryptedInput.inputProof);
      await tx.wait();

      setFeedback(`Allocation updated for ${recipient}.`);
      setAllocationAmount('');
      setAllocationRecipient('');
      onActionComplete();
    } catch (error) {
      console.error('Allocation configuration failed', error);
      setFeedback(error instanceof Error ? error.message : 'Failed to configure allocation.');
    } finally {
      setIsAllocating(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="card">
        <h2 className="card-title">Distribution Tools</h2>
        <p className="card-description">Connect your wallet to manage encrypted allocations and deposits.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="card-title">Airdrop Tools</h2>

      <form className="form" onSubmit={handleMint}>
        <h3 className="form-title">Mint {TOKEN_SYMBOL} Tokens</h3>
        <p className="form-description">
          Create new {TOKEN_SYMBOL} tokens directly in your connected wallet.
        </p>
        <label className="form-label" htmlFor="mint-amount">Amount</label>
        <input
          id="mint-amount"
          type="number"
          min="0"
          step="1"
          value={mintAmount}
          onChange={(event) => setMintAmount(event.target.value)}
          className="form-input"
          placeholder={`Enter ${TOKEN_SYMBOL} amount`}
        />
        <button type="submit" className="primary-button" disabled={isMinting}>
          {isMinting ? 'Minting...' : `Mint ${TOKEN_SYMBOL}`}
        </button>
      </form>

      <form className="form" onSubmit={handleDeposit}>
        <h3 className="form-title">Deposit {TOKEN_SYMBOL} Tokens</h3>
        <p className="form-description">
          Encrypt the deposit amount with Zama FHE and transfer {TOKEN_SYMBOL} from your wallet into the contract.
        </p>
        <label className="form-label" htmlFor="deposit-amount">Amount</label>
        <input
          id="deposit-amount"
          type="number"
          min="0"
          step="1"
          value={depositAmount}
          onChange={(event) => setDepositAmount(event.target.value)}
          className="form-input"
          placeholder={`Enter ${TOKEN_SYMBOL} amount`}
        />
        <button type="submit" className="primary-button" disabled={isDepositing}>
          {isDepositing ? 'Encrypting...' : 'Deposit Tokens'}
        </button>
      </form>

      <form className="form" onSubmit={handleAllocation}>
        <h3 className="form-title">Configure Allocation</h3>
        <p className="form-description">
          Assign an encrypted {TOKEN_SYMBOL} amount to an address. Users decrypt to view their allocation before claiming.
        </p>
        <label className="form-label" htmlFor="allocation-recipient">Recipient Address</label>
        <input
          id="allocation-recipient"
          type="text"
          value={allocationRecipient}
          onChange={(event) => setAllocationRecipient(event.target.value)}
          className="form-input"
          placeholder="0x..."
        />
        <label className="form-label" htmlFor="allocation-amount">Encrypted Amount</label>
        <input
          id="allocation-amount"
          type="number"
          min="0"
          step="1"
          value={allocationAmount}
          onChange={(event) => setAllocationAmount(event.target.value)}
          className="form-input"
          placeholder={`Enter ${TOKEN_SYMBOL} amount`}
        />
        <button type="submit" className="secondary-button" disabled={isAllocating}>
          {isAllocating ? 'Encrypting...' : 'Set Allocation'}
        </button>
      </form>

      {feedback && <p className="feedback-message">{feedback}</p>}
    </div>
  );
}
