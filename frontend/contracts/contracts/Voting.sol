// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Voting is Ownable {
    uint256 private _nextCampaignId = 1;
    uint256 private nextPositionId = 1;
    uint256 private nextCandidateId = 1;

    // Add public getter for nextCampaignId
    function nextCampaignId() public view returns (uint256) {
        return _nextCampaignId;
    }

    struct Campaign {
        string title;
        string description;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        mapping(uint256 => Position) positions;
        uint256 positionCount;
        mapping(uint256 => Candidate) candidates;
        uint256 candidateCount;
        mapping(address => bool) hasVoted;
        mapping(uint256 => uint256) voteCounts; // candidateId => votes
        mapping(address => mapping(uint256 => bool)) votedPositions; // voter => positionId => hasVoted
        mapping(uint256 => address[]) candidateVoters; // candidateId => array of voter addresses
    }

    struct Position {
        string name;
        string description;
        bool exists;
    }

    struct Candidate {
        string name;
        string metadata; // JSON string containing additional info like bio, image URL
        uint256 positionId;
        bool exists;
    }

    struct PositionInput {
        string name;
        string description;
    }

    struct CandidateInput {
        uint256 positionId;
        string name;
        string metadata;
    }

    // Add struct for batch voting input
    struct VoteInput {
        uint256 candidateId;
        uint256 positionId;
    }

    mapping(uint256 => Campaign) public campaigns;

    event CampaignCreated(uint256 indexed campaignId, address indexed creator, string title);
    event PositionAdded(uint256 indexed campaignId, uint256 indexed positionId, string name);
    event CandidateRegistered(uint256 indexed campaignId, uint256 indexed candidateId, string name);
    event VoteCast(uint256 indexed campaignId, uint256 indexed candidateId, address indexed voter);

    constructor() Ownable(msg.sender) {}

    modifier campaignExists(uint256 campaignId) {
        require(campaignId > 0 && campaignId < _nextCampaignId, "Campaign does not exist");
        _;
    }

    modifier campaignActive(uint256 campaignId) {
        require(campaigns[campaignId].isActive, "Campaign is not active");
        require(
            block.timestamp >= campaigns[campaignId].startTime &&
            block.timestamp <= campaigns[campaignId].endTime,
            "Campaign is not in voting period"
        );
        _;
    }

    function createCampaign(
        string memory title,
        string memory description,
        uint256 startTime,
        uint256 endTime
    ) external onlyOwner returns (uint256) {
        require(startTime > block.timestamp, "Start time must be in the future");
        require(endTime > startTime, "End time must be after start time");

        uint256 campaignId = _nextCampaignId++;
        Campaign storage campaign = campaigns[campaignId];
        campaign.title = title;
        campaign.description = description;
        campaign.startTime = startTime;
        campaign.endTime = endTime;
        campaign.isActive = true;

        emit CampaignCreated(campaignId, msg.sender, title);
        return campaignId;
    }

    function addPosition(
        uint256 campaignId,
        string memory name,
        string memory description
    ) external onlyOwner campaignExists(campaignId) returns (uint256) {
        Campaign storage campaign = campaigns[campaignId];
        require(block.timestamp < campaign.startTime, "Cannot add positions after campaign has started");
        uint256 positionId = nextPositionId++;
        
        Position storage position = campaign.positions[positionId];
        position.name = name;
        position.description = description;
        position.exists = true;
        campaign.positionCount++;

        emit PositionAdded(campaignId, positionId, name);
        return positionId;
    }

    function addPositions(
        uint256 campaignId,
        PositionInput[] memory positions
    ) external onlyOwner campaignExists(campaignId) returns (uint256[] memory) {
        Campaign storage campaign = campaigns[campaignId];
        require(block.timestamp < campaign.startTime, "Cannot add positions after campaign has started");
        uint256[] memory positionIds = new uint256[](positions.length);
        
        for (uint256 i = 0; i < positions.length; i++) {
            uint256 positionId = nextPositionId++;
            Position storage position = campaign.positions[positionId];
            position.name = positions[i].name;
            position.description = positions[i].description;
            position.exists = true;
            campaign.positionCount++;
            positionIds[i] = positionId;
            
            emit PositionAdded(campaignId, positionId, positions[i].name);
        }
        
        return positionIds;
    }

    function registerCandidate(
        uint256 campaignId,
        uint256 positionId,
        string memory name,
        string memory metadata
    ) external onlyOwner campaignExists(campaignId) returns (uint256) {
        Campaign storage campaign = campaigns[campaignId];
        require(campaign.positions[positionId].exists, "Position does not exist");

        uint256 candidateId = nextCandidateId++;
        Candidate storage candidate = campaign.candidates[candidateId];
        candidate.name = name;
        candidate.metadata = metadata;
        candidate.positionId = positionId;
        candidate.exists = true;
        campaign.candidateCount++;

        emit CandidateRegistered(campaignId, candidateId, name);
        return candidateId;
    }

    function registerCandidatesBatch(
        uint256 campaignId,
        CandidateInput[] memory candidates
    ) external onlyOwner campaignExists(campaignId) returns (uint256[] memory) {
        Campaign storage campaign = campaigns[campaignId];
        uint256[] memory candidateIds = new uint256[](candidates.length);
        
        for (uint256 i = 0; i < candidates.length; i++) {
            require(campaign.positions[candidates[i].positionId].exists, "Position does not exist");
            
            uint256 candidateId = nextCandidateId++;
            Candidate storage candidate = campaign.candidates[candidateId];
            candidate.name = candidates[i].name;
            candidate.metadata = candidates[i].metadata;
            candidate.positionId = candidates[i].positionId;
            candidate.exists = true;
            campaign.candidateCount++;
            candidateIds[i] = candidateId;
            
            emit CandidateRegistered(campaignId, candidateId, candidates[i].name);
        }
        
        return candidateIds;
    }

    function vote(
        uint256 campaignId,
        uint256 candidateId
    ) external campaignExists(campaignId) campaignActive(campaignId) {
        Campaign storage campaign = campaigns[campaignId];
        require(campaign.candidates[candidateId].exists, "Candidate does not exist");
        
        uint256 positionId = campaign.candidates[candidateId].positionId;
        
        require(!campaign.votedPositions[msg.sender][positionId], "You have already voted for this position");
        
        campaign.votedPositions[msg.sender][positionId] = true;
        campaign.voteCounts[candidateId]++;
        
        // Store the voter address for this candidate
        campaign.candidateVoters[candidateId].push(msg.sender);
        
        campaign.hasVoted[msg.sender] = true;

        emit VoteCast(campaignId, candidateId, msg.sender);
    }

    function voteBatch(
        uint256 campaignId,
        VoteInput[] memory votes
    ) external campaignExists(campaignId) campaignActive(campaignId) {
        Campaign storage campaign = campaigns[campaignId];
        
        for (uint256 i = 0; i < votes.length; i++) {
            require(campaign.candidates[votes[i].candidateId].exists, "Candidate does not exist");
            require(
                campaign.candidates[votes[i].candidateId].positionId == votes[i].positionId,
                "Candidate not registered for this position"
            );
            
            require(!campaign.votedPositions[msg.sender][votes[i].positionId], "You have already voted for this position");
            
            campaign.votedPositions[msg.sender][votes[i].positionId] = true;
            campaign.voteCounts[votes[i].candidateId]++;
            
            // Store the voter address for this candidate
            campaign.candidateVoters[votes[i].candidateId].push(msg.sender);
            
            emit VoteCast(campaignId, votes[i].candidateId, msg.sender);
        }
        
        campaign.hasVoted[msg.sender] = true;
    }

    function getVoteCount(
        uint256 campaignId,
        uint256 candidateId
    ) external view campaignExists(campaignId) returns (uint256) {
        return campaigns[campaignId].voteCounts[candidateId];
    }

    function hasVoted(
        uint256 campaignId,
        address voter
    ) external view campaignExists(campaignId) returns (bool) {
        return campaigns[campaignId].hasVoted[voter];
    }

    // Add a new function to check if a voter has voted for a specific position
    function hasVotedForPosition(
        uint256 campaignId,
        uint256 positionId,
        address voter
    ) external view campaignExists(campaignId) returns (bool) {
        return campaigns[campaignId].votedPositions[voter][positionId];
    }

    function getCampaignInfo(uint256 campaignId)
        external
        view
        campaignExists(campaignId)
        returns (
            string memory title,
            string memory description,
            uint256 startTime,
            uint256 endTime,
            bool isActive,
            uint256 positionCount,
            uint256 candidateCount
        )
    {
        Campaign storage campaign = campaigns[campaignId];
        return (
            campaign.title,
            campaign.description,
            campaign.startTime,
            campaign.endTime,
            campaign.isActive,
            campaign.positionCount,
            campaign.candidateCount
        );
    }

    // Add getter function for positions
    function getPosition(
        uint256 campaignId,
        uint256 positionId
    ) external view campaignExists(campaignId) returns (
        string memory name,
        string memory description,
        bool exists
    ) {
        Position storage position = campaigns[campaignId].positions[positionId];
        return (position.name, position.description, position.exists);
    }

    // Add getter function for candidates
    function getCandidate(
        uint256 campaignId,
        uint256 candidateId
    ) external view campaignExists(campaignId) returns (
        string memory name,
        string memory metadata,
        uint256 positionId,
        bool exists
    ) {
        Candidate storage candidate = campaigns[campaignId].candidates[candidateId];
        return (candidate.name, candidate.metadata, candidate.positionId, candidate.exists);
    }

    // Add a new function to get voters for a specific candidate
    function getCandidateVoters(
        uint256 campaignId,
        uint256 candidateId
    ) external view campaignExists(campaignId) returns (address[] memory) {
        require(campaigns[campaignId].candidates[candidateId].exists, "Candidate does not exist");
        return campaigns[campaignId].candidateVoters[candidateId];
    }
}