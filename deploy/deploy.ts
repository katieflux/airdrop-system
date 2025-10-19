import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const tokenDeployment = await deploy("ERC7984Token", {
    from: deployer,
    log: true,
  });

  const airdropDeployment = await deploy("EncryptedAirdrop", {
    from: deployer,
    log: true,
    args: [tokenDeployment.address],
  });

  const signer = await hre.ethers.getSigner(deployer);
  const tokenContract = await hre.ethers.getContractAt("ERC7984Token", tokenDeployment.address, signer);
  const mintTx = await tokenContract.mint(deployer, 1_000_000);
  await mintTx.wait();

  const operatorExpiry = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
  const tx = await tokenContract.setOperator(airdropDeployment.address, operatorExpiry);
  await tx.wait();

  console.log(`ERC7984Token contract: ${tokenDeployment.address}`);
  console.log(`EncryptedAirdrop contract: ${airdropDeployment.address}`);
  console.log(`Airdrop operator authorization expires at: ${operatorExpiry}`);
};
export default func;
func.id = "deploy_encrypted_airdrop"; // id required to prevent reexecution
func.tags = ["EncryptedAirdrop"];
