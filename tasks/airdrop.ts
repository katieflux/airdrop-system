import { FhevmType } from "@fhevm/hardhat-plugin";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

task("task:airdrop-address", "Print deployed airdrop addresses").setAction(
  async function (_taskArguments: TaskArguments, hre) {
    const { deployments } = hre;

    const token = await deployments.get("ERC7984Token");
    const airdrop = await deployments.get("EncryptedAirdrop");

    console.log(`ERC7984Token address      : ${token.address}`);
    console.log(`EncryptedAirdrop address  : ${airdrop.address}`);
  },
);

task("task:airdrop-deposit", "Deposit encrypted TEST tokens into the airdrop contract")
  .addParam("amount", "Unsigned integer amount to encrypt and deposit")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { deployments, ethers, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const [owner] = await ethers.getSigners();
    const airdropDeployment = await deployments.get("EncryptedAirdrop");
    const tokenDeployment = await deployments.get("ERC7984Token");

    const token = await ethers.getContractAt("ERC7984Token", tokenDeployment.address);
    const airdrop = await ethers.getContractAt("EncryptedAirdrop", airdropDeployment.address);

    const amount = BigInt(taskArguments.amount);
    const encrypted = await fhevm
      .createEncryptedInput(airdropDeployment.address, owner.address)
      .add64(amount)
      .encrypt();

    const txOperator = await token.connect(owner).setOperator(airdropDeployment.address, Math.floor(Date.now() / 1000) + 86_400);
    await txOperator.wait();

    const tx = await airdrop
      .connect(owner)
      .depositTokens(encrypted.handles[0], encrypted.inputProof);
    console.log(`Deposit tx: ${tx.hash}`);
    await tx.wait();
    console.log("Deposit confirmed");
  });

task("task:airdrop-allocate", "Configure an encrypted allocation for a wallet")
  .addParam("recipient", "Wallet to receive the allocation")
  .addParam("amount", "Unsigned integer amount to encrypt")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { deployments, ethers, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const [owner] = await ethers.getSigners();
    const airdropDeployment = await deployments.get("EncryptedAirdrop");

    const airdrop = await ethers.getContractAt("EncryptedAirdrop", airdropDeployment.address);

    const amount = BigInt(taskArguments.amount);
    const encrypted = await fhevm
      .createEncryptedInput(airdropDeployment.address, owner.address)
      .add64(amount)
      .encrypt();

    const tx = await airdrop
      .connect(owner)
      .setAllocation(taskArguments.recipient, encrypted.handles[0], encrypted.inputProof);

    console.log(`Allocation tx: ${tx.hash}`);
    await tx.wait();
    console.log("Allocation confirmed");
  });

task("task:airdrop-decrypt", "Decrypt the encrypted allocation for a wallet")
  .addParam("account", "Wallet to decrypt for")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { deployments, ethers, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const [caller] = await ethers.getSigners();
    const airdropDeployment = await deployments.get("EncryptedAirdrop");
    const airdrop = await ethers.getContractAt("EncryptedAirdrop", airdropDeployment.address);

    const handle = await airdrop.getEncryptedAllocation(taskArguments.account);

    if (handle === ethers.ZeroHash) {
      console.log("No encrypted allocation handle found");
      return;
    }

    const decrypted = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      handle,
      airdropDeployment.address,
      caller,
    );

    console.log(`Encrypted handle: ${handle}`);
    console.log(`Decrypted amount: ${decrypted}`);
  });
