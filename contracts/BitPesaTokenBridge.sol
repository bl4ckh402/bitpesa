// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "@chainlink/contracts-ccip/contracts/interfaces/IRouterClient.sol";
import "@chainlink/contracts-ccip/contracts/libraries/Client.sol";
import "@chainlink/contracts/src/v0.8/vendor/openzeppelin-solidity/v4.8.3/contracts/token/ERC20/IERC20.sol" as CCIPTokenInterface;
import "@chainlink/contracts-ccip/contracts/interfaces/IAny2EVMMessageReceiver.sol";

/**
 * @title BitPesaTokenBridge
 * @dev A cross-chain token bridge using Chainlink CCIP to transfer WBTC between chains
 */
contract BitPesaTokenBridge is ReentrancyGuard, Ownable, IAny2EVMMessageReceiver {
    using SafeERC20 for IERC20;

    // Custom errors for CCIP operations
    error NotEnoughBalance(uint256 currentBalance, uint256 requiredBalance);
    error DestinationChainNotSupported(uint64 destinationChainSelector);
    error NothingToWithdraw();
    error FailedToWithdrawEth(address owner, address target, uint256 value);
    error InvalidReceiverAddress();

    // Event emitted when tokens are sent cross-chain
    event TokensTransferred(
        bytes32 indexed messageId,
        uint64 indexed destinationChainSelector,
        address indexed receiver,
        address token,
        uint256 amount,
        address feeToken
    );

    // Event emitted when tokens are received from another chain
    event TokensReceived(
        bytes32 indexed messageId,
        uint64 indexed sourceChainSelector,
        address indexed sender,
        address token,
        uint256 amount
    );

    // Chainlink CCIP router
    IRouterClient public immutable router;
    
    // LINK token for fee payments
    IERC20 public linkToken;

    // Supported destination chains
    mapping(uint64 => bool) public supportedChains;

    // Constructor
    constructor(address _router, address _linkToken) Ownable(msg.sender) {
        router = IRouterClient(_router);
        linkToken = IERC20(_linkToken);
    }

    /**
     * @dev Modifier that checks if the chain with the given destinationChainSelector is supported.
     * @param chainSelector The selector of the destination chain.
     */
    modifier onlySupportedChain(uint64 chainSelector) {
        if (!supportedChains[chainSelector])
            revert DestinationChainNotSupported(chainSelector);
        _;
    }

    /**
     * @dev Modifier that checks if the receiver address is not 0.
     * @param receiver The receiver address.
     */
    modifier validateReceiver(address receiver) {
        if (receiver == address(0)) revert InvalidReceiverAddress();
        _;
    }

    /**
     * @dev Add a supported destination chain
     * @param chainSelector The chain selector for the destination chain
     */
    function addSupportedChain(uint64 chainSelector) external onlyOwner {
        supportedChains[chainSelector] = true;
    }

    /**
     * @dev Remove a supported destination chain
     * @param chainSelector The chain selector for the destination chain
     */
    function removeSupportedChain(uint64 chainSelector) external onlyOwner {
        supportedChains[chainSelector] = false;
    }

    /**
     * @dev Transfer tokens to another chain
     * @param destinationChainSelector The chain selector for the destination chain
     * @param receiver The address of the receiver on the destination chain
     * @param token The address of the token to transfer
     * @param amount The amount of tokens to transfer
     * @return messageId The ID of the CCIP message
     */
    function transferTokens(
        uint64 destinationChainSelector,
        address receiver,
        address token,
        uint256 amount
    ) external nonReentrant onlySupportedChain(destinationChainSelector) validateReceiver(receiver) returns (bytes32 messageId) {
        require(amount > 0, "Amount must be greater than 0");

        // Transfer tokens from sender to this contract
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        // Approve the Router to spend tokens
        IERC20(token).approve(address(router), amount);

        // Create an EVM2AnyMessage struct in memory with necessary information for sending a cross-chain message
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(receiver), // ABI-encoded receiver address
            data: abi.encode(token, amount), // ABI-encoded data with token and amount
            tokenAmounts: _buildTokenAmounts(token, amount),
            extraArgs: Client._argsToBytes(
                // Additional arguments for CCIP
                Client.EVMExtraArgsV1({gasLimit: 200_000})
            ),
            feeToken: address(0) // Use native blockchain token for fees
        });

        // Get fee amount required for the CCIP transfer
        uint256 fees = router.getFee(destinationChainSelector, message);
        
        // Send the message through the router and store the returned message ID
        messageId = router.ccipSend{value: fees}(destinationChainSelector, message);

        emit TokensTransferred(
            messageId,
            destinationChainSelector,
            receiver,
            token,
            amount,
            address(0)
        );

        return messageId;
    }

    /**
     * @dev Transfer tokens to another chain using native token for fees
     * @param destinationChainSelector The chain selector for the destination chain
     * @param receiver The address of the receiver on the destination chain
     * @param amount The amount of tokens to transfer
     * @return messageId The ID of the CCIP message
     */
    function transferTokensPayNative(
        uint64 destinationChainSelector,
        address receiver,
        address token,
        uint256 amount
    ) external nonReentrant onlySupportedChain(destinationChainSelector) validateReceiver(receiver) returns (bytes32 messageId) {
        require(amount > 0, "Amount must be greater than 0");
        

        // Transfer tokens from sender to this contract
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        // Approve the Router to spend tokens
        IERC20(token).approve(address(router), amount);

        // Create an EVM2AnyMessage struct in memory with necessary information for sending a cross-chain message
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(receiver), // ABI-encoded receiver address
            data: abi.encode(token, amount), // ABI-encoded data with token and amount
            tokenAmounts: _buildTokenAmounts(token, amount),
            extraArgs: Client._argsToBytes(
                // Additional arguments for CCIP using GenericExtraArgsV2
                Client.GenericExtraArgsV2({
                    gasLimit: 200_000,
                    allowOutOfOrderExecution: false
                })
            ),
            feeToken: address(0) // Use native blockchain token for fees
        });

        // Get fee amount required for the CCIP transfer
        uint256 fees = router.getFee(destinationChainSelector, message);
        
        // Check if the contract has enough balance to cover the fees
        if (address(this).balance < fees) {
            revert NotEnoughBalance(address(this).balance, fees);
        }

        // Send the message through the router and store the returned message ID
        messageId = router.ccipSend{value: fees}(destinationChainSelector, message);

        emit TokensTransferred(
            messageId,
            destinationChainSelector,
            receiver,
            token,
            amount,
            address(0)
        );

        return messageId;
    }

    /**
     * @dev Transfer tokens to another chain using LINK token for fees
     * @param destinationChainSelector The chain selector for the destination chain
     * @param receiver The address of the receiver on the destination chain
     * @param amount The amount of tokens to transfer
     * @return messageId The ID of the CCIP message
     */
    function transferTokensPayLink(
        uint64 destinationChainSelector,
        address receiver,
        address token,
        uint256 amount
    ) external nonReentrant onlySupportedChain(destinationChainSelector) validateReceiver(receiver) returns (bytes32 messageId) {
        require(amount > 0, "Amount must be greater than 0");
        

        // Transfer tokens from sender to this contract
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        // Approve the Router to spend tokens
        IERC20(token).approve(address(router), amount);

        // Create an EVM2AnyMessage struct in memory with necessary information for sending a cross-chain message
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(receiver), // ABI-encoded receiver address
            data: abi.encode(token, amount), // ABI-encoded data with token and amount
            tokenAmounts: _buildTokenAmounts(token, amount),
            extraArgs: Client._argsToBytes(
                // Additional arguments for CCIP
                Client.GenericExtraArgsV2({
                    gasLimit: 200_000,
                    allowOutOfOrderExecution: false
                })
            ),
            feeToken: address(linkToken) // Use LINK token for fees
        });

        // Get fee amount required for the CCIP transfer
        uint256 fees = router.getFee(destinationChainSelector, message);
        
        // Check if the contract has enough LINK to pay for fees
        if (linkToken.balanceOf(address(this)) < fees) {
            revert NotEnoughBalance(linkToken.balanceOf(address(this)), fees);
        }

        // Approve the Router to spend LINK tokens for fees
        linkToken.approve(address(router), fees);

        // Send the message through the router and store the returned message ID
        messageId = router.ccipSend(destinationChainSelector, message);

        emit TokensTransferred(
            messageId,
            destinationChainSelector,
            receiver,
            token,
            amount,
            address(linkToken)
        );

        return messageId;
    }

    /**
     * @dev Helper function to build the tokenAmounts array for the CCIP message
     * @param token The token address
     * @param amount The token amount
     * @return tokenAmounts An array of Client.EVMTokenAmount structs
     */
    function _buildTokenAmounts(address token, uint256 amount) internal pure returns (Client.EVMTokenAmount[] memory) {
        Client.EVMTokenAmount[] memory tokenAmounts = new Client.EVMTokenAmount[](1);
        tokenAmounts[0] = Client.EVMTokenAmount({
            token: token,
            amount: amount
        });
        return tokenAmounts;
    }
    
    /**
     * @dev Handle receiving tokens from another chain through CCIP
     * @param message The CCIP message containing the token transfer details
     */
    function ccipReceive(Client.Any2EVMMessage calldata message) external override nonReentrant {
        // Verify that the message is from the router
        require(msg.sender == address(router), "Only router can call ccipReceive");
        
        // Decode the sender address from the message
        address sender = abi.decode(message.sender, (address));
        
        // Check if we received any tokens
        if (message.destTokenAmounts.length > 0) {
            // In the current CCIP version, the field is called destTokenAmounts
            Client.EVMTokenAmount memory tokenAmount = message.destTokenAmounts[0];
            
            // Emit an event with the details of the received tokens
            emit TokensReceived(
                message.messageId,
                message.sourceChainSelector,
                sender,
                tokenAmount.token,
                tokenAmount.amount
            );
        }
    }

    /**
     * @notice Allows the owner to withdraw ETH from the contract
     * @param amount The amount of ETH to withdraw
     */
    function withdrawETH(uint256 amount) external onlyOwner {
        if (address(this).balance < amount) {
            revert NotEnoughBalance(address(this).balance, amount);
        }

        (bool sent, ) = msg.sender.call{value: amount}("");
        if (!sent) {
            revert FailedToWithdrawEth(msg.sender, msg.sender, amount);
        }
    }

    /**
     * @notice Allows the owner to withdraw tokens from the contract
     * @param token The token to withdraw
     * @param amount The amount of tokens to withdraw
     */
    function withdrawToken(address token, uint256 amount) external onlyOwner {
        if (IERC20(token).balanceOf(address(this)) < amount) {
            revert NotEnoughBalance(IERC20(token).balanceOf(address(this)), amount);
        }

        IERC20(token).safeTransfer(msg.sender, amount);
    }

    /**
     * @dev Allow the contract to receive Ether for CCIP fees
     */
    receive() external payable {}
}
