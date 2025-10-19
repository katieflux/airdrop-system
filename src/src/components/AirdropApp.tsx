import { useState } from 'react';
import { useAccount } from 'wagmi';

import { Header } from './Header';
import { AirdropUserPanel } from './AirdropUserPanel';
import { AirdropAdminPanel } from './AirdropAdminPanel';

import '../styles/AirdropApp.css';

export function AirdropApp() {
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState<'claim' | 'admin'>('claim');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey((value) => value + 1);
  };

  return (
    <div className="airdrop-app">
      <Header />
      <main className="airdrop-main">
        <div className="tab-navigation">
          <nav className="tab-nav">
            <button
              onClick={() => setActiveTab('claim')}
              className={`tab-button ${activeTab === 'claim' ? 'active' : 'inactive'}`}
            >
              Claim Allocation
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`tab-button ${activeTab === 'admin' ? 'active' : 'inactive'}`}
            >
              Admin Tools
            </button>
          </nav>
        </div>

        <section className="tab-content">
          {activeTab === 'claim' && (
            <AirdropUserPanel refreshKey={refreshKey} onRefreshed={handleRefresh} />
          )}

          {activeTab === 'admin' && (
            <AirdropAdminPanel
              onActionComplete={handleRefresh}
              isConnected={Boolean(address)}
            />
          )}
        </section>
      </main>
    </div>
  );
}
