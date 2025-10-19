import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { ethers } from 'ethers';
import { useAccount, useReadContract } from 'wagmi';

import { AIRDROP_CONTRACT_ADDRESS, AIRDROP_CONTRACT_ABI, TOKEN_SYMBOL } from '../config/contracts';
import { useZamaInstance } from '../hooks/useZamaInstance';
import { useEthersSigner } from '../hooks/useEthersSigner';

type AirdropAdminPanelProps = {
  onActionComplete: () => void;
  isConnected: boolean;
};

export function AirdropAdminPanel({ onActionComplete, isConnected }: AirdropAdminPanelProps) {
  const { address } = useAccount();
  const { instance } = useZamaInstance();
  const signer = useEthersSigner();

  const [depositAmount, setDepositAmount] = useState('');
  const [allocationRecipient, setAllocationRecipient] = useState('');
  const [allocationAmount, setAllocationAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [isAllocating, setIsAllocating] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const { data: ownerAddress } = useReadContract({
    address: AIRDROP_CONTRACT_ADDRESS,
    abi: AIRDROP_CONTRACT_ABI,
    functionName: 'owner',
  });

  const isOwner = useMemo(() => {
    if (!address || !ownerAddress) return false;
    return address.toLowerCase() === (ownerAddress as string).toLowerCase();
  }, [address, ownerAddress]);

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

  const handleDeposit = async (event: FormEvent) => {
    event.preventDefault();
    resetFeedback();

    if (!isOwner) {
      setFeedback('Only the contract owner can deposit tokens.');
      return;
    }

    try {
      const amount = BigInt(depositAmount.trim());
      if (amount <= 0n) {
        setFeedback(`Enter a positive ${TOKEN_SYMBOL} amount to deposit.`);
        return;
      }

      if (!address) {
        setFeedback('Connect the owner wallet to deposit tokens.');
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

    if (!isOwner) {
      setFeedback('Only the contract owner can configure allocations.');
      return;
    }

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
        setFeedback('Connect the owner wallet to set allocations.');
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
        <h2 className="card-title">Admin Tools</h2>
        <p className="card-description">Connect the owner wallet to manage encrypted allocations and deposits.</p>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="card">
        <h2 className="card-title">Restricted Area</h2>
        <p className="card-description">Only the contract owner can access the airdrop administration tools.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="card-title">Airdrop Administration</h2>

      <form className="form" onSubmit={handleDeposit}>
        <h3 className="form-title">Deposit {TOKEN_SYMBOL} Tokens</h3>
        <p className="form-description">
          Encrypt the deposit amount with Zama FHE and transfer {TOKEN_SYMBOL} from the owner wallet into the contract.
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
          Assign an encrypted {TOKEN_SYMBOL} amount to an address. Users must decrypt to view their allocation before claiming.
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
