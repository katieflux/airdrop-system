// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FHE, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {IERC7984} from "@openzeppelin/confidential-contracts/interfaces/IERC7984.sol";

/// @title Encrypted token airdrop powered by Zama FHEVM
/// @notice Allows an owner to configure encrypted allocations that recipients can decrypt and claim
contract EncryptedAirdrop is SepoliaConfig {
    IERC7984 public immutable token;
    address private _owner;

    mapping(address account => euint64 amount) private _allocations;
    mapping(address account => bool) private _hasAllocation;
    mapping(address account => bool) private _claimed;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event TokensDeposited(address indexed funder, euint64 encryptedAmount);
    event AllocationConfigured(address indexed recipient, euint64 encryptedAmount, bool isUpdate);
    event AllocationCleared(address indexed recipient);
    event AirdropClaimed(address indexed recipient, euint64 encryptedAmount);

    error NotOwner();
    error ZeroAddress();
    error NoAllocation();
    error AlreadyClaimed();
    error LengthMismatch();

    modifier onlyOwner() {
        if (msg.sender != _owner) revert NotOwner();
        _;
    }

    constructor(IERC7984 token_) {
        if (address(token_) == address(0)) revert ZeroAddress();
        token = token_;
        _owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    function owner() external view returns (address) {
        return _owner;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        address previousOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(previousOwner, newOwner);
    }

    function depositTokens(externalEuint64 encryptedAmount, bytes calldata inputProof) external onlyOwner {
        euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);
        FHE.allow(amount, address(token));
        FHE.allow(amount, msg.sender);
        FHE.allowThis(amount);
        euint64 transferred = token.confidentialTransferFrom(msg.sender, address(this), amount);
        FHE.allowThis(transferred);
        emit TokensDeposited(msg.sender, transferred);
    }

    function setAllocation(
        address recipient,
        externalEuint64 encryptedAmount,
        bytes calldata inputProof
    ) public onlyOwner {
        if (recipient == address(0)) revert ZeroAddress();

        bool isUpdate = _hasAllocation[recipient] || _claimed[recipient];
        euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);

        _allocations[recipient] = amount;
        _hasAllocation[recipient] = true;
        _claimed[recipient] = false;

        FHE.allowThis(amount);
        FHE.allow(amount, address(token));
        FHE.allow(amount, recipient);

        emit AllocationConfigured(recipient, amount, isUpdate);
    }

    function batchSetAllocations(
        address[] calldata recipients,
        externalEuint64[] calldata encryptedAmounts,
        bytes[] calldata inputProofs
    ) external onlyOwner {
        uint256 length = recipients.length;
        if (length != encryptedAmounts.length || length != inputProofs.length) revert LengthMismatch();

        for (uint256 i = 0; i < length; i++) {
            setAllocation(recipients[i], encryptedAmounts[i], inputProofs[i]);
        }
    }

    function clearAllocation(address recipient) external onlyOwner {
        if (recipient == address(0)) revert ZeroAddress();
        if (!_hasAllocation[recipient]) revert NoAllocation();

        _allocations[recipient] = FHE.asEuint64(0);
        _hasAllocation[recipient] = false;
        _claimed[recipient] = false;

        emit AllocationCleared(recipient);
    }

    function claim() external {
        address account = msg.sender;
        if (!_hasAllocation[account]) revert NoAllocation();
        if (_claimed[account]) revert AlreadyClaimed();

        euint64 amount = _allocations[account];

        euint64 transferred = token.confidentialTransfer(account, amount);
        FHE.allowThis(transferred);

        _claimed[account] = true;
        _hasAllocation[account] = false;
        _allocations[account] = FHE.asEuint64(0);

        emit AirdropClaimed(account, transferred);
    }

    function hasAllocation(address account) external view returns (bool) {
        return _hasAllocation[account];
    }

    function hasClaimed(address account) external view returns (bool) {
        return _claimed[account];
    }

    function getEncryptedAllocation(address account) external view returns (euint64) {
        return _allocations[account];
    }
}
