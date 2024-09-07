import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const AirdropToken = buildModule("AirdropTokenModule", (m) => {
  const airdropToken = m.contract("AirdropToken");

  return { airdropToken };
});

export default AirdropToken;
