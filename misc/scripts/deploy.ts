import hre from "hardhat";
// import { ContractFactory, BytesLike, BigNumber, Signer } from 'ethers';
import { JsonRpcProvider } from '@ethersproject/providers';
import { toSqrtPrice, fromSqrtPrice, MIN_PRICE, MAX_PRICE, MIN_TICK, ZERO_ADDR } from '../../test/FixedPoint';
import { CrocSwapDexSeed } from '../../typechain/CrocSwapDexSeed';
import { MockERC20 } from '../../typechain/MockERC20';
import { QueryHelper } from '../../typechain/QueryHelper';
import { CrocSwapDex } from '../../typechain/CrocSwapDex';
import { IERC20Minimal } from '../../typechain/IERC20Minimal';
import { ColdPath } from '../../typechain/ColdPath';
import { AddressZero } from '@ethersproject/constants';
import { WarmPath } from '../../typechain/WarmPath';
import { LongPath } from '../../typechain/LongPath';
import { MicroPaths } from '../../typechain/MicroPaths';
import { CrocPolicy } from '../../typechain/CrocPolicy';
import { CrocQuery } from '../../typechain/CrocQuery';
import { CrocShell } from '../../typechain/CrocShell';
import { HotPath } from '../../typechain/HotPath';
import { BigNumber } from "ethers";
import { BootPath, CrocImpact, KnockoutFlagPath, KnockoutLiqPath, MyToken } from '../../typechain';
 
const { ethers } = hre;
 
interface CrocAddrs {
  dex: string | undefined,
  cold: string | undefined,
  warm: string | undefined,
  long: string | undefined,
  micro: string | undefined,
  hot: string | undefined,
  knockout: string | undefined,
  koCross: string | undefined,
  policy: string | undefined,
  query: string | undefined,
  impact: string | undefined,
  shell: string | undefined
}
 
let tokens = {
  eth: ZERO_ADDR,
  dai: "0xdc31Ee1784292379Fbb2964b3B9C4124D8F89C60",
  usdc: "0x60bBA138A74C5e7326885De5090700626950d509"
}
 
let addrs: CrocAddrs = {
  dex: "0xDACA5525bE478438888C90bd10f8B92ecFc1Ca3b",
  cold: "0xe632E12131581A2Bcc74B4E86347ceC688AdbE83",
  warm: "0x4D09D6Db10f24b3ed71b5BDa7627B274224B0912",
  long: "0x2Be7954987DBe34807cB496B61ebB7F1c9232033",
  micro: "0x327e6F29D8A77f83C8117848B33e5195A8169B12",
  hot: "0x44F2d5e12AD93b2023D138Ce449361cbBDb8c49f",
  knockout: "0xE3b83Beb4D8f79E3c3C164a704fe33B4B2782ECa",
  koCross: "0x31009cf94b472c6434aEbdBCF7Bf0DB3fC3cf5c8",
  policy: "0x1cB4DEf404a6D5D24E387af82633bAf24e7397ed",
  query: "0x8CAa5bE3FAb5503cA1aE2BFffB0c33196dE9BF2D",
  impact: "0xA74DBf60df477c45005c5A0Ab1BD25e614482198",
  shell: "0xC7A267895c2C24B0F4Dab094EcDE85e8997E0a75"
}
 
const POOL_IDX = 35001
const BOOT_PROXY_IDX = 0;
const SWAP_PROXY_IDX = 1;
const LP_PROXY_IDX = 2;
const COLD_PROXY_IDX = 3;
const LONG_PROXY_IDX = 4;
const MICRO_PROXY_IDX = 5;
const MULTICALL_PROXY_IDX = 6;
const KNOCKOUT_LP_PROXY_IDX = 7;
const FLAG_CROSS_PROXY_IDX = 3500;
const SAFE_MODE_PROXY_PATH = 9999;
 
let abi = new ethers.utils.AbiCoder()
const override = { gasLimit: 6000000 }
let factory;
 
