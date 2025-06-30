// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IWBTC is IERC20 {
    function decimals() external view returns (uint8);
}
