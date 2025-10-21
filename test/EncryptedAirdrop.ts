import { expect } from "chai";
import hre, { deployments, ethers, getNamedAccounts } from "hardhat";
import type { Signer } from "ethers";
import { FhevmType } from "@fhevm/hardhat-plugin";

import type { EncryptedAirdrop, ERC7984Token } from "../types";

describe("EncryptedAirdrop", function () {
  let distributor: Signer;
  let user: Signer;
  let allocator: Signer;
  let token: ERC7984Token;
  let airdrop: EncryptedAirdrop;
  let userAddress: string;
  let allocatorAddress: string;
  let airdropAddress: string;
  let tokenAddress: string;

  beforeEach(async function () {
    await deployments.fixture(["EncryptedAirdrop"]);

    const { deployer } = await getNamedAccounts();
    distributor = await ethers.getSigner(deployer);
    const signers = await ethers.getSigners();
    user = signers[1];
    allocator = signers[2];

    const tokenDeployment = await deployments.get("ERC7984Token");
    const airdropDeployment = await deployments.get("EncryptedAirdrop");

    token = (await ethers.getContractAt(
      "ERC7984Token",
      tokenDeployment.address,
      distributor,
    )) as unknown as ERC7984Token;
    airdrop = (await ethers.getContractAt(
      "EncryptedAirdrop",
      airdropDeployment.address,
      distributor,
    )) as unknown as EncryptedAirdrop;

    userAddress = await user.getAddress();
    allocatorAddress = await allocator.getAddress();
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

  it("allows any caller to configure allocations and users to claim", async function () {
    const depositAmount = 500n;
    const encryptedDeposit = await encryptAmount(depositAmount, distributor);

    await expect(
      airdrop
        .connect(distributor)
        .depositTokens(encryptedDeposit.handles[0], encryptedDeposit.inputProof),
    ).to.emit(airdrop, "TokensDeposited");

    const allocationAmount = 320n;
    const encryptedAllocation = await encryptAmount(allocationAmount, distributor);

    await expect(
      airdrop
        .connect(distributor)
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

  it("allows different callers to deposit and configure allocations", async function () {
    const mintAmount = 750n;
    await token.connect(allocator).mint(allocatorAddress, mintAmount);

    const operatorExpiry = Math.floor(Date.now() / 1000) + 86_400;
    const setOperatorTx = await token.connect(allocator).setOperator(airdropAddress, operatorExpiry);
    await setOperatorTx.wait();

    const encryptedDeposit = await encryptAmount(mintAmount, allocator);
    await expect(
      airdrop
        .connect(allocator)
        .depositTokens(encryptedDeposit.handles[0], encryptedDeposit.inputProof),
    ).to.emit(airdrop, "TokensDeposited");

    const encryptedAllocation = await encryptAmount(200n, allocator);
    await expect(
      airdrop
        .connect(allocator)
        .setAllocation(userAddress, encryptedAllocation.handles[0], encryptedAllocation.inputProof),
    ).to.emit(airdrop, "AllocationConfigured");

    expect(await airdrop.hasAllocation(userAddress)).to.equal(true);
  });

  it("allows the recipient to clear their allocation", async function () {
    const encryptedAmount = await encryptAmount(250n, distributor);

    await airdrop
      .connect(distributor)
      .setAllocation(userAddress, encryptedAmount.handles[0], encryptedAmount.inputProof);

    await expect(
      airdrop
        .connect(allocator)
        .clearAllocation(userAddress),
    ).to.be.revertedWithCustomError(airdrop, "UnauthorizedClear");

    await expect(airdrop.connect(user).clearAllocation(userAddress))
      .to.emit(airdrop, "AllocationCleared")
      .withArgs(userAddress);

    expect(await airdrop.hasAllocation(userAddress)).to.equal(false);
    expect(await airdrop.hasClaimed(userAddress)).to.equal(false);
  });
});
