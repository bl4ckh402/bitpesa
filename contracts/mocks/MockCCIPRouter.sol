// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@chainlink/contracts-ccip/contracts/interfaces/IRouterClient.sol";
import "@chainlink/contracts-ccip/contracts/libraries/Client.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title MockCCIPRouter
 * @dev A mock implementation of the Chainlink CCIP Router for local testing
 */
contract MockCCIPRouter {
    error InvalidConfig();
    
    // Store sent messages for verification
    struct SentMessage {
        uint64 destinationChainSelector;
        address receiver;
        bytes data;
        address token;
        uint256 amount;
        address feeToken;
        uint256 fee;
    }
    
    SentMessage[] public sentMessages;
    uint256 public messageId = 1;
    
    // Fixed fee amount used for testing
    uint256 public fixedNativeFee = 0.01 ether;
    uint256 public fixedLinkFee = 1 ether; // 1 LINK
    
    /**
     * @notice Returns the fee required for a CCIP message
     * destinationChainSelector The destination chain selector
     * @param message The CCIP message
     * @return fee The fee required
     */
    function getFee(
        uint64 /* destinationChainSelector */,
        Client.EVM2AnyMessage memory message
    ) external view returns (uint256 fee) {
        if (message.feeToken == address(0)) {
            return fixedNativeFee;
        } else {
            return fixedLinkFee;
        }
    }
    
    /**
     * @notice Simulates sending a CCIP message
     * @param destinationChainSelector The destination chain selector
     * @param message The CCIP message
     * @return messageId The ID of the sent message
     */
    function ccipSend(
        uint64 destinationChainSelector,
        Client.EVM2AnyMessage memory message
    ) external payable returns (bytes32) {
        address receiver = abi.decode(message.receiver, (address));
        
        // For token transfers
        if (message.tokenAmounts.length > 0) {
            for (uint256 i = 0; i < message.tokenAmounts.length; i++) {
                // Transfer tokens from sender to this contract (in real router, tokens would be bridged)
                IERC20(message.tokenAmounts[i].token).transferFrom(
                    msg.sender, 
                    address(this), 
                    message.tokenAmounts[i].amount
                );
            }
        }
        
        // Check fees
        if (message.feeToken == address(0)) {
            require(msg.value >= fixedNativeFee, "Insufficient fee");
        } else {
            IERC20(message.feeToken).transferFrom(msg.sender, address(this), fixedLinkFee);
        }
        
        // Store the message
        sentMessages.push(SentMessage({
            destinationChainSelector: destinationChainSelector,
            receiver: receiver,
            data: message.data,
            token: message.tokenAmounts.length > 0 ? message.tokenAmounts[0].token : address(0),
            amount: message.tokenAmounts.length > 0 ? message.tokenAmounts[0].amount : 0,
            feeToken: message.feeToken,
            fee: message.feeToken == address(0) ? msg.value : fixedLinkFee
        }));
        
        bytes32 msgId = bytes32(messageId);
        messageId++;
        
        return msgId;
    }
    
    /**
     * @notice Allows testing the message receipt simulation
     * @param receiver The receiver address 
     * @param sourceChainSelector The source chain selector
     * @param sender The sender address
     * @param token The token address
     * @param amount The token amount
     */
    function simulateMessageReceived(
        address receiver,
        uint64 sourceChainSelector,
        address sender,
        address token,
        uint256 amount
    ) external {
        // Create token amounts array with the specified token and amount
        Client.EVMTokenAmount[] memory tokenAmounts = new Client.EVMTokenAmount[](1);
        tokenAmounts[0] = Client.EVMTokenAmount({
            token: token,
            amount: amount
        });
        
        // Create the message
        Client.Any2EVMMessage memory message = Client.Any2EVMMessage({
            messageId: bytes32(messageId),
            sourceChainSelector: sourceChainSelector,
            sender: abi.encode(sender),
            data: abi.encode(token, amount),
            destTokenAmounts: tokenAmounts
        });
        
        // Call the receiver's ccipReceive function
        bytes memory callData = abi.encodeWithSignature("ccipReceive((bytes32,uint64,bytes,bytes,(address,uint256)[]))", message);
        
        (bool success, ) = receiver.call(callData);
        require(success, "Receiver call failed");
        
        messageId++;
    }
}
