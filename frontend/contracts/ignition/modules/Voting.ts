import { buildModule } from "@nomicfoundation/hardhat-ignition";

export default buildModule("VotingModule", (m) => {
  const voting = m.contract("Voting");

  // Log deployment details for verification
  m.afterDeploy(async (_, contracts) => {
    console.log("Voting contract deployed to:", await contracts.voting.getAddress());
    console.log("Owner:", await contracts.voting.owner());
    console.log("Next campaign ID:", await contracts.voting.nextCampaignId());
  });

  return { voting };
});