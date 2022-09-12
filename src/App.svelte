<script>
  import { ethers } from 'ethers';
  import Pool from '../artifacts/contracts/NoahPool.sol/NoahPool.json';
  import svelteLogo from './assets/svelte.svg'


    /* ========== Variables ========== */

  const noahPoolAddress = "0xC1478d70441fAfc8576f985aa4C6dA9bFc9D4D58"; // Enviroment variable/Pool Address
  const noahAddress = "0x878129F7dCEA0F728B6A37F87671702B280f4FAa"; // Enviroment variable/Perion token address
  let stakeAmount, unstakeAmount, rewardAmount, stakedPerion, usersBalance, stakingAddress;

    /* ========== Functions ========== */

  const decimals = (n) => {
    // Turn bigNumbers into readable numbers.
    return n / 1000000000000000000
  }

  // Connect MetaMask
  async function getSigner() {
  // @ts-ignore
  let provider = new ethers.providers.Web3Provider(window.ethereum)
  // MetaMask requires requesting permission to connect users accounts
  await provider.send("eth_requestAccounts", []);
  let signer = provider.getSigner()
  console.log('Connected MetaMask!', provider)
  return signer;
  }

  async function userBalance() {
    const signer = await getSigner()
    const address = await signer.getAddress()
    stakingAddress = address
    const poolContract = new ethers.Contract(noahPoolAddress, Pool.abi, signer)
    usersBalance = decimals(await poolContract.balanceOf(address))
    console.log(`Amount of staked Perion by user: ${address} is: ${usersBalance}`)
  }

	async function stakeTokens(amount) {

		const stakeAmount = ethers.utils.parseUnits(amount.toString(), 18);
    const signer = await getSigner()

    let abi = ["function approve(address _spender, uint256 _value) public returns (bool success)"]
    let contract = new ethers.Contract(noahAddress, abi, signer)
    let result = await contract.approve(noahPoolAddress, stakeAmount)
    console.log("Allowance approved for:", result)

    // Connect with Pool contract and stake allowed tokens
		const poolContract = new ethers.Contract(noahPoolAddress, Pool.abi, signer)
    result = await poolContract.stake(stakeAmount)

		console.log('Tokens Staked!', result)
	}

  async function unstakeTokens(amount) {

    const unstakeAmount = ethers.utils.parseUnits(amount.toString(), 18);
    const signer = await getSigner()

    // Connect with Pool contract and unstake amount of tokens
    const poolContract = new ethers.Contract(noahPoolAddress, Pool.abi, signer)
    let result = await poolContract.withdraw(unstakeAmount)

    console.log('Tokens Unstaked!', result)
  }

  async function claimRewards() {

  const signer = await getSigner()

  // Connect with Pool contract and claim rewards
  const poolContract = new ethers.Contract(noahPoolAddress, Pool.abi, signer)
  let result = await poolContract.getReward()

  console.log('Rewards Claimed!', result)
  }

  async function startRewards(amount) {

  const signer = await getSigner()
  const rewardAmount = ethers.utils.parseUnits(amount.toString(), 18);

  const poolContract = new ethers.Contract(noahPoolAddress, Pool.abi, signer)
  let result = await poolContract.notifyRewardAmount(rewardAmount)

  console.log(`Rewards started with: ${amount} Perion tokens!`)
  }

  async function queryStaked() {
  const signer = await getSigner()
  const poolContract = new ethers.Contract(noahPoolAddress, Pool.abi, signer)
  stakedPerion = decimals(await poolContract.totalStaked())
  console.log(`Amount of staked Perion is: ${stakedPerion}`)

  }

  async function faucet() {

    const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
	  const hardhat1 = new ethers.Wallet( "b99894fd0142af7939405b09e3a4948bf403c1e3e7bab334cb0bd852ca64796d", provider )

    const signer = await getSigner()
    const address = await signer.getAddress()

    let abi = ["function approve(address _spender, uint256 _value) public returns (bool success)"]
    let contract = new ethers.Contract(noahAddress, abi, hardhat1)
    let result = await contract.approve(address, ethers.utils.parseUnits("500", 18))
    console.log("Allowance approved for:", result)

    abi = ["function transfer(address _to, uint256 _value) public returns (bool success)"]
    contract = new ethers.Contract(noahAddress, abi, hardhat1)
    result = await contract.transfer(address, ethers.utils.parseUnits("500", 18))
    console.log("500 PERION has been sent.", result)

  }
</script>

