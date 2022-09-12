async function main() {
  const tokens = (n) => {
    // Helper function for decimals.
    return ethers.utils.parseUnits(n.toString(), 'ether')
  }
  console.log('Preparing deployment... \n')

  // Fetch contract to deploy
  const NoahPool = await ethers.getContractFactory('NoahPool')

  // Fetch accounts
  const accounts = await ethers.getSigners();

  // Deploy Pool
  const pool = await NoahPool.deploy("0x878129F7dCEA0F728B6A37F87671702B280f4FAa", "0x976D8545778890587b8FaaCC3c9Cb7F380383294")
  await pool.deployed()
  console.log(`Pool contract Deployed to: ${pool.address}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });