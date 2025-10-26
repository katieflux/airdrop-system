import { ConnectButton } from '@rainbow-me/rainbowkit';
import '../styles/Header.css';

export function Header() {
  return (
    <header className="header">
      <div className="header-container">
        <div className="header-content">
          <div className="header-left">
            <h1 className="header-title">
              Encrypted Airdrop System
            </h1>
            <p className="header-subtitle">Confidential allocations secured by Zama FHEVM</p>
          </div>
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