<main>
  <div>
    <a href="https://vitejs.dev" target="_blank">
      <img src="/vite.svg" class="logo" alt="Vite Logo" />
    </a>
    <a href="https://svelte.dev" target="_blank">
      <img src={svelteLogo} class="logo svelte" alt="Svelte Logo" />
    </a>
  </div>

  <div class="main-container">
    <div class="heading">
      <h1 class="heading__title">Noah Staking/COO Rewards</h1>
      <p class="heading__credits"><a class="heading__link" target="_blank" href="https://itahandnaizir.on.fleek.co/">Part of Itahand's Web3 portfolio</a></p>
    </div>
    <div class="cards">
      <div class="card card-1">
        <div class="card__icon"><i class="fas fa-bolt"></i></div>
        <p class="card__exit"><i class="fas fa-times"></i></p>
        <h2 class="card__title">Total NOAH of staked</h2>
        <p class="card__apply">
          <input bind:value={stakeAmount} placeholder="Stake" class="setStake">
          <a class="card__link" href="#" on:click={() => stakeTokens(stakeAmount)}>Stake Noah <i class="fas fa-arrow-right"></i></a>
          <br>
          <input bind:value={unstakeAmount} placeholder="Withdraw" class="setStake">
          <a class="card__link" href="#"> Withdraw Noah<i class="fas fa-arrow-right"></i></a>
        </p>
      </div>
      <div class="card card-2">
        <div class="card__icon"><i class="fas fa-bolt"></i></div>
        <p class="card__exit"><i class="fas fa-times"></i></p>
        <h2 class="card__title">Your Noah staked balance: {usersBalance}</h2>
        <p class="card__apply">
          <a class="card__link" href="#" on:click={() => userBalance()}>Fetch<i class="fas fa-arrow-right"></i></a>
        </p>
      </div>
      <div class="card card-3">
        <div class="card__icon"><i class="fas fa-bolt"></i></div>
        <p class="card__exit"><i class="fas fa-times"></i></p>
        <h2 class="card__title">Total COO to be rewarded this period: 2000</h2>
      </div>
      <div class="card card-4">
        <div class="card__icon"><i class="fas fa-bolt"></i></div>
        <p class="card__exit"><i class="fas fa-times"></i></p>
        <h2 class="card__title">Reward Period Time Left: </h2>
      </div>
      <div class="card card-5">
        <div class="card__icon"><i class="fas fa-bolt"></i></div>
        <p class="card__exit"><i class="fas fa-times"></i></p>
        <h2 class="card__title">Claim your COO rewards!</h2>
        <p class="card__apply">
          <a class="card__link" href="#">Claim Now<i class="fas fa-arrow-right"></i></a>
        </p>
      </div>
      <div class="card card-1">
        <div class="card__icon"><i class="fas fa-bolt"></i></div>
        <p class="card__exit"><i class="fas fa-times"></i></p>
        <h2 class="card__title">Set next reward period. (Owner Only) </h2>
        <input bind:value={rewardAmount} placeholder="Rewards" class="setRewards">
        <p class="card__apply">
          <a on:click={() => startRewards(rewardAmount)} class="card__link" href="#">Start Rewards<i class="fas fa-arrow-right"></i></a>
        </p>
      </div>
    </div>
  </div>

</main>

<style>
  .logo {
    height: 6em;
    padding: 1.5em;
    will-change: filter;
  }
  .logo:hover {
    filter: drop-shadow(0 0 2em #646cffaa);
  }
  .logo.svelte:hover {
    filter: drop-shadow(0 0 2em #ff3e00aa);
  }
  /* HEADING */

.heading {
  text-align: center;
}

.heading__title {
  font-weight: 600;
}

.heading__credits {
  margin: 10px 0px;
  color: #888888;
  font-size: 25px;
  transition: all 0.5s;
}

.heading__link {
  text-decoration: none;
}

.heading__credits .heading__link {
  color: inherit;
}

/* CARDS */

.cards {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

.card {
  margin: 20px;
  padding: 20px;
  width: 500px;
  min-height: 200px;
  display: grid;
  grid-template-rows: 20px 50px 1fr 50px;
  border-radius: 10px;
  box-shadow: 0px 6px 10px rgba(0, 0, 0, 0.25);
  transition: all 0.2s;
}

.card:hover {
  box-shadow: 0px 6px 10px rgba(0, 0, 0, 0.4);
  transform: scale(1.01);
}

.card__link,
.card__exit,
.card__icon {
  position: relative;
  text-decoration: none;
  color: rgba(255, 255, 255, 0.9);
}

.card__link::after {
  position: absolute;
  top: 25px;
  left: 0;
  content: "";
  width: 0%;
  height: 3px;
  background-color: rgba(255, 255, 255, 0.6);
  transition: all 0.5s;
}

.card__link:hover::after {
  width: 100%;
}

.card__exit {
  grid-row: 1/2;
  justify-self: end;
}

.card__icon {
  grid-row: 2/3;
  font-size: 30px;
}

.card__title {
  grid-row: 3/4;
  font-weight: 400;
  color: #ffffff;
}

.card__apply {
  grid-row: 4/5;
  align-self: center;
}

/* CARD BACKGROUNDS */

.card-1 {
  background: radial-gradient(#1fe4f5, #3fbafe);
}

.card-2 {
  background: radial-gradient(#fbc1cc, #fa99b2);
}

.card-3 {
  background: radial-gradient(#76b2fe, #b69efe);
}

.card-4 {
  background: radial-gradient(#60efbc, #58d5c9);
}

.card-5 {
  background: radial-gradient(#f588d8, #c0a3e5);
}

.setRewards, .setStake {
  width: 25%;
  margin: auto;
  text-align: center;
  background: radial-gradient(#1fe4f5, #3fbafe);
}

/* RESPONSIVE */

@media (max-width: 1600px) {
  .cards {
    justify-content: center;
  }
}

</style>