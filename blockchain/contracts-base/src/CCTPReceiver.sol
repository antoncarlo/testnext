// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CCTPReceiver
 * @author Anton Carlo Santoro
 * @notice Receiver contract for Circle CCTP cross-chain transfers
 * @dev Handles incoming USDC transfers from Solana via CCTP
 * 
 * Features:
 * - Receive USDC from CCTP bridge
 * - Automatic vault deposit
 * - Fee management
 * - Emergency pause
 */
contract CCTPReceiver is Ownable, ReentrancyGuard {
    // USDC token address on Base
    address public immutable usdc;
    
    // Target vault for deposits
    address public vault;
    
    // Fee collector address
    address public feeCollector;
    
    // Bridge fee (basis points, 100 = 1%)
    uint256 public bridgeFee;
    
    // Paused state
    bool public paused;
    
    // Events
    event BridgeReceived(address indexed recipient, uint256 amount, uint256 fee);
    event VaultUpdated(address indexed oldVault, address indexed newVault);
    event FeeCollectorUpdated(address indexed oldCollector, address indexed newCollector);
    event BridgeFeeUpdated(uint256 oldFee, uint256 newFee);
    event Paused();
    event Unpaused();
    
    /**
     * @notice Constructor
     * @param _usdc USDC token address
     * @param _vault Initial vault address
     * @param _feeCollector Fee collector address
     * @param _bridgeFee Initial bridge fee in basis points
     */
    constructor(
        address _usdc,
        address _vault,
        address _feeCollector,
        uint256 _bridgeFee
    ) Ownable(msg.sender) {
        require(_usdc != address(0), "Invalid USDC address");
        require(_vault != address(0), "Invalid vault address");
        require(_feeCollector != address(0), "Invalid fee collector");
        require(_bridgeFee <= 1000, "Fee too high"); // Max 10%
        
        usdc = _usdc;
        vault = _vault;
        feeCollector = _feeCollector;
        bridgeFee = _bridgeFee;
    }
    
    /**
     * @notice Receive USDC from CCTP bridge
     * @param recipient Final recipient address
     * @param amount Amount of USDC received
     */
    function receiveBridge(
        address recipient,
        uint256 amount
    ) external nonReentrant {
        require(!paused, "Contract paused");
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Invalid amount");
        
        // Calculate fee
        uint256 fee = (amount * bridgeFee) / 10000;
        uint256 netAmount = amount - fee;
        
        // Transfer USDC from sender (CCTP bridge)
        // Note: In production, this would be called by the CCTP MessageTransmitter
        // For now, we assume the contract has received the USDC
        
        // Transfer fee to collector if applicable
        if (fee > 0) {
            (bool feeSuccess, ) = usdc.call(
                abi.encodeWithSignature("transfer(address,uint256)", feeCollector, fee)
            );
            require(feeSuccess, "Fee transfer failed");
        }
        
        // Deposit to vault on behalf of recipient
        (bool depositSuccess, ) = usdc.call(
            abi.encodeWithSignature("approve(address,uint256)", vault, netAmount)
        );
        require(depositSuccess, "Approval failed");
        
        (bool vaultSuccess, ) = vault.call(
            abi.encodeWithSignature("deposit(uint256,address)", netAmount, recipient)
        );
        require(vaultSuccess, "Vault deposit failed");
        
        emit BridgeReceived(recipient, amount, fee);
    }
    
    /**
     * @notice Update vault address
     * @param newVault New vault address
     */
    function updateVault(address newVault) external onlyOwner {
        require(newVault != address(0), "Invalid vault address");
        address oldVault = vault;
        vault = newVault;
        emit VaultUpdated(oldVault, newVault);
    }
    
    /**
     * @notice Update fee collector address
     * @param newCollector New fee collector address
     */
    function updateFeeCollector(address newCollector) external onlyOwner {
        require(newCollector != address(0), "Invalid collector address");
        address oldCollector = feeCollector;
        feeCollector = newCollector;
        emit FeeCollectorUpdated(oldCollector, newCollector);
    }
    
    /**
     * @notice Update bridge fee
     * @param newFee New fee in basis points
     */
    function updateBridgeFee(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "Fee too high"); // Max 10%
        uint256 oldFee = bridgeFee;
        bridgeFee = newFee;
        emit BridgeFeeUpdated(oldFee, newFee);
    }
    
    /**
     * @notice Pause bridge operations
     */
    function pause() external onlyOwner {
        paused = true;
        emit Paused();
    }
    
    /**
     * @notice Unpause bridge operations
     */
    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused();
    }
    
    /**
     * @notice Emergency withdraw tokens
     * @param token Token address
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        (bool success, ) = token.call(
            abi.encodeWithSignature("transfer(address,uint256)", msg.sender, amount)
        );
        require(success, "Transfer failed");
    }
}
