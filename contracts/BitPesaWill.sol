// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";

/**
 * @title BitPesa Will
 * @dev A smart contract that allows users to create crypto wills for their WBTC assets
 * Users can designate beneficiaries who will receive their assets after a specified inactivity period
 * Uses Chainlink Automation for checking inactivity periods
 */
contract BitPesaWill is
    ReentrancyGuard,
    Ownable(msg.sender),
    AutomationCompatibleInterface
{
    using SafeERC20 for IERC20;

    // Token address
    address public wbtcAddress;

    // KYC verification status
    mapping(address => bool) public isUserVerified;
      // Additional release conditions
    enum ReleaseCondition {
        INACTIVITY,          // Default: Release after inactivity period
        MANUAL_EXECUTOR,     // Release requires manual executor approval
        DEATH_CERTIFICATE,   // Release requires death certificate validation (off-chain)
        SCHEDULED_RELEASE    // Release on specific timestamp
    }

    // Will structure
    struct Will {
        uint256 id;
        address creator;
        uint256 assetsAmount; // In WBTC
        address[] beneficiaries;
        uint256[] shares; // Each share is a percentage out of 10000 (100.00%)
        uint256 lastActivityTimestamp;
        uint256 inactivityPeriod; // In seconds
        bool executed;
        string metadataURI; // URI for off-chain will details, legal documents, etc.
        ReleaseCondition releaseCondition;
        uint256 scheduledReleaseTime; // Only used for SCHEDULED_RELEASE condition
        bool requiresVerifiedBeneficiaries; // Whether beneficiaries need KYC verification
        string kycReference; // Reference to off-chain KYC verification
    }

    // Death certificate validation
    struct DeathCertificate {
        bool isValid;
        string certificateURI;
        address validatedBy;
        uint256 validationTimestamp;
    }
    
    // Mapping from will ID to will details
    mapping(uint256 => Will) public wills;
    uint256 public nextWillId;

    // Mapping from user to their will IDs
    mapping(address => uint256[]) public userWills;
    
    // Mapping from will ID to death certificate (if applicable)
    mapping(uint256 => DeathCertificate) public deathCertificates;

    // Executor authority (could be a trusted entity or a multisig)
    address public executor;
    bool public requireExecutorApproval;
    
    // KYC verifier role
    address public kycVerifier;

    // Events
    event WillCreated(
        uint256 indexed willId,
        address indexed creator,
        uint256 assetsAmount,
        uint256 inactivityPeriod,
        string metadataURI,
        ReleaseCondition releaseCondition
    );
    event WillUpdated(uint256 indexed willId, uint256 assetsAmount, string metadataURI);
    event BeneficiaryAdded(uint256 indexed willId, address beneficiary, uint256 share);
    event BeneficiaryRemoved(uint256 indexed willId, address beneficiary);
    event ActivityRegistered(uint256 indexed willId, uint256 timestamp);
    event WillExecuted(uint256 indexed willId, address[] beneficiaries, uint256[] amounts);
    event UserVerified(address indexed user, string kycReference);
    event DeathCertificateValidated(uint256 indexed willId, string certificateURI);

    /**
     * @dev Constructor initializes the contract with the WBTC token address
     * @param _wbtcAddress Address of the WBTC token
     * @param _executor Address of the initial executor (can be multisig)
     * @param _requireExecApproval Whether executor approval is required for will execution
     * @param _kycVerifier Address of the KYC verifier
     */
    constructor(
        address _wbtcAddress,
        address _executor,
        bool _requireExecApproval,
        address _kycVerifier
    ) {
        wbtcAddress = _wbtcAddress;
        executor = _executor;
        requireExecutorApproval = _requireExecApproval;
        kycVerifier = _kycVerifier;
    }

    /**
     * @dev Modifier to check if a user is KYC verified
     */
    modifier onlyVerifiedUser() {
        require(isUserVerified[msg.sender], "User not KYC verified");
       _;
    }
    
    /**
     * @dev Modifier to check if caller is the KYC verifier
     */
    modifier onlyKycVerifier() {
        require(msg.sender == kycVerifier, "Only KYC verifier can call this");
       _;
    }

    /**
     * @dev Verify a user's KYC status (can only be called by the KYC verifier)
     * @param _user Address of the user to verify
     * @param _kycReference Reference to off-chain KYC verification
     */
    function verifyUser(address _user, string memory _kycReference) external onlyKycVerifier {
        isUserVerified[_user] = true;
        emit UserVerified(_user, _kycReference);
    }
    
    /**
     * @dev Creates a new will
     * @param _assetsAmount Amount of WBTC to allocate to this will
     * @param _beneficiaries Array of beneficiary addresses
     * @param _shares Array of shares for each beneficiary (out of 10000)
     * @param _inactivityPeriod Period of inactivity after which the will can be executed (in seconds)
     * @param _metadataURI URI for off-chain will details
     * @param _releaseCondition Condition for releasing the assets
     * @param _scheduledReleaseTime Timestamp for scheduled release (only used for SCHEDULED_RELEASE condition)
     * @param _requiresVerifiedBeneficiaries Whether beneficiaries need KYC verification
     * @param _kycReference Reference to off-chain KYC verification
     * @return willId ID of the created will
     */
    function createWill(
        uint256 _assetsAmount,
        address[] memory _beneficiaries,
        uint256[] memory _shares,
        uint256 _inactivityPeriod,
        string memory _metadataURI,
        ReleaseCondition _releaseCondition,
        uint256 _scheduledReleaseTime,
        bool _requiresVerifiedBeneficiaries,
        string memory _kycReference
    ) external nonReentrant onlyVerifiedUser returns (uint256 willId) {
        require(_beneficiaries.length > 0, "Must have at least one beneficiary");
        require(_beneficiaries.length == _shares.length, "Beneficiaries and shares must match");
        
        // If beneficiaries require verification, check that they are all verified
        if (_requiresVerifiedBeneficiaries) {
            for (uint256 i = 0; i < _beneficiaries.length; i++) {
                require(isUserVerified[_beneficiaries[i]], "Not all beneficiaries are verified");
            }
        }
        
        // For scheduled release, ensure the scheduled time is in the future
        if (_releaseCondition == ReleaseCondition.SCHEDULED_RELEASE) {
            require(_scheduledReleaseTime > block.timestamp, "Scheduled time must be in future");
        }
        
        uint256 totalShares = 0;
        for (uint256 i = 0; i < _shares.length; i++) {
            totalShares += _shares[i];
        }
        require(totalShares == 10000, "Total shares must equal 10000 (100.00%)");
        
        // Transfer WBTC to the contract
        if (_assetsAmount > 0) {
            IERC20(wbtcAddress).safeTransferFrom(msg.sender, address(this), _assetsAmount);
        }
        
        // Create the will
        willId = nextWillId++;
        Will storage newWill = wills[willId];
        newWill.id = willId;
        newWill.creator = msg.sender;
        newWill.assetsAmount = _assetsAmount;
        newWill.beneficiaries = _beneficiaries;
        newWill.shares = _shares;
        newWill.lastActivityTimestamp = block.timestamp;
        newWill.inactivityPeriod = _inactivityPeriod;
        newWill.executed = false;
        newWill.metadataURI = _metadataURI;
        newWill.releaseCondition = _releaseCondition;
        newWill.scheduledReleaseTime = _scheduledReleaseTime;
        newWill.requiresVerifiedBeneficiaries = _requiresVerifiedBeneficiaries;
        newWill.kycReference = _kycReference;
        
        // Add will to user's wills
        userWills[msg.sender].push(willId);
        
        emit WillCreated(willId, msg.sender, _assetsAmount, _inactivityPeriod, _metadataURI, _releaseCondition);
        return willId;
    }

    /**
     * @dev Updates an existing will
     * @param _willId ID of the will to update
     * @param _assetsAmount New amount of WBTC to allocate
     * @param _metadataURI New URI for off-chain will details
     */
    function updateWill(
        uint256 _willId,
        uint256 _assetsAmount,
        string memory _metadataURI
    ) external nonReentrant {
        Will storage will = wills[_willId];
        
        require(will.creator == msg.sender, "Only creator can update will");
        require(!will.executed, "Will already executed");
        
        if (_assetsAmount > will.assetsAmount) {
            // Transfer additional WBTC to the contract
            uint256 additionalAmount = _assetsAmount - will.assetsAmount;
            IERC20(wbtcAddress).safeTransferFrom(msg.sender, address(this), additionalAmount);
        } else if (_assetsAmount < will.assetsAmount) {
            // Return excess WBTC to the creator
            uint256 excessAmount = will.assetsAmount - _assetsAmount;
            IERC20(wbtcAddress).safeTransfer(msg.sender, excessAmount);
        }
        
        will.assetsAmount = _assetsAmount;
        will.metadataURI = _metadataURI;
        will.lastActivityTimestamp = block.timestamp;
        
        emit WillUpdated(_willId, _assetsAmount, _metadataURI);
        emit ActivityRegistered(_willId, block.timestamp);
    }

    /**
     * @dev Updates beneficiaries and their shares for an existing will
     * @param _willId ID of the will to update
     * @param _beneficiaries Array of beneficiary addresses
     * @param _shares Array of shares for each beneficiary
     */
    function updateBeneficiaries(
        uint256 _willId,
        address[] memory _beneficiaries,
        uint256[] memory _shares
    ) external nonReentrant {
        Will storage will = wills[_willId];
        
        require(will.creator == msg.sender, "Only creator can update will");
        require(!will.executed, "Will already executed");
        require(_beneficiaries.length > 0, "Must have at least one beneficiary");
        require(_beneficiaries.length == _shares.length, "Beneficiaries and shares must match");
        
        // If beneficiaries require verification, check that they are all verified
        if (will.requiresVerifiedBeneficiaries) {
            for (uint256 i = 0; i < _beneficiaries.length; i++) {
                require(isUserVerified[_beneficiaries[i]], "Not all beneficiaries are verified");
            }
        }
        
        uint256 totalShares = 0;
        for (uint256 i = 0; i < _shares.length; i++) {
            totalShares += _shares[i];
        }
        require(totalShares == 10000, "Total shares must equal 10000 (100.00%)");
        
        will.beneficiaries = _beneficiaries;
        will.shares = _shares;
        will.lastActivityTimestamp = block.timestamp;
        
        emit ActivityRegistered(_willId, block.timestamp);
    }

    /**
     * @dev Register activity for a will to prevent execution
     * @param _willId ID of the will
     */
    function registerActivity(uint256 _willId) external {
        Will storage will = wills[_willId];
        
        require(will.creator == msg.sender, "Only creator can register activity");
        require(!will.executed, "Will already executed");
        
        will.lastActivityTimestamp = block.timestamp;
        
        emit ActivityRegistered(_willId, block.timestamp);
    }

    /**
     * @dev Submit and validate a death certificate for a will
     * @param _willId ID of the will
     * @param _certificateURI URI reference to the death certificate
     */
    function validateDeathCertificate(
        uint256 _willId, 
        string memory _certificateURI
    ) external onlyKycVerifier {
        Will storage will = wills[_willId];
        
        require(!will.executed, "Will already executed");
        require(
            will.releaseCondition == ReleaseCondition.DEATH_CERTIFICATE, 
            "Will does not require death certificate"
        );
        
        DeathCertificate storage certificate = deathCertificates[_willId];
        certificate.isValid = true;
        certificate.certificateURI = _certificateURI;
        certificate.validatedBy = msg.sender;
        certificate.validationTimestamp = block.timestamp;
        
        emit DeathCertificateValidated(_willId, _certificateURI);
    }

    /**
     * @dev Revokes a will and returns assets to the creator
     * @param _willId ID of the will to revoke
     */
    function revokeWill(uint256 _willId) external nonReentrant {
        Will storage will = wills[_willId];
        
        require(will.creator == msg.sender, "Only creator can revoke will");
        require(!will.executed, "Will already executed");
        
        // Return assets to the creator
        if (will.assetsAmount > 0) {
            IERC20(wbtcAddress).safeTransfer(will.creator, will.assetsAmount);
        }
        
        // Mark as executed (effectively removing it)
        will.executed = true;
        will.assetsAmount = 0;
        
        emit WillExecuted(_willId, new address[](0), new uint256[](0));
    }

    /**
     * @dev Execute a will based on its release conditions
     * @param _willId ID of the will to execute
     */
    function executeWill(uint256 _willId) external nonReentrant {
        Will storage will = wills[_willId];
        
        require(!will.executed, "Will already executed");
        
        // Check release conditions based on the will's specified condition
        if (will.releaseCondition == ReleaseCondition.INACTIVITY) {
            require(
                block.timestamp >= will.lastActivityTimestamp + will.inactivityPeriod,
                "Inactivity period not reached"
            );
        } else if (will.releaseCondition == ReleaseCondition.MANUAL_EXECUTOR) {
            require(msg.sender == executor, "Only executor can execute this will");
        } else if (will.releaseCondition == ReleaseCondition.DEATH_CERTIFICATE) {
            require(deathCertificates[_willId].isValid, "Valid death certificate required");
        } else if (will.releaseCondition == ReleaseCondition.SCHEDULED_RELEASE) {
            require(
                block.timestamp >= will.scheduledReleaseTime,
                "Scheduled release time not reached"
            );
        }
        
        // General executor approval check if required
        if (requireExecutorApproval && will.releaseCondition != ReleaseCondition.MANUAL_EXECUTOR) {
            require(msg.sender == executor, "Only executor can execute will");
        }
        
        uint256[] memory amounts = new uint256[](will.beneficiaries.length);
        
        // Calculate and transfer assets to beneficiaries
        for (uint256 i = 0; i < will.beneficiaries.length; i++) {
            uint256 amount = (will.assetsAmount * will.shares[i]) / 10000;
            amounts[i] = amount;
            
            if (amount > 0) {
                IERC20(wbtcAddress).safeTransfer(will.beneficiaries[i], amount);
            }
        }
        
        will.executed = true;
        
        emit WillExecuted(_willId, will.beneficiaries, amounts);
    }

    /**
     * @dev Get all wills created by a user
     * @param _user Address of the user
     * @return willIds Array of will IDs created by the user
     */
    function getWillsByUser(address _user) external view returns (uint256[] memory) {
        return userWills[_user];
    }    /**
     * @dev Get details of a specific will
     * @param _willId ID of the will
     * @return id Will ID
     * @return creator Address of will creator
     * @return assetsAmount Amount of assets (WBTC)
     * @return beneficiaries Array of beneficiary addresses
     * @return shares Array of shares for each beneficiary
     * @return lastActivityTimestamp Last activity timestamp
     * @return inactivityPeriod Inactivity period in seconds
     * @return executed Whether the will has been executed
     * @return metadataURI URI for off-chain will details
     * @return releaseCondition Condition for releasing the assets
     * @return scheduledReleaseTime Timestamp for scheduled release
     * @return requiresVerifiedBeneficiaries Whether beneficiaries need KYC verification
     * @return kycReference Reference to off-chain KYC verification
     */
    function getWillDetails(uint256 _willId) external view returns (
        uint256 id,
        address creator,
        uint256 assetsAmount,
        address[] memory beneficiaries,
        uint256[] memory shares,
        uint256 lastActivityTimestamp,
        uint256 inactivityPeriod,
        bool executed,
        string memory metadataURI,
        ReleaseCondition releaseCondition,
        uint256 scheduledReleaseTime,
        bool requiresVerifiedBeneficiaries,
        string memory kycReference
    ) {
        Will storage will = wills[_willId];
        return (
            will.id,
            will.creator,
            will.assetsAmount,
            will.beneficiaries,
            will.shares,
            will.lastActivityTimestamp,
            will.inactivityPeriod,
            will.executed,
            will.metadataURI,
            will.releaseCondition,
            will.scheduledReleaseTime,
            will.requiresVerifiedBeneficiaries,
            will.kycReference
        );
    }

    /**
     * @dev Check if a will is ready for execution
     * @param _willId ID of the will
     * @return isReady Whether the will is ready for execution
     */
    function isWillReadyForExecution(uint256 _willId) public view returns (bool) {
        Will storage will = wills[_willId];
        
        if (will.executed) {
            return false;
        }
        
        if (will.releaseCondition == ReleaseCondition.INACTIVITY) {
            return block.timestamp >= will.lastActivityTimestamp + will.inactivityPeriod;
        } else if (will.releaseCondition == ReleaseCondition.DEATH_CERTIFICATE) {
            return deathCertificates[_willId].isValid;
        } else if (will.releaseCondition == ReleaseCondition.SCHEDULED_RELEASE) {
            return block.timestamp >= will.scheduledReleaseTime;
        }
        
        // MANUAL_EXECUTOR always returns false here as it requires executor
        return false;
    }

    /**
     * @dev Update executor address (only by owner)
     * @param _newExecutor Address of the new executor
     */
    function setExecutor(address _newExecutor) external onlyOwner {
        executor = _newExecutor;
    }

    /**
     * @dev Update executor approval requirement (only by owner)
     * @param _requireApproval Whether executor approval is required for will execution
     */
    function setRequireExecutorApproval(bool _requireApproval) external onlyOwner {
        requireExecutorApproval = _requireApproval;
    }
    
    /**
     * @dev Update KYC verifier address (only by owner)
     * @param _newKycVerifier Address of the new KYC verifier
     */
    function setKycVerifier(address _newKycVerifier) external onlyOwner {
        kycVerifier = _newKycVerifier;
    }
    
    /**
     * @dev Implementation for Chainlink Automation
     * @param checkData Data passed to the checkUpkeep function
     * @return upkeepNeeded Whether upkeep is needed
     * @return performData Data to be passed to the performUpkeep function
     */
    function checkUpkeep(
        bytes calldata checkData
    ) external view override returns (bool upkeepNeeded, bytes memory performData) {
        uint256 startId = abi.decode(checkData, (uint256));
        uint256 endId = nextWillId;
        uint256 batchSize = 10;
        if (endId > startId + batchSize) {
            endId = startId + batchSize;
        }
        
        // Find up to 5 wills that are ready for execution
        uint256[] memory readyWillIds = new uint256[](5);
        uint256 readyCount = 0;
        
        for (uint256 i = startId; i < endId && readyCount < 5; i++) {
            if (isWillReadyForExecution(i)) {
                readyWillIds[readyCount] = i;
                readyCount++;
            }
        }
        
        // Prepare next batch ID
        uint256 nextBatchId = endId < nextWillId ? endId : 0;
        
        // Pack the results: next batch ID and ready will IDs
        if (readyCount > 0) {
            upkeepNeeded = true;
            performData = abi.encode(nextBatchId, readyCount, readyWillIds);
        } else {
            upkeepNeeded = nextBatchId > 0;
            performData = abi.encode(nextBatchId, 0, readyWillIds);
        }
    }
    
    /**
     * @dev Implementation for Chainlink Automation
     * @param performData Data passed from the checkUpkeep function
     */
    function performUpkeep(bytes calldata performData) external override {
        (/* uint256 nextBatchId */, uint256 readyCount, uint256[] memory readyWillIds) = 
            abi.decode(performData, (uint256, uint256, uint256[]));
        
        // Execute ready wills
        for (uint256 i = 0; i < readyCount; i++) {
            try this.executeWill(readyWillIds[i]) {
                // Will executed successfully
            } catch {
                // Skip failed executions
            }
        }
    }
}
