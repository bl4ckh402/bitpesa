import { deployments } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deploy } = deployments;
  const { deployer } = await hre.getNamedAccounts();

  console.log(`Deploying BitPesaWill with account: ${deployer}`);

  // Get WBTC address from previously deployed contract
  const MockWBTC = await deployments.get("MockWBTC");
  const wbtcAddress = MockWBTC.address;

  // Deploy BitPesaWill
  const bitPesaWill = await deploy("BitPesaWill", {
    from: deployer,
    args: [
      wbtcAddress,     // WBTC address
      deployer,        // Initial executor (can be changed later)
      false            // Initially don't require executor approval
    ],
    log: true,
  });

  console.log(`BitPesaWill deployed to: ${bitPesaWill.address}`);
};

func.tags = ["BitPesaWill", "all"];
func.dependencies = ["MockWBTC"]; // Ensure WBTC is deployed first

export default func;
