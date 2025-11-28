import { useState } from 'react';
import { useDeFiVault, formatVaultBalance, parseVaultAmount } from '@/hooks/useDeFiVault';
import { useActiveAccount } from 'thirdweb/react';

export function VaultDashboard() {
  const account = useActiveAccount();
  const {
    userBalance,
    totalValueLocked,
    vaultName,
    treasury,
    emergencyMode,
    isLoading,
    error,
    deposit,
    withdraw,
    refresh,
  } = useDeFiVault();

  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      setIsDepositing(true);
      const amount = parseVaultAmount(depositAmount);
      await deposit(amount);
      setDepositAmount('');
      alert('Deposit successful!');
    } catch (error) {
      console.error('Deposit failed:', error);
      alert('Deposit failed. Please try again.');
    } finally {
      setIsDepositing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    const amount = parseVaultAmount(withdrawAmount);
    if (amount > userBalance) {
      alert('Insufficient balance');
      return;
    }

    try {
      setIsWithdrawing(true);
      await withdraw(amount);
      setWithdrawAmount('');
      alert('Withdrawal successful!');
    } catch (error) {
      console.error('Withdrawal failed:', error);
      alert('Withdrawal failed. Please try again.');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleMaxWithdraw = () => {
    setWithdrawAmount(formatVaultBalance(userBalance));
  };

  if (!account) {
    return (
      <div className="vault-dashboard">
        <div className="connect-prompt">
          <h2>Connect Your Wallet</h2>
          <p>Please connect your wallet to access the vault</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="vault-dashboard">
        <div className="loading">Loading vault data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="vault-dashboard">
        <div className="error">
          <h3>Error loading vault data</h3>
          <p>{error.message}</p>
          <button onClick={refresh}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="vault-dashboard">
      {/* Header */}
      <div className="vault-header">
        <h1>{vaultName}</h1>
        {emergencyMode && (
          <div className="emergency-badge">
            ⚠️ Emergency Mode Active
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="vault-stats">
        <div className="stat-card">
          <div className="stat-label">Your Balance</div>
          <div className="stat-value">{formatVaultBalance(userBalance)} ETH</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Value Locked</div>
          <div className="stat-value">{formatVaultBalance(totalValueLocked)} ETH</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Treasury</div>
          <div className="stat-value">
            {treasury.slice(0, 6)}...{treasury.slice(-4)}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="vault-actions">
        {/* Deposit */}
        <div className="action-card">
          <h3>Deposit</h3>
          {emergencyMode ? (
            <div className="disabled-message">
              Deposits are disabled during emergency mode
            </div>
          ) : (
            <>
              <div className="input-group">
                <input
                  type="number"
                  placeholder="Amount in ETH"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  disabled={isDepositing}
                  step="0.0001"
                  min="0"
                />
                <span className="input-suffix">ETH</span>
              </div>
              <button
                onClick={handleDeposit}
                disabled={isDepositing || !depositAmount}
                className="primary-button"
              >
                {isDepositing ? 'Depositing...' : 'Deposit'}
              </button>
            </>
          )}
        </div>

        {/* Withdraw */}
        <div className="action-card">
          <h3>Withdraw</h3>
          <div className="input-group">
            <input
              type="number"
              placeholder="Amount in ETH"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              disabled={isWithdrawing}
              step="0.0001"
              min="0"
              max={formatVaultBalance(userBalance)}
            />
            <span className="input-suffix">ETH</span>
          </div>
          <div className="button-group">
            <button
              onClick={handleMaxWithdraw}
              disabled={isWithdrawing || userBalance === 0n}
              className="secondary-button"
            >
              Max
            </button>
            <button
              onClick={handleWithdraw}
              disabled={isWithdrawing || !withdrawAmount || userBalance === 0n}
              className="primary-button"
            >
              {isWithdrawing ? 'Withdrawing...' : 'Withdraw'}
            </button>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="vault-info">
        <h3>Information</h3>
        <ul>
          <li>
            <strong>Network:</strong> Base Sepolia Testnet
          </li>
          <li>
            <strong>Contract:</strong>{' '}
            <a
              href={`https://sepolia.basescan.org/address/${import.meta.env.VITE_VAULT_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {import.meta.env.VITE_VAULT_ADDRESS?.slice(0, 6)}...
              {import.meta.env.VITE_VAULT_ADDRESS?.slice(-4)}
            </a>
          </li>
          <li>
            <strong>Treasury (Multisig 2/3):</strong>{' '}
            <a
              href={`https://app.safe.global/home?safe=basesep:${treasury}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {treasury.slice(0, 6)}...{treasury.slice(-4)}
            </a>
          </li>
          {emergencyMode && (
            <li className="warning">
              <strong>Emergency Mode:</strong> Deposits are temporarily disabled. Withdrawals are still available.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
