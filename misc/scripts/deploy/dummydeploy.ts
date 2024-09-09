import { ethers } from "hardhat";
import { Dummy } from "../../../typechain";
import { BigNumber } from "ethers";
const gasLimit = 500000;

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

    // Replace with the actual address of the CrocSwapDex contract
    const crocSwapDexAddress = "0x9502FaC55A5D6E791115a5238679d24DF39d3dBc";

    // Get the contract factory and check if the Dummy contract is already deployed
    const Dummy = await ethers.getContractFactory("Dummy");

    const dummyAddress = "0x44884A8aD98E5ba8125229918d6C8657A21c4c3b";

    // Check if there's already a deployed contract at this address
    let factory = await ethers.getContractFactory("Dummy")
    let dummy = dummyAddress? factory.attach(dummyAddress) : await factory.deploy(crocSwapDexAddress) as Dummy;
    console.log("Dummy contract deployed to:", dummy.address);

    const base = "0x0000000000000000000000000000000000000000";   // Address of the base token
    const quote = "0x60bBA138A74C5e7326885De5090700626950d509"; // Address of the quote token
    const poolIdx = 35001;                       // Pool index
    const isBuy = true;                          // Whether the trade is a buy operation
    const inBaseQty = true;                      // Whether the quantity is in base tokens
    const qty = ethers.utils.parseUnits("1", 18); // Quantity of the trade
    const tip = 0;                               // Any additional tip
    const limitPrice = ethers.utils.parseUnits("2500", 18); // Limit price
    const minOut = ethers.utils.parseUnits("0.98", 18);     // Minimum output amount expected
    const reserveFlags = 0;                      // Reserve flags, set as needed

    //const token = await ethers.getContractAt("IERC20Minimal", base);
    const token_ = await ethers.getContractAt("IERC20Minimal", quote);

    // Check if approval is necessary for both tokens
    const approveTx = await token_.approve(dummy.address, BigNumber.from(10).pow(15));
    console.log("Approve passed");

    // Perform a swap operation
    console.log("Starting swap");
    const swapTx = await dummy.swap(
        base,
        quote,
        poolIdx,
        isBuy,
        inBaseQty,
        qty,
        tip,
        limitPrice,
        minOut,
        reserveFlags,
        { value: ethers.utils.parseEther("0.01"), gasLimit }
    );
    await swapTx.wait();
    console.log("Swap operation executed");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
