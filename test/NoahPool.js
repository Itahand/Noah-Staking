const { expect } = require('chai');
const { ethers } = require('hardhat');
const hre = require("hardhat")



    /* ========== Helper Functions ========== */
const tokens = (n) => {
  // Helper function for decimals.
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

const decimals = (n) => {
  // Turn bigNumbers into readable numbers.
  return n / 1000000000000000000
}

// Manipulating EVM via Increasing Block Timestamp for testing
async function increaseTime(amount) {
  await hre.network.provider.send("evm_increaseTime", [amount])
//  console.log("EVM time " + amount + " seconds increased!")
  }

// Manipulating EVM via Mining Blocks
async function mineBlocks(amount) {
  for (let i = 0; i < amount; i++) {
  await hre.network.provider.send("evm_mine")
  }
//  console.log(amount + " Blocks Mined!")
  }

    /* ========== Tests ========== */

describe('NoahPool', () => {
  // Assigning global variables inside the function.

  let team, user1, user2, afterStaking, beforeStaking, final

  beforeEach(async () => {
    const NoahPool = await ethers.getContractFactory('NoahPool')
    const Token = await ethers.getContractFactory('Token')

    noah = await Token.deploy('Noah', 'NOAH', '1000000')
    coo = await Token.deploy('CO2', 'COO', '1000000')

    accounts = await ethers.getSigners()
    team = accounts[0]
    user1 = accounts[1]
    user2 = accounts[2]

    let transaction = await noah.connect(team).transfer(user1.address, tokens(1000))
    await transaction.wait()

    transaction = await noah.connect(team).transfer(user2.address, tokens(3000))
    await transaction.wait()

    pool = await NoahPool.deploy(noah.address, coo.address)

    transaction = await coo.connect(team).transfer(pool.address, tokens(10000))
    await transaction.wait()

    transaction = await pool.connect(team).notifyRewardAmount(tokens(2000))
    await transaction.wait()
  })

  describe('Deployment', () => {

    it('Tracks total staked tokens.', async () => {
      expect(await pool.totalStaked()).to.equal(0)
    })

    it('The owner is the deployer', async () => {
      expect(await pool.owner()).to.equal(team.address)
    })

    it('The contract holds the reward token in it', async () => {
      expect(await coo.balanceOf(pool.address)).to.equal(tokens(10000))
    })
    it('Fails when someone other than the Owner tries to set rewards', async () => {
      await expect(pool.connect(user1).notifyRewardAmount(tokens(2000))).to.be.reverted
    })
  })

  describe('Staking Tokens', () => {
    let transaction, result
    let amount = tokens(10)

    describe('Success', () => {
      beforeEach(async () => {

        // Approve amount
        transaction = await noah.connect(user1).approve(pool.address, amount)
        result = await transaction.wait()

        // Connect user1 with the pool contract and stake amount
        transaction = await pool.connect(user1).stake(amount)
        result = await transaction.wait()
      })

      it('Tracks total token staked', async () => {
        expect(await pool.totalStaked()).to.equal(amount)
      })
      it('Tracks total token staked by user', async () => {
        expect(await pool.balanceOf(user1.address)).to.equal(amount)
      })
      it('Emits a Staked event', async () => {
        const event = result.events[1] // 2 events are emitted
        expect(event.event).to.equal('Staked')

        const args = event.args
        expect(args.user).to.equal(user1.address)
        expect(args.amount).to.equal(amount)
      })

    })

    describe('Failure', () => {
      it('Fails when no tokens are approved', async () => {
        // Don't approve any tokens before depositing
        await expect(pool.connect(user1).stake(amount)).to.be.reverted
      })
    })

  })

  describe('Unstaking Tokens', () => {
    let transaction, result
    let stake = tokens(15)
    let withdraw = tokens(5)
    let remainder = tokens(15 - 5)

    describe('Success', () => {
      beforeEach(async () => {

        // Approve stake amount
        transaction = await noah.connect(user1).approve(pool.address, stake)
        result = await transaction.wait()

        beforeStaking = await noah.balanceOf(user1.address)
        // Connect user1 with the pool contract and stake amount
        transaction = await pool.connect(user1).stake(stake)
        result = await transaction.wait()

        afterStaking = await noah.balanceOf(user1.address)
        // Connect user1 with the pool contract and withdraw amount
        transaction = await pool.connect(user1).withdraw(withdraw)
        result = await transaction.wait()
        let afterUnstaking = await noah.balanceOf(user1.address)

        final = decimals(afterStaking) + 5;
      })

      it('Tracks total token staked', async () => {
         expect(await pool.totalStaked()).to.equal(remainder)
      })

      it('User1 receives back the unstaked tokens', async () => {
        expect(decimals(await noah.balanceOf(user1.address))).to.equal(final)
     })

      it('emits a Withdrawn event', async () => {
        const event = result.events[2] // 3 events are emitted
        expect(event.event).to.equal('Withdrawn')

        const args = event.args
        expect(args.user).to.equal(user1.address)
        expect(args.amount).to.equal(withdraw)
      })

    })

    describe('Failure', () => {
      it('Fails when withdrawing more tokens that is staked', async () => {
        await expect(pool.connect(user1).withdraw(tokens(20))).to.be.reverted
      })

      it('Fails trying to withdraw when no token is staked', async () => {
        await expect(pool.connect(user2).withdraw(tokens(20))).to.be.reverted
      })
    })

  })

  describe('Claiming Rewards', () => {
    let transaction, result, beforeStaking, afterStaking, final
    let currentReward = 0
    let stake = tokens(15)

    describe('Success', () => {
      beforeEach(async () => {

        // Approve stake amount
        transaction = await noah.connect(user1).approve(pool.address, stake)
        result = await transaction.wait()

        // Connect user1 with the pool contract and stake amount
        transaction = await pool.connect(user1).stake(stake)
        result = await transaction.wait()
        afterStaking = await coo.balanceOf(user1.address)

                // Time speed the blockchain
                increaseTime(614800) // more than 7 days
                mineBlocks(25)


        // Connect user1 with the pool contract and claim rewards
        transaction = await pool.connect(user1).getReward()
        result = await transaction.wait()

        final = await coo.balanceOf(user1.address)

        currentReward = final - afterStaking

        console.log(decimals(currentReward))
        let rewardGiven = result.events[2].args.reward
      })

      it('Tracks total token staked', async () => {
         expect(await pool.totalStaked()).to.equal(stake)
      })

      it('Emits a Claimed event', async () => {
        const event = result.events[2] // 3 events are emitted
        expect(event.event).to.equal('RewardPaid')

        const args = event.args
        expect(args.user).to.equal(user1.address)
        expect(decimals(args.reward)).to.equal(decimals(currentReward))
      })

      it('User1 should claim the 100% total after 7 days', async () => {
        const event = result.events[2]
        const args = event.args
        expect(decimals(args.reward)).to.equal(2000)
      })
    })
  })

  describe('Claiming Rewards for multiple users', () => {
    let transaction, result, beforeStaking, afterStaking, final, result2
    let currentReward = 0
    let stake = tokens(1000)
    describe('Success', () => {
      beforeEach(async () => {

        // Approve stake amount for user1
        transaction = await noah.connect(user1).approve(pool.address, stake)
        result = await transaction.wait()
        beforeStaking = await noah.balanceOf(user1.address)

        // Connect user1 with the pool contract and stake amount
        transaction = await pool.connect(user1).stake(stake)
        result = await transaction.wait()
        afterStaking = await coo.balanceOf(user1.address)

        // Approve stake amount for user2
        transaction = await noah.connect(user2).approve(pool.address, tokens(3000))
        result = await transaction.wait()

        // Connect user2 with the pool contract and stake amount
        transaction = await pool.connect(user2).stake(tokens(3000))
        result = await transaction.wait()

                // Time speed the blockchain
                increaseTime(614800) // more than 7 days
                mineBlocks(25)

        // Connect user1 with the pool contract and claim rewards
        transaction = await pool.connect(user1).getReward()
        result = await transaction.wait()

        // Connect user2 with the pool contract and claim rewards
        transaction = await pool.connect(user2).getReward()
        result2 = await transaction.wait()

      })
      it('Tracks total token staked', async () => {
         expect(await pool.totalStaked()).to.equal(tokens(4000))
      })
      it('User1 should claim the 25% total after 7 days', async () => {
        const event = result.events[2]
        const args = event.args
        expect(decimals(args.reward)).to.equal(500)
      })
      it('User2 should claim the 75% total after 7 days', async () => {
        const event = result2.events[2]
        const args = event.args
        expect(decimals(args.reward)).to.equal(1500)
      })
    })
  })

    describe('Claiming Rewards for multiple users at different times', () => {
      let transaction, result, beforeStaking, afterStaking, final, result2, currentReward2
      let currentReward = 0
      let stake = tokens(1000)
      describe('Success', () => {
        beforeEach(async () => {

          // Approve stake amount for user1
          transaction = await noah.connect(user1).approve(pool.address, stake)
          result = await transaction.wait()
          beforeStaking = await noah.balanceOf(user1.address)

          // Connect user1 with the pool contract and stake amount
          transaction = await pool.connect(user1).stake(stake)
          result = await transaction.wait()
          afterStaking = await coo.balanceOf(user1.address)

          // Approve stake amount for user2
          transaction = await noah.connect(user2).approve(pool.address, tokens(3000))
          result = await transaction.wait()

          // Connect user2 with the pool contract and stake amount
          transaction = await pool.connect(user2).stake(tokens(3000))
          result = await transaction.wait()
          let afterStaking2 = await coo.balanceOf(user2.address)

                  // Time speed the blockchain
                  increaseTime(86400) // 1 Day
                  mineBlocks(10)

          // Connect user1 with the pool contract and claim rewards
          transaction = await pool.connect(user1).getReward()
          result = await transaction.wait()

                  // Time speed the blockchain
                  increaseTime(259200) // 3 Days
                  mineBlocks(10)

          // Connect user2 with the pool contract and claim rewards
          transaction = await pool.connect(user2).getReward()
          result2 = await transaction.wait()

          final = await coo.balanceOf(user1.address)
          let final2 = await coo.balanceOf(user2.address)

          currentReward = final - afterStaking
          currentReward2 = final2 - afterStaking2

        })
        it('User1 should claim the 25% total after 1 day', async () => {
          const event = result.events[2]
          const args = event.args
          expect(decimals(args.reward)).to.equal(currentReward)
        })
        it('User2 should claim the 75% total after 3 days', async () => {
          const event = result2.events[2]
          const args = event.args
          expect(decimals(args.reward)).to.equal(currentReward2)
        })
      })
    })

})