async function createDexContracts(): Promise<CrocSwapDex> {
 
  console.log("Start createDexContract");
  factory = await ethers.getContractFactory("WarmPath")
  let warmPath = addrs.warm ? factory.attach(addrs.warm) :
      await factory.deploy(override) as WarmPath
  addrs.warm = warmPath.address
  console.log("Warmpath");
     
  factory = await ethers.getContractFactory("LongPath")
  let longPath = addrs.long ? factory.attach(addrs.long) :
      await factory.deploy(override) as LongPath
  addrs.long = longPath.address
  console.log("Longpath");
 
  factory = await ethers.getContractFactory("MicroPaths")
  let microPath = addrs.micro ? factory.attach(addrs.micro) :
      await factory.deploy(override) as MicroPaths
  addrs.micro = microPath.address
  console.log("MicroPaths: ", microPath.address);
 
  factory = await ethers.getContractFactory("ColdPath")
  let coldPath = addrs.cold ? factory.attach(addrs.cold) :
      await factory.deploy(override) as ColdPath
  addrs.cold = coldPath.address
  console.log("Coldpath: ", coldPath.address);
 
  factory = await ethers.getContractFactory("HotProxy")
  let hotPath = addrs.hot ? factory.attach(addrs.hot) :
      await factory.deploy(override) as HotPath
  addrs.hot = hotPath.address
  console.log("HotProxy: ", hotPath.address);
 
  factory = await ethers.getContractFactory("KnockoutLiqPath")
  let knockoutPath = addrs.knockout ? factory.attach(addrs.knockout) :
      await factory.deploy(override) as KnockoutLiqPath    
  addrs.knockout = knockoutPath.address
  console.log("KnockoutLiqPath: ", knockoutPath.address);
 
  factory = await ethers.getContractFactory("KnockoutFlagPath")
  let crossPath = addrs.koCross ? factory.attach(addrs.koCross) :
      await factory.deploy(override) as KnockoutFlagPath    
  addrs.koCross = crossPath.address
  console.log("KnockoutFlagPath: ", crossPath.address);

     
  factory = await ethers.getContractFactory("CrocSwapDex")
  let dex = (addrs.dex ? factory.attach(addrs.dex) :
      await factory.deploy(override)) as CrocSwapDex
  addrs.dex = dex.address
  console.log("CrocSwapDex: ", dex.address);

 console.log("End createDexContract");
  console.log(addrs)
  return dex
}
 
 
async function createPeripheryContracts (dexAddr: string): Promise<CrocPolicy> {
  
  console.log("Start PeripheryContract");
  factory = await ethers.getContractFactory("CrocPolicy")
  let policy = (addrs.policy ? factory.attach(addrs.policy) :
      await factory.deploy(dexAddr)) as CrocPolicy
  addrs.policy = policy.address
  console.log("Policy");
 
  factory = await ethers.getContractFactory("CrocQuery")
  let query = (addrs.query ? factory.attach(addrs.query) :
      await factory.deploy(dexAddr, override)) as CrocQuery
  addrs.query = query.address
  console.log("Query");
 
  factory = await ethers.getContractFactory("CrocImpact")
  let impact = (addrs.impact ? factory.attach(addrs.impact) :
      await factory.deploy(dexAddr, override)) as CrocImpact
  addrs.impact = impact.address
  console.log("Impact");

  factory = await ethers.getContractFactory("CrocShell")
  let shell = (addrs.shell ? factory.attach(addrs.shell) :
      await factory.deploy(override)) as CrocShell
  addrs.shell = shell.address
  console.log("Shell");

  console.log("End Peripheri Contract");
 
  console.log(addrs)
  return policy
}
 
async function installPolicy (dex: CrocSwapDex) {
  let authCmd = abi.encode(["uint8", "address"], [20, addrs.policy])
  let tx = await dex.protocolCmd(COLD_PROXY_IDX, authCmd, true, override);
  await tx.wait()
  console.log("Policy Installed");
}
 
