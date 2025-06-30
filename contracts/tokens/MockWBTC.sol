// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Mock WBTC
 * @dev A mock implementation of Wrapped Bitcoin for testing purposes
 */
contract MockWBTC is ERC20, Ownable {
    uint8 private _decimals = 8; // WBTC uses 8 decimals like BTC

    /**
     * @dev Constructor that initializes the token with name, symbol and mints initial supply to deployer     */
    constructor() ERC20("Wrapped Bitcoin", "WBTC") Ownable(msg.sender) {
        // 100 WBTC initial supply - minting more to your address for testing
        _mint(msg.sender, 21000000 * 10**_decimals);
    }

    /**
     * @dev Returns the number of decimals used for token
     */
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    /**
     * @dev Mints new tokens to a specified address (only owner can call)
     * @param to The address to mint tokens to
     * @param amount The amount of tokens to mint
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev Burns tokens from the caller's account
     * @param amount The amount of tokens to burn
     */
    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }
}
