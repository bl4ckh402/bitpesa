// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@chainlink/contracts/src/v0.8/shared/interfaces/LinkTokenInterface.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BitPesaPriceConsumer
 * @dev Contract to consume BTC/USD price data from Chainlink Price Feeds
 */
contract BitPesaPriceConsumer is Ownable {
    // Chainlink Price Feed interfaces
    AggregatorV3Interface public btcUsdPriceFeed;
    // Price data
    uint256 public latestBtcPrice;
    uint256 public lastUpdateTimestamp;
    // Events
    event PriceUpdated(uint256 price, uint256 timestamp);
    event PriceFeedChanged(address oldPriceFeed, address newPriceFeed);

    /**
     * @dev Constructor sets the Chainlink Price Feed address
     * @param _btcUsdPriceFeed Address of the BTC/USD price feed
     */
    constructor(address _btcUsdPriceFeed) Ownable(msg.sender) {
        btcUsdPriceFeed = AggregatorV3Interface(_btcUsdPriceFeed);
        updatePrice();
    }

    /**
     * @dev Updates the latest price from the Chainlink Price Feed
     * @return The latest BTC/USD price
     */
    function updatePrice() public returns (uint256) {
        (
            ,
            /* uint80 roundID */ int price,
            ,
            /* uint startedAt */ uint timeStamp /* uint80 answeredInRound */,

        ) = btcUsdPriceFeed.latestRoundData();

        require(price > 0, "Invalid price");

        latestBtcPrice = uint256(price);
        lastUpdateTimestamp = timeStamp;

        emit PriceUpdated(latestBtcPrice, lastUpdateTimestamp);

        return latestBtcPrice;
    }

    /**
     * @dev Gets the latest price without updating storage
     * @return The latest BTC/USD price
     */
    function getLatestPrice() public view returns (uint256) {
        (
            ,
            /* uint80 roundID */ int price /* uint startedAt */ /* uint timeStamp */ /* uint80 answeredInRound */,
            ,
            ,

        ) = btcUsdPriceFeed.latestRoundData();

        require(price > 0, "Invalid price");

        return uint256(price);
    }

    /**
     * @dev Get the number of decimals in the price feed
     * @return The number of decimals
     */
    function getPriceDecimals() public view returns (uint8) {
        return btcUsdPriceFeed.decimals();
    }

    /**
     * @dev Change the price feed address (owner only)
     * @param _newPriceFeed New price feed address
     */
    function changePriceFeed(address _newPriceFeed) external onlyOwner {
        address oldPriceFeed = address(btcUsdPriceFeed);
        btcUsdPriceFeed = AggregatorV3Interface(_newPriceFeed);

        emit PriceFeedChanged(oldPriceFeed, _newPriceFeed);
    }
}
