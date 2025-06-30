import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  // Get deployed MockWBTC address
  const wbtcDeployment = await deployments.get("MockWBTC");
  
  // Deploy BitPesaWill with enhanced functionality
  await deploy("BitPesaWill", {
    from: deployer,
    args: [
      wbtcDeployment.address, // WBTC address
      deployer,              // Initial executor (can be changed later)
      true,                  // Require executor approval initially
      deployer              // KYC verifier (can be changed later)
    ],
    log: true,
    autoMine: true,
  });

  console.log("Enhanced BitPesaWill deployed successfully");
};

func.tags = ["enhanced-wills", "wills"];
func.dependencies = ["mocks"];

export default func;
