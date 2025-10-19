import { expect } from "chai";
import hre, { deployments, ethers, getNamedAccounts } from "hardhat";
import type { Signer } from "ethers";
import { FhevmType } from "@fhevm/hardhat-plugin";

import type { EncryptedAirdrop, ERC7984Token } from "../types";

describe("EncryptedAirdrop", function () {
  let owner: Signer;
  let user: Signer;
  let stranger: Signer;
  let token: ERC7984Token;
  let airdrop: EncryptedAirdrop;
  let ownerAddress: string;
  let userAddress: string;
  let airdropAddress: string;
  let tokenAddress: string;

  beforeEach(async function () {
    await deployments.fixture(["EncryptedAirdrop"]);

    const { deployer } = await getNamedAccounts();
    owner = await ethers.getSigner(deployer);
    const signers = await ethers.getSigners();
    user = signers[1];
    stranger = signers[2];

    const tokenDeployment = await deployments.get("ERC7984Token");
    const airdropDeployment = await deployments.get("EncryptedAirdrop");

    token = (await ethers.getContractAt(
      "ERC7984Token",
      tokenDeployment.address,
      owner,
    )) as unknown as ERC7984Token;
    airdrop = (await ethers.getContractAt(
      "EncryptedAirdrop",
      airdropDeployment.address,
      owner,
    )) as unknown as EncryptedAirdrop;

    ownerAddress = await owner.getAddress();
    userAddress = await user.getAddress();
    airdropAddress = airdropDeployment.address;
    tokenAddress = tokenDeployment.address;

    await hre.fhevm.initializeCLIApi();
  });

  async function encryptAmount(amount: bigint, signer: Signer) {
    const handle = await hre.fhevm
      .createEncryptedInput(airdropAddress, await signer.getAddress())
      .add64(amount)
      .encrypt();

    return handle;
  }

  it("allows the owner to configure allocations and users to claim", async function () {
    const depositAmount = 500n;
    const encryptedDeposit = await encryptAmount(depositAmount, owner);

    await expect(
      airdrop
        .connect(owner)
        .depositTokens(encryptedDeposit.handles[0], encryptedDeposit.inputProof),
    ).to.emit(airdrop, "TokensDeposited");

    const allocationAmount = 320n;
    const encryptedAllocation = await encryptAmount(allocationAmount, owner);

    await expect(
      airdrop
        .connect(owner)
        .setAllocation(userAddress, encryptedAllocation.handles[0], encryptedAllocation.inputProof),
    ).to.emit(airdrop, "AllocationConfigured");

    expect(await airdrop.hasAllocation(userAddress)).to.equal(true);
    expect(await airdrop.hasClaimed(userAddress)).to.equal(false);

    const encryptedHandle = await airdrop.getEncryptedAllocation(userAddress);
    const decryptedAllocation = await hre.fhevm.userDecryptEuint(
      FhevmType.euint64,
      encryptedHandle,
      airdropAddress,
      user,
    );

    expect(decryptedAllocation).to.equal(allocationAmount);

    await expect(airdrop.connect(user).claim())
      .to.emit(airdrop, "AirdropClaimed");

    expect(await airdrop.hasAllocation(userAddress)).to.equal(false);
    expect(await airdrop.hasClaimed(userAddress)).to.equal(true);

    await expect(airdrop.connect(user).claim()).to.be.revertedWithCustomError(airdrop, "NoAllocation");

    const encryptedBalance = await token.confidentialBalanceOf(userAddress);
    const decryptedBalance = await hre.fhevm.userDecryptEuint(
      FhevmType.euint64,
      encryptedBalance,
      tokenAddress,
      user,
    );
    expect(decryptedBalance).to.equal(allocationAmount);
  });

  it("prevents unauthorized callers from configuring allocations", async function () {
    const encryptedAmount = await encryptAmount(100n, owner);

    await expect(
      airdrop
        .connect(stranger)
        .setAllocation(userAddress, encryptedAmount.handles[0], encryptedAmount.inputProof),
    ).to.be.revertedWithCustomError(airdrop, "NotOwner");
  });

  it("allows the owner to reset allocations", async function () {
    const encryptedAmount = await encryptAmount(250n, owner);

    await airdrop
      .connect(owner)
      .setAllocation(userAddress, encryptedAmount.handles[0], encryptedAmount.inputProof);

    expect(await airdrop.hasAllocation(userAddress)).to.equal(true);

    await expect(airdrop.connect(owner).clearAllocation(userAddress))
      .to.emit(airdrop, "AllocationCleared")
      .withArgs(userAddress);

    expect(await airdrop.hasAllocation(userAddress)).to.equal(false);
    expect(await airdrop.hasClaimed(userAddress)).to.equal(false);
  });
});
