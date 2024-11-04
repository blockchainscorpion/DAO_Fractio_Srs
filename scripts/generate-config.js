const fs = require('fs');
const path = require('path');

// Read the contract artifacts from the build directory
const Governance = require('../build/contracts/Governance.json');
const GovernanceToken = require('../build/contracts/GovernanceToken.json');

// Get the most recent deployment addresses
const networkId = Object.keys(Governance.networks).pop();
const governanceAddress = Governance.networks[networkId].address;
const tokenAddress = GovernanceToken.networks[networkId].address;

// Create the config content
const configContent = `const CONFIG = {
    GOVERNANCE_ABI: ${JSON.stringify(Governance.abi, null, 2)},
    GOVERNANCE_TOKEN_ABI: ${JSON.stringify(GovernanceToken.abi, null, 2)},
    GOVERNANCE_ADDRESS: "${governanceAddress}",
    TOKEN_ADDRESS: "${tokenAddress}"
};

// Make CONFIG available globally
window.CONFIG = CONFIG;`;

// Write the config file to the client/js directory
fs.writeFileSync(
  path.join(__dirname, '..', 'client', 'js', 'config.js'),
  configContent
);

console.log('Config file generated successfully!');
