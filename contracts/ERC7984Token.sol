// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.27;

import {ERC7984} from "@openzeppelin/confidential-contracts/token/ERC7984/ERC7984.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {FHE, euint64} from "@fhevm/solidity/lib/FHE.sol";

contract ERC7984Token is ERC7984, SepoliaConfig {
    error ZeroAddress();

    constructor() ERC7984("TEST", "TEST", "") {}

    function mint(address to, uint64 amount) external {
        if (to == address(0)) revert ZeroAddress();
        euint64 encryptedAmount = FHE.asEuint64(amount);
        _mint(to, encryptedAmount);
    }
}
