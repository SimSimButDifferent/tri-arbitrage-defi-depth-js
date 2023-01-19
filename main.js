const ethers = require('ethers');
const QuoterABI = require('@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json').abi;

// Read File
function getFile(fPath) {
    const fs = require('fs');

    try {
        const data = fs.readFileSync(fPath, 'utf8')
        return data
    } catch (err) {
        return []
    }
}

// Get Price
async function getPrice(factory, amtIn, tradeDirection) {
    const provider = new ethers.providers.JsonRpcProvider("https://mainnet.infura.io/v3/03b6e2a30eca448895162968c0d4f6aa");
    const ABI = [
    "function token0() external view returns (address)",
    "function token1() external view returns (address)",
    "function fee() external view returns (uint24)",
    ];
const address = factory;
const poolContract = new ethers.Contract(address, ABI, provider)
let token0Address = await poolContract.token0()
let token1Address = await poolContract.token1()
let tokenFee = await poolContract.fee()
console.log(token1Address, token1Address, tokenFee)
}

// Get Depth
async function getDepth(amountIn, limit) {

    // Get JSON surface rates
    console.log("Reading surface rate information");
    let fileInfo = getFile("../uniswap/uniswap_surface_rates.json");
    fileJsonArray = JSON.parse(fileInfo);
    fileJsonArrayLimit = fileJsonArray.slice(0, limit);
    
    // Loop through each trade and get price information
    for (let i = 0; i < fileJsonArrayLimit.length; i++) {

        // Extract the variables
        let pair1ContractAddress = fileJsonArrayLimit[i].poolContract1
        let pair2ContractAddress = fileJsonArrayLimit[i].poolContract2
        let pair3ContractAddress = fileJsonArrayLimit[i].poolContract3
        let trade1Direction = fileJsonArrayLimit[i].poolDirectionTrade1
        let trade2Direction = fileJsonArrayLimit[i].poolDirectionTrade2
        let trade3Direction = fileJsonArrayLimit[i].poolDirectionTrade3

        // Trade 1
        console.log("Checking trade 1 aqcuired coin...")
        let acquiredCoinDetail = await getPrice(pair1ContractAddress, amountIn, trade1Direction)
    }

    return
}

getDepth(amountIn=1, limit=1)