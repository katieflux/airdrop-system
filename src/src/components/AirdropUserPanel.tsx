import { useEffect, useMemo, useState } from 'react';
import { ethers } from 'ethers';
import type { BytesLike } from 'ethers';
import { useAccount, useReadContract } from 'wagmi';

import { AIRDROP_CONTRACT_ADDRESS, AIRDROP_CONTRACT_ABI, TOKEN_SYMBOL } from '../config/contracts';
import { useZamaInstance } from '../hooks/useZamaInstance';
import { useEthersSigner } from '../hooks/useEthersSigner';

type AirdropUserPanelProps = {
  refreshKey: number;
  onRefreshed: () => void;
};

const ZERO_HANDLE = '0x0000000000000000000000000000000000000000000000000000000000000000';

export function AirdropUserPanel({ refreshKey, onRefreshed }: AirdropUserPanelProps) {
  const { address } = useAccount();
  const { instance, isLoading: isLoadingInstance } = useZamaInstance();
  const signer = useEthersSigner();

  const [decryptedAmount, setDecryptedAmount] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const hasConnection = Boolean(address);

  const {
    data: allocationHandle,
    refetch: refetchAllocation,
  } = useReadContract({
    address: AIRDROP_CONTRACT_ADDRESS,
    abi: AIRDROP_CONTRACT_ABI,
    functionName: 'getEncryptedAllocation',
    args: hasConnection ? [address as `0x${string}`] : undefined,
    query: {
      enabled: hasConnection,
    },
  });

  const {
    data: hasAllocation,
    refetch: refetchHasAllocation,
  } = useReadContract({
    address: AIRDROP_CONTRACT_ADDRESS,
    abi: AIRDROP_CONTRACT_ABI,
    functionName: 'hasAllocation',
    args: hasConnection ? [address as `0x${string}`] : undefined,
    query: {
      enabled: hasConnection,
    },
  });

  const {
    data: hasClaimed,
    refetch: refetchHasClaimed,
  } = useReadContract({
    address: AIRDROP_CONTRACT_ADDRESS,
    abi: AIRDROP_CONTRACT_ABI,
    functionName: 'hasClaimed',
    args: hasConnection ? [address as `0x${string}`] : undefined,
    query: {
      enabled: hasConnection,
    },
  });

  useEffect(() => {
    if (hasConnection) {
      refetchAllocation();
      refetchHasAllocation();
      refetchHasClaimed();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, hasConnection]);

  const allocationHandleValue = useMemo(() => {
    if (!allocationHandle) return ZERO_HANDLE;
    if (typeof allocationHandle === 'string') return allocationHandle;
    try {
      return ethers.hexlify(allocationHandle as BytesLike);
    } catch (error) {
      console.warn('Unable to hexlify allocation handle', error);
      return ZERO_HANDLE;
    }
  }, [allocationHandle]);

  const showDecryptButton = allocationHandleValue !== ZERO_HANDLE && hasAllocation === true;

  const formatHandle = (handle: string) => {
    if (!handle || handle === ZERO_HANDLE) {
      return 'None';
    }
    return `${handle.slice(0, 10)}...${handle.slice(-6)}`;
  };

  const handleDecrypt = async () => {
    if (!instance || !address || allocationHandleValue === ZERO_HANDLE) {
      setFeedback('No encrypted allocation found.');
      return;
    }

    setIsDecrypting(true);
    setFeedback(null);
    setDecryptedAmount(null);

    try {
      const keypair = instance.generateKeypair();
      const handleContractPairs = [
        {
          handle: allocationHandleValue,
          contractAddress: AIRDROP_CONTRACT_ADDRESS,
        },
      ];

      const startTimestamp = Math.floor(Date.now() / 1000).toString();
      const durationDays = '7';
      const eip712 = instance.createEIP712(
        keypair.publicKey,
        [AIRDROP_CONTRACT_ADDRESS],
        startTimestamp,
        durationDays,
      );

      const resolvedSigner = await signer;
      if (!resolvedSigner) {
        throw new Error('Wallet signer unavailable.');
      }

      const signature = await resolvedSigner.signTypedData(
        eip712.domain,
        {
          UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification,
        },
        eip712.message,
      );

      const results = await instance.userDecrypt(
        handleContractPairs,
        keypair.privateKey,
        keypair.publicKey,
        signature.replace('0x', ''),
        [AIRDROP_CONTRACT_ADDRESS],
        address,
        startTimestamp,
        durationDays,
      );

      const rawValue = results[allocationHandleValue] ?? '0';
      const parsed = BigInt(rawValue);
      setDecryptedAmount(parsed.toString());
      setFeedback('Decryption successful.');
    } catch (error) {
      console.error('Failed to decrypt allocation', error);
      setFeedback(
        error instanceof Error ? `Failed to decrypt: ${error.message}` : 'Failed to decrypt allocation.'
      );
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleClaim = async () => {
    if (!address) {
      setFeedback('Connect your wallet to claim.');
      return;
    }

    setIsClaiming(true);
    setFeedback(null);

    try {
      const resolvedSigner = await signer;
      if (!resolvedSigner) {
        throw new Error('Wallet signer unavailable.');
      }

      const contract = new ethers.Contract(
        AIRDROP_CONTRACT_ADDRESS,
        AIRDROP_CONTRACT_ABI,
        resolvedSigner,
      );
      const tx = await contract.claim();
      await tx.wait();

      setFeedback('Claim successful. Tokens transferred to your wallet.');
      setDecryptedAmount(null);
      await Promise.all([refetchAllocation(), refetchHasAllocation(), refetchHasClaimed()]);
      onRefreshed();
    } catch (error) {
      console.error('Failed to claim allocation', error);
      setFeedback(error instanceof Error ? error.message : 'Failed to claim allocation.');
    } finally {
      setIsClaiming(false);
    }
  };

  if (!address) {
    return (
      <div className="card">
        <h2 className="card-title">Connect Wallet</h2>
        <p className="card-description">Connect your wallet to view and claim your encrypted {TOKEN_SYMBOL} allocation.</p>
      </div>
    );
  }

  if (isLoadingInstance) {
    return (
      <div className="card">
        <h2 className="card-title">Loading Encryption Tools</h2>
        <p className="card-description">Preparing secure decryption environment. Please wait...</p>
      </div>
    );
  }

  const allocationStatus = hasAllocation ? 'Allocation ready' : hasClaimed ? 'Already claimed' : 'No allocation yet';

  return (
    <div className="card">
      <h2 className="card-title">Your Encrypted Allocation</h2>

      <div className="info-grid">
        <div className="info-item">
          <span className="info-label">Status</span>
          <span className="info-value">{allocationStatus}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Encrypted Handle</span>
          <span className="info-value mono">{formatHandle(allocationHandleValue)}</span>
        </div>
        {decryptedAmount && (
          <div className="info-item">
            <span className="info-label">Decrypted {TOKEN_SYMBOL} Amount</span>
            <span className="info-value highlight">{decryptedAmount}</span>
          </div>
        )}
      </div>

      <div className="action-row">
        <button
          type="button"
          className="primary-button"
          onClick={handleDecrypt}
          disabled={!showDecryptButton || isDecrypting}
        >
          {isDecrypting ? 'Decrypting...' : 'Decrypt Allocation'}
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={handleClaim}
          disabled={isClaiming || !hasAllocation}
        >
          {isClaiming ? 'Claiming...' : `Claim ${TOKEN_SYMBOL} Tokens`}
        </button>
      </div>

      {feedback && <p className="feedback-message">{feedback}</p>}
    </div>
  );
}
