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

    // Get provider
    const provider = new ethers.providers.JsonRpcProvider("https://mainnet.infura.io/v3/03b6e2a30eca448895162968c0d4f6aa");
    const ABI = [
    "function token0() external view returns (address)",
    "function token1() external view returns (address)",
    "function fee() external view returns (uint24)",
    ];
    const address = factory;

    // Get pool token information
    const poolContract = new ethers.Contract(address, ABI, provider)
    let token0Address = await poolContract.token0()
    let token1Address = await poolContract.token1()
    let tokenFee = await poolContract.fee()

    // Get individual token information (symbol, name, decimals)
    let addressArray = [token0Address, token1Address]
    let tokenInfoArray = []

    for (let i=0; i < addressArray.length; i++) {
        let tokenAddress = addressArray[i]
        let tokenAbi = [
            "function name() view returns (string)",
            "function symbol() view returns (string)",
            "function decimals() view returns (uint)"
        ]
        let contract = new ethers.Contract(tokenAddress, tokenAbi, provider)
        let tokenSymbol = await contract.symbol()
        let tokenName = await contract.name()
        let tokenDecimals = await contract.decimals()
        let obj = {
            id: "token" + i,
            tokenSymbol: tokenSymbol,
            tokenName: tokenName,
            tokenDecimals: tokenDecimals,
            tokenAddress: tokenAddress
        }
        tokenInfoArray.push(obj)
    }
    // Identify the correct token to input as A and B respectively
    let inputTokenA = ""
    let inputDecimalsA = 0
    let inputTokenB = ""
    let inputDecimalsB = 0

    if (tradeDirection == "baseToQuote") {
        inputTokenA = tokenInfoArray[0].tokenAddress
        inputDecimalsA = tokenInfoArray[0].tokenDecimals
        inputTokenB = tokenInfoArray[1].tokenAddress
        inputDecimalsB = tokenInfoArray[1].tokenDecimals
    }
    if (tradeDirection == "quoteToBase") {
        inputTokenA = tokenInfoArray[1].tokenAddress
        inputDecimalsA = tokenInfoArray[1].tokenDecimals
        inputTokenB = tokenInfoArray[0].tokenAddress
        inputDecimalsB = tokenInfoArray[0].tokenDecimals
    }

    // Reformat amount in
    if (!isNaN(amtIn)) {amtIn = amtIn.toString()}
    let amountIn = ethers.utils.parseUnits(amtIn, inputDecimalsA).toString()

    // Get uniswap V3 quote
    const quoterAddress = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6"
    const quoterContract = new ethers.Contract(quoterAddress, QuoterABI, provider)
    let quotedAmountOut = 0
    try {
        quotedAmountOut = await quoterContract.callStatic.quoteExactInputSingle(
            inputTokenA,
            inputTokenB,
            tokenFee,
            amountIn,
            0)
    } catch (err) {
        return 0
    }
    
    // Format output
    let outPutAmount = ethers.utils.formatUnits(quotedAmountOut, inputDecimalsB).toString()
    return outPutAmount

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
        let acquiredCoinT1 = await getPrice(pair1ContractAddress, amountIn, trade1Direction)
        
        console.log("Checking trade 2 aqcuired coin...")
        if (acquiredCoinT1 == 0) {return}
        let acquiredCoinT2 = await getPrice(pair2ContractAddress, acquiredCoinT1, trade2Direction)
        
        console.log("Checking trade 3 aqcuired coin...")
        if (acquiredCoinT2 == 0) {return}
        let acquiredCoinT3 = await getPrice(pair3ContractAddress, acquiredCoinT2, trade3Direction)

        console.log(amountIn, acquiredCoinT3)
        
    }

    return
}

getDepth(amountIn=1, limit=1)