import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Voting } from '../typechain-types';
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';

describe('Voting Contract', function () {
  let voting: Voting;
  let owner: HardhatEthersSigner;
  let voter1: HardhatEthersSigner;
  let voter2: HardhatEthersSigner;
  
  beforeEach(async function () {
    [owner, voter1, voter2] = await ethers.getSigners();
    const VotingFactory = await ethers.getContractFactory('Voting');
    voting = await VotingFactory.deploy();
  });

  describe('Campaign Creation', function () {
    let now: number;
    let startTime: number;
    let endTime: number;

    beforeEach(async function () {
      const block = await ethers.provider.getBlock('latest');
      now = block.timestamp;
      startTime = now + 3600; // Start in 1 hour
      endTime = startTime + 86400; // End in 24 hours
    });

    it('Should create a campaign successfully', async function () {
      const tx = await voting.createCampaign(
        'Test Campaign',
        'Test Description',
        startTime,
        endTime
      );

      // Wait for the transaction to be mined
      await tx.wait();

      const campaignInfo = await voting.getCampaignInfo(1);
      expect(campaignInfo.title).to.equal('Test Campaign');
      expect(campaignInfo.description).to.equal('Test Description');
      expect(campaignInfo.startTime).to.equal(startTime);
      expect(campaignInfo.endTime).to.equal(endTime);
      expect(campaignInfo.isActive).to.be.true;
      expect(campaignInfo.positionCount).to.equal(0);
      expect(campaignInfo.candidateCount).to.equal(0);
    });

    it('Should fail if campaign description is empty', async function () {
      await expect(
        voting.createCampaign('No Description Campaign', '', startTime, endTime)
      ).to.be.revertedWith('Campaign description cannot be empty');
    });

    it('Should fail if start time is in the past', async function () {
      const pastStartTime = now - 3600;
      await expect(
        voting.createCampaign('Test Campaign', 'Test Description', pastStartTime, endTime)
      ).to.be.revertedWith('Start time must be in the future');
    });

    it('Should fail if end time is before start time', async function () {
      const invalidEndTime = startTime - 3600;
      await expect(
        voting.createCampaign('Test Campaign', 'Test Description', startTime, invalidEndTime)
      ).to.be.revertedWith('End time must be after start time');
    });
  });

  describe('Position Management', function () {
    let now: number;
    let startTime: number;
    let endTime: number;

    beforeEach(async function () {
      const block = await ethers.provider.getBlock('latest');
      now = block.timestamp;
      startTime = now + 3600;
      endTime = startTime + 86400;
      await voting.createCampaign('Test Campaign', 'Test Description', startTime, endTime);
    });

    it('Should add a single position successfully', async function () {
      const tx = await voting.addPosition(1, 'President', 'Campaign President');
      await tx.wait();

      const position = await voting.getPosition(1, 1);
      expect(position.name).to.equal('President');
      expect(position.description).to.equal('Campaign President');
      expect(position.exists).to.be.true;
    });

    it('Should add multiple positions successfully', async function () {
      const positions = [
        { name: 'President', description: 'Campaign President' },
        { name: 'Secretary', description: 'Campaign Secretary' }
      ];

      const tx = await voting.addPositions(1, positions);
      await tx.wait();

      const position1 = await voting.getPosition(1, 1);
      const position2 = await voting.getPosition(1, 2);

      expect(position1.name).to.equal('President');
      expect(position2.name).to.equal('Secretary');
      expect(position1.exists).to.be.true;
      expect(position2.exists).to.be.true;
    });

    it('Should fail to add position after campaign starts', async function () {
      // Move time forward to after campaign start
      await ethers.provider.send('evm_setNextBlockTimestamp', [startTime + 1]);
      await ethers.provider.send('evm_mine', []);

      await expect(
        voting.addPosition(1, 'President', 'Campaign President')
      ).to.be.revertedWith('Cannot add positions after campaign has started');
    });

    it('Should handle empty positions array', async function () {
      const positions: { name: string; description: string }[] = [];
      // Instead of expecting a revert, we simply call the function and then check that no new positions were added
      await voting.addPositions(1, positions);
      const campaignInfo = await voting.getCampaignInfo(1);
      expect(campaignInfo.positionCount).to.equal(0);
    });

    it('Should add duplicate positions when names are identical', async function () {
      const positions = [
        { name: 'President', description: 'Campaign President' },
        { name: 'President', description: 'Another President' }
      ];
      await voting.addPositions(1, positions);
      const campaignInfo = await voting.getCampaignInfo(1);
      // Expect both positions to be added
      expect(campaignInfo.positionCount).to.equal(2);
      const position1 = await voting.getPosition(1, 1);
      const position2 = await voting.getPosition(1, 2);
      expect(position1.name).to.equal('President');
      expect(position2.name).to.equal('President');
    });

    it('Should optimize gas usage for batch creation', async function () {
      const positions = Array(5).fill(null).map((_, i) => ({
        name: `Position ${i + 1}`,
        description: `Description ${i + 1}`
      }));

      // Gas comparison
      const singleTx = await voting.addPosition(1, 'Single Position', 'Test');
      const singleReceipt = await singleTx.wait();
      const singleGas = singleReceipt?.gasUsed || 0n;

      const batchTx = await voting.addPositions(1, positions);
      const batchReceipt = await batchTx.wait();
      const batchGas = batchReceipt?.gasUsed || 0n;

      // Batch should use less gas per position than individual transactions would
      const estimatedSingleGasTotal = singleGas * 5n;
      expect(batchGas).to.be.lt(estimatedSingleGasTotal);
    });

    it('Should return correct position count after batch creation', async function () {
      const positions = [
        { name: 'President', description: 'Campaign President' },
        { name: 'Secretary', description: 'Campaign Secretary' },
        { name: 'Treasurer', description: 'Campaign Treasurer' }
      ];
      
      await voting.addPositions(1, positions);
      const campaignInfo = await voting.getCampaignInfo(1);
      expect(campaignInfo.positionCount).to.equal(3);
      
      // Verify each position exists and is retrievable
      for (let i = 1; i <= positions.length; i++) {
        const position = await voting.getPosition(1, i);
        expect(position.exists).to.be.true;
        expect(position.name).to.equal(positions[i - 1].name);
      }
    });
  });

  describe('Candidate Registration', function () {
    let now: number;
    let startTime: number;
    let endTime: number;

    beforeEach(async function () {
      const block = await ethers.provider.getBlock('latest');
      now = block.timestamp;
      startTime = now + 3600;
      endTime = startTime + 86400;
      await voting.createCampaign('Test Campaign', 'Test Description', startTime, endTime);
      await voting.addPosition(1, 'President', 'Campaign President');
    });

    it('Should register a candidate successfully', async function () {
      const metadata = JSON.stringify({
        bio: 'Experienced leader',
        imageUrl: 'https://example.com/image.jpg'
      });

      const tx = await voting.registerCandidate(1, 1, 'John Doe', metadata);
      await tx.wait();

      const candidate = await voting.getCandidate(1, 1);
      expect(candidate.name).to.equal('John Doe');
      expect(candidate.metadata).to.equal(metadata);
      expect(candidate.positionId).to.equal(1);
      expect(candidate.exists).to.be.true;
    });

    it('Should fail to register candidate for non-existent position', async function () {
      await expect(
        voting.registerCandidate(1, 999, 'John Doe', '{}')
      ).to.be.revertedWith('Position does not exist');
    });
  });

  describe('Batch Candidate Registration', function () {
    let now: number;
    let startTime: number;
    let endTime: number;

    beforeEach(async function () {
      const block = await ethers.provider.getBlock('latest');
      now = block.timestamp;
      startTime = now + 3600;
      endTime = startTime + 86400;
      await voting.createCampaign('Test Campaign', 'Test Description', startTime, endTime);
      await voting.addPosition(1, 'President', 'Campaign President');
      await voting.addPosition(1, 'Secretary', 'Campaign Secretary');
    });

    it('Should register multiple candidates successfully', async function () {
      const candidates = [
        {
          positionId: 1,
          name: 'John Doe',
          metadata: JSON.stringify({
            bio: 'Experienced leader',
            imageUrl: 'https://example.com/john.jpg'
          })
        },
        {
          positionId: 2,
          name: 'Jane Smith',
          metadata: JSON.stringify({
            bio: 'Dedicated secretary',
            imageUrl: 'https://example.com/jane.jpg'
          })
        }
      ];

      const tx = await voting.registerCandidatesBatch(1, candidates);
      const receipt = await tx.wait();

      // Get campaign info to verify candidate count
      const campaignInfo = await voting.getCampaignInfo(1);
      expect(campaignInfo.candidateCount).to.equal(2);

      // Verify each candidate exists and has correct data
      const candidate1 = await voting.getCandidate(1, 1);
      const candidate2 = await voting.getCandidate(1, 2);

      expect(candidate1.name).to.equal('John Doe');
      expect(candidate1.positionId).to.equal(1);
      expect(candidate1.exists).to.be.true;

      expect(candidate2.name).to.equal('Jane Smith');
      expect(candidate2.positionId).to.equal(2);
      expect(candidate2.exists).to.be.true;
    });

    it('Should optimize gas usage for batch registration', async function () {
      // Single candidate registration
      const singleTx = await voting.registerCandidate(1, 1, 'Single Candidate', '{}');
      const singleReceipt = await singleTx.wait();
      const singleGas = singleReceipt?.gasUsed || 0n;

      // Batch registration of 5 candidates
      const candidates = Array(5).fill(null).map((_, i) => ({
        positionId: 1,
        name: `Candidate ${i + 1}`,
        metadata: '{}'
      }));

      const batchTx = await voting.registerCandidatesBatch(1, candidates);
      const batchReceipt = await batchTx.wait();
      const batchGas = batchReceipt?.gasUsed || 0n;

      // Batch should use less gas per candidate than individual transactions would
      const estimatedSingleGasTotal = singleGas * 5n;
      expect(batchGas).to.be.lt(estimatedSingleGasTotal);
    });

    it('Should fail if any position does not exist', async function () {
      const candidates = [
        {
          positionId: 1,
          name: 'Valid Candidate',
          metadata: '{}'
        },
        {
          positionId: 999, // Non-existent position
          name: 'Invalid Candidate',
          metadata: '{}'
        }
      ];

      await expect(
        voting.registerCandidatesBatch(1, candidates)
      ).to.be.revertedWith('Position does not exist');
    });

    it('Should handle empty candidates array', async function () {
      const tx = await voting.registerCandidatesBatch(1, []);
      const receipt = await tx.wait();
      
      const campaignInfo = await voting.getCampaignInfo(1);
      expect(campaignInfo.candidateCount).to.equal(0);
    });
  });

  describe('Voting', function () {
    let now: number;
    let startTime: number;
    let endTime: number;

    beforeEach(async function () {
      const block = await ethers.provider.getBlock('latest');
      now = block.timestamp;
      startTime = now + 3600;
      endTime = startTime + 86400;
      await voting.createCampaign('Test Campaign', 'Test Description', startTime, endTime);
      await voting.addPosition(1, 'President', 'Campaign President');
      await voting.registerCandidate(1, 1, 'John Doe', '{}');

      // Move time to active voting period
      await ethers.provider.send('evm_setNextBlockTimestamp', [startTime + 1]);
      await ethers.provider.send('evm_mine', []);
    });

    it('Should allow voting during active period', async function () {
      const voteTx = await voting.connect(voter1).vote(1, 1);
      await voteTx.wait();

      const voteCount = await voting.getVoteCount(1, 1);
      expect(voteCount).to.equal(1);

      const hasVoted = await voting.hasVoted(1, voter1.address);
      expect(hasVoted).to.be.true;
    });

    it('Should prevent double voting', async function () {
      await voting.connect(voter1).vote(1, 1);
      await expect(
        voting.connect(voter1).vote(1, 1)
      ).to.be.revertedWith('Already voted in this campaign');
    });

    it('Should prevent voting before start time', async function () {
      // Create a new campaign with future voting period
      const futureStart = startTime + 7200;
      const futureEnd = endTime + 7200;
      await voting.createCampaign('Future Campaign', 'Test', futureStart, futureEnd);
      await voting.addPosition(2, 'President', 'Campaign President');
      await voting.registerCandidate(2, 2, 'Jane Doe', '{}');

      await expect(
        voting.connect(voter1).vote(2, 2)
      ).to.be.revertedWith('Campaign is not in voting period');
    });

    it('Should prevent voting after end time', async function () {
      // Move time past end time
      await ethers.provider.send('evm_setNextBlockTimestamp', [endTime + 1]);
      await ethers.provider.send('evm_mine', []);

      await expect(
        voting.connect(voter1).vote(1, 1)
      ).to.be.revertedWith('Campaign is not in voting period');
    });

    it('Should revert when voting for non-existent candidate', async function () {
      // Attempt to vote for candidate id 999 which does not exist
      await expect(
        voting.connect(voter1).vote(1, 999)
      ).to.be.revertedWith('Candidate does not exist');
    });

    it('Should count votes accurately for multiple voters', async function () {
      // Reset state: deploy a fresh campaign and candidate
      // Note: Using campaign from beforeEach
      const voteTx1 = await voting.connect(voter1).vote(1, 1);
      await voteTx1.wait();
      const voteTx2 = await voting.connect(voter2).vote(1, 1);
      await voteTx2.wait();
      const voteCount = await voting.getVoteCount(1, 1);
      expect(voteCount).to.equal(2);
    });
  });
});