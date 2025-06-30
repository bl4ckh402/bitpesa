import { ethers } from "hardhat";
import { expect } from "chai";
import { BitPesaLending, BitPesaPriceConsumer, BitPesaTokenBridge } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("BitPesa Lending Platform", function () {
  // Test variables
  let lendingPlatform: BitPesaLending;
  let priceConsumer: BitPesaPriceConsumer;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  
  // Mock token addresses
  const MOCK_WBTC_ADDRESS = "0x1E3857fd780FD7ab35Ce19e37D6789bB5d45Ebd8";
  const MOCK_USDC_ADDRESS = "0xa4Ec7d8543490C093928B5d5645340a403c3a337";
  const MOCK_BTC_PRICE_FEED = "0x31CF013A08c6Ac228C94551d535d5BAfE19c602a";

  before(async () => {
    // Get signers
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy contracts
    const PriceConsumerFactory = await ethers.getContractFactory("BitPesaPriceConsumer");
    priceConsumer = await PriceConsumerFactory.deploy(MOCK_BTC_PRICE_FEED);
    
    const LendingPlatformFactory = await ethers.getContractFactory("BitPesaLending");
    lendingPlatform = await LendingPlatformFactory.deploy(
      MOCK_WBTC_ADDRESS,
      MOCK_USDC_ADDRESS,
      MOCK_BTC_PRICE_FEED
    );
  });

  describe("Contract Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await lendingPlatform.owner()).to.equal(owner.address);
      expect(await priceConsumer.owner()).to.equal(owner.address);
    });

    it("Should initialize with correct addresses", async function () {
      expect(await lendingPlatform.wbtcAddress()).to.equal(MOCK_WBTC_ADDRESS);
      expect(await lendingPlatform.stablecoinAddress()).to.equal(MOCK_USDC_ADDRESS);
      expect(await lendingPlatform.btcUsdPriceFeed()).to.equal(MOCK_BTC_PRICE_FEED);
    });
  });

  // For real testing, we would need to setup mocks for WBTC, USDC, and Chainlink oracles
  // This is only a basic structure
});

describe("BitPesa Price Consumer", function () {
  // Test variables
  let priceConsumer: BitPesaPriceConsumer;
  let owner: SignerWithAddress;
  
  // Mock address
  const MOCK_BTC_PRICE_FEED = "0x31CF013A08c6Ac228C94551d535d5BAfE19c602a";

  before(async () => {
    // Get signers
    [owner] = await ethers.getSigners();

    // Deploy contracts
    const PriceConsumerFactory = await ethers.getContractFactory("BitPesaPriceConsumer");
    priceConsumer = await PriceConsumerFactory.deploy(MOCK_BTC_PRICE_FEED);
  });

  describe("Contract Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await priceConsumer.owner()).to.equal(owner.address);
    });

    it("Should initialize with correct price feed address", async function () {
      expect(await priceConsumer.btcUsdPriceFeed()).to.equal(MOCK_BTC_PRICE_FEED);
    });
  });
});

describe("BitPesa Token Bridge", function () {
  // Test variables
  let tokenBridge: BitPesaTokenBridge;
  let owner: SignerWithAddress;
  
  // Mock addresses
  const MOCK_CCIP_ROUTER = "0x554472a2720E5E7D5D3C817529aBA05EEd5F82D8";
  const MOCK_WBTC_ADDRESS = "0x50b7545627a5162F82A992c33b87aDc75187B218";

  before(async () => {
    // Get signers
    [owner] = await ethers.getSigners();

    // Deploy contract
    const TokenBridgeFactory = await ethers.getContractFactory("BitPesaTokenBridge");
    tokenBridge = await TokenBridgeFactory.deploy(MOCK_CCIP_ROUTER, MOCK_WBTC_ADDRESS);
  });

  describe("Contract Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await tokenBridge.owner()).to.equal(owner.address);
    });

    it("Should initialize with correct addresses", async function () {
      expect(await tokenBridge.router()).to.equal(MOCK_CCIP_ROUTER);
      expect(await tokenBridge.wbtcAddress()).to.equal(MOCK_WBTC_ADDRESS);
    });
  });

  describe("Chain Management", function () {
    const TEST_CHAIN_SELECTOR = 12345n;
    
    it("Should add a supported chain", async function () {
      await tokenBridge.addSupportedChain(TEST_CHAIN_SELECTOR);
      expect(await tokenBridge.supportedChains(TEST_CHAIN_SELECTOR)).to.be.true;
    });
    
    it("Should remove a supported chain", async function () {
      await tokenBridge.removeSupportedChain(TEST_CHAIN_SELECTOR);
      expect(await tokenBridge.supportedChains(TEST_CHAIN_SELECTOR)).to.be.false;
    });
  });
  
  // Further tests would require mocking the CCIP Router
});
