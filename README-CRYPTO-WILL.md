# BitPesa Crypto Will Service

This document provides information about the BitPesa Crypto Will service, which allows users to create digital wills for their crypto assets, ensuring they are transferred to designated beneficiaries upon specific conditions.

## Overview

BitPesa Crypto Will is a decentralized service that enables users to create digital wills for their WBTC assets, with plans to expand to other assets in the future. The service combines blockchain technology with traditional legal frameworks to provide secure and reliable asset transfer upon death, incapacitation, or other specified conditions.

## Key Features

- **KYC Verification**: User identity verification for compliance with regulations
- **Multiple Release Conditions**:
  - Inactivity period detection ("dead man's switch")
  - Death certificate validation
  - Scheduled release
  - Manual executor approval
- **Multi-Beneficiary Support**: Designate multiple beneficiaries with custom percentage allocations
- **Chainlink Automation**: Automatic checking of inactivity periods
- **Activity Registration**: Register activity to reset inactivity timer
- **Executor Authority**: Optional trusted third-party approval for will execution
- **Metadata Storage**: Off-chain storage of additional will details via IPFS
- **Beneficiary Verification**: Optional KYC verification for beneficiaries

## Creating a Will

To create a crypto will using BitPesa:

1. Complete KYC verification to ensure legal compliance
2. Connect your wallet containing WBTC assets
3. Designate beneficiaries and their respective shares
4. Choose your preferred release condition:
   - Inactivity period (e.g., no activity for 12 months)
   - Death certificate validation
   - Scheduled release at a specific future date
   - Manual execution by a trusted executor
5. Set additional parameters like inactivity period length
6. Provide off-chain metadata for additional legal documentation
7. Approve and sign the transaction

## Security Measures

- **Smart Contract Security**: Audited and secure smart contracts
- **Multi-signature Options**: Requirement for multiple approvals for critical actions
- **KYC Verification**: Identity verification for both will creators and beneficiaries
- **Activity Monitoring**: Regular prompts for activity registration
- **Executor Authority**: Optional trusted third-party verification
- **Death Certificate Validation**: Verification by designated authorities

## Technical Details

The BitPesa Crypto Will service is built on the following technologies:

- **Smart Contracts**: Ethereum-compatible solidity smart contracts
- **Chainlink Automation**: For automated checking of inactivity periods
- **IPFS**: For storing off-chain will metadata and documents
- **Supabase Database**: For tracking will creation and execution events
- **Web3 Integration**: For wallet connections and transaction signing

## Legal Considerations

While BitPesa Crypto Will provides a technical solution for digital asset inheritance, users are advised to also:

- Consult with legal professionals in their jurisdiction
- Create traditional legal wills that reference their BitPesa Crypto Will
- Keep beneficiaries informed about the existence and details of the will
- Regularly review and update their will as needed

## Future Developments

- Support for additional crypto assets beyond WBTC
- Integration with traditional estate planning services
- Enhanced privacy features
- Multi-chain support