async function installSidecars (dex: CrocSwapDex) {

  console.log("Start SideCars");
  let abi = new ethers.utils.AbiCoder()
  let tx
  let cmd;
 
  cmd = abi.encode(["uint8", "address", "uint16"], [21, addrs.cold, COLD_PROXY_IDX])
  tx = await dex.protocolCmd(BOOT_PROXY_IDX, cmd, true)
  await tx
  console.log("coldProxy");
 
  cmd = abi.encode(["uint8", "address", "uint16"], [21, addrs.warm, LP_PROXY_IDX])
  tx = await dex.protocolCmd(BOOT_PROXY_IDX, cmd, true)
  await tx
  console.log("lpProxy");
 
  cmd = abi.encode(["uint8", "address", "uint16"], [21, addrs.hot, SWAP_PROXY_IDX])
  tx = await dex.protocolCmd(BOOT_PROXY_IDX, cmd, true)
  await tx
  console.log("swapProxy");

  cmd = abi.encode(["uint8", "address", "uint16"], [21, addrs.long, LONG_PROXY_IDX])
  tx = await dex.protocolCmd(BOOT_PROXY_IDX, cmd, true)
  await tx
  console.log("longProxy");
 
  cmd = abi.encode(["uint8", "address", "uint16"], [21, addrs.micro, MICRO_PROXY_IDX])
  tx = await dex.protocolCmd(BOOT_PROXY_IDX, cmd, true)
  await tx
  console.log("microProxy");

  cmd = abi.encode(["uint8", "address", "uint16"], [21, addrs.knockout, KNOCKOUT_LP_PROXY_IDX])
  tx = await dex.protocolCmd(BOOT_PROXY_IDX, cmd, true)
  await tx
  console.log("knocoutProxy");

  cmd = abi.encode(["uint8", "address", "uint16"], [21, addrs.koCross, FLAG_CROSS_PROXY_IDX])
  tx = await dex.protocolCmd(BOOT_PROXY_IDX, cmd, true)
  await tx
  console.log("flagProxy");

  console.log("End Sidecars");
}
 
async function initPoolTemplate (policy: CrocPolicy) {
  const POOL_INIT_LIQ = 1
  const FEE_BPS = 28
  const TICK_SIZE = 16
  const JIT_THRESH = 3
 
  const KNOCKOUT_ON_FLAG = 32
  const KNOCKOUT_TICKS_FLAG = 4 // 16 ticks
  const knockoutFlag = KNOCKOUT_ON_FLAG + KNOCKOUT_TICKS_FLAG
 
  if (addrs.dex) {
      let setPoolLiqCmd = abi.encode(["uint8", "uint128"], [112, POOL_INIT_LIQ])
      let tx = await policy.treasuryResolution(addrs.dex, COLD_PROXY_IDX, setPoolLiqCmd, false, override)
      await tx.wait()
 
      let templateCmd = abi.encode(["uint8", "uint256", "uint16", "uint16", "uint8", "uint8", "uint8"],
          [110, POOL_IDX, FEE_BPS * 100, TICK_SIZE, JIT_THRESH, knockoutFlag, 0])
      tx = await policy.opsResolution(addrs.dex, COLD_PROXY_IDX, templateCmd, override)
      await tx.wait()
  }
}
 
 
async function main() {
    const [deployer] = await ethers.getSigners();

    factory = await ethers.getContractFactory("MyToken")
  let longPath = tokens.usdc ? factory.attach(tokens.usdc) :
      await factory.deploy(override) as MyToken
    tokens.usdc = longPath.address
    console.log(tokens.usdc)

    console.log(
    "Deploying contracts with the account:",
    deployer.address
    );
 
    let dex = await createDexContracts()
    let policy = await createPeripheryContracts(dex.address)
 
    //await installSidecars(dex)
    //await installPolicy(dex)
    // await initPoolTemplate(policy)
    const token = await ethers.getContractAt("IERC20Minimal", tokens.usdc);

 
    const approveTx = await token.approve(addrs.dex, BigNumber.from(10).pow(15));
    await approveTx.wait();
    console.log("Approved tokens for swap");

    let initPoolCmd = abi.encode(["uint8", "address", "address", "uint256", "uint128"],
    [71, tokens.eth, tokens.usdc, POOL_IDX, toSqrtPrice(1/2000)])
    let tx = await dex.userCmd(3, initPoolCmd, { value: BigNumber.from(10).pow(15), gasLimit: 6000000})
    console.log(await tx.wait())
}
 
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 