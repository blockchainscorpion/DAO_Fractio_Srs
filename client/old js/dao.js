// dao.js

// Initialize Web3 and load DAO data when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Initialize Web3 and check if successful
    if (typeof window.ethereum === 'undefined') {
      throw new Error('Please install MetaMask to use this dApp');
    }

    // Request account access
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });
    const userAddress = accounts[0];

    // Initialize Web3 instance
    window.web3 = new Web3(window.ethereum);

    // Initialize contract instances
    const governance = new web3.eth.Contract(
      CONFIG.GOVERNANCE_ABI,
      CONFIG.GOVERNANCE_ADDRESS
    );
    const token = new web3.eth.Contract(
      CONFIG.GOVERNANCE_TOKEN_ABI,
      CONFIG.TOKEN_ADDRESS
    );

    // Load initial DAO data
    await loadDAOStats(governance, token, userAddress);
    await loadProposals(governance, userAddress);
    await loadRecentVotes(governance);

    // Set up event listeners
    setupEventListeners(governance, token, userAddress);
    setupFormListeners(governance, userAddress);
  } catch (error) {
    console.error('Failed to initialize Web3:', error);
    showError('Failed to connect to blockchain. Please check MetaMask.');
  }
});

// Function to load DAO statistics
async function loadDAOStats(governance, token, userAddress) {
  try {
    // Get member count
    const memberList = await getMemberList(governance);
    document.getElementById('totalMembers').textContent = memberList.length;

    // Get total proposals
    const proposalCount = await governance.methods.proposalCount().call();
    let activeProposals = 0;
    const votingPeriod = await governance.methods.votingPeriod().call();

    // Count active proposals
    for (let i = 0; i < proposalCount; i++) {
      const proposal = await governance.methods.proposals(i).call();
      if (
        !proposal.executed &&
        parseInt(proposal.startTime) + parseInt(votingPeriod) >
          Date.now() / 1000
      ) {
        activeProposals++;
      }
    }
    document.getElementById('activeProposals').textContent = activeProposals;

    // Get user's voting power
    const votingPower = await governance.methods
      .votingPower(userAddress)
      .call();
    document.getElementById('votingPower').textContent = web3.utils.fromWei(
      votingPower,
      'ether'
    );

    // Get quorum percentage
    const quorum = await governance.methods.quorumPercentage().call();
    document.getElementById('quorumPercentage').textContent = `${quorum}%`;
  } catch (error) {
    console.error('Error loading DAO stats:', error);
    showError('Failed to load DAO statistics');
  }
}

// Function to load proposals
async function loadProposals(governance, userAddress) {
  try {
    const proposalsList = document.getElementById('proposalsList');
    proposalsList.innerHTML = '';

    const proposalCount = await governance.methods.proposalCount().call();
    const votingPeriod = await governance.methods.votingPeriod().call();

    for (let i = proposalCount - 1; i >= 0; i--) {
      const proposal = await governance.methods.proposals(i).call();
      const hasVoted = await governance.methods.hasVoted(userAddress, i).call();
      const isActive =
        parseInt(proposal.startTime) + parseInt(votingPeriod) >
        Date.now() / 1000;

      const proposalElement = document.createElement('div');
      proposalElement.className = 'proposal-item';
      proposalElement.innerHTML = `
                <h3>Proposal #${proposal.id}</h3>
                <p>${proposal.description}</p>
                <div class="proposal-stats">
                    <span>For: ${web3.utils.fromWei(
                      proposal.forVotes,
                      'ether'
                    )}</span>
                    <span>Against: ${web3.utils.fromWei(
                      proposal.againstVotes,
                      'ether'
                    )}</span>
                </div>
                ${
                  isActive && !hasVoted
                    ? `
                    <div class="proposal-actions">
                        <button onclick="vote(${proposal.id}, true)">Vote For</button>
                        <button onclick="vote(${proposal.id}, false)">Vote Against</button>
                    </div>
                `
                    : ''
                }
                ${
                  !isActive && !proposal.executed
                    ? `
                    <button onclick="executeProposal(${proposal.id})">Execute Proposal</button>
                `
                    : ''
                }
                <div class="proposal-status">
                    ${
                      proposal.executed
                        ? 'Executed'
                        : isActive
                        ? 'Active'
                        : 'Ended'
                    }
                </div>
            `;
      proposalsList.appendChild(proposalElement);
    }
  } catch (error) {
    console.error('Error loading proposals:', error);
    showError('Failed to load proposals');
  }
}

// Function to load recent votes
async function loadRecentVotes(governance) {
  try {
    const votesList = document.getElementById('votesList');
    votesList.innerHTML = '';

    // Get past vote events
    const pastVotes = await governance.getPastEvents('Voted', {
      fromBlock: 'latest',
      toBlock: 'latest',
    });

    for (const voteEvent of pastVotes.slice(-5)) {
      const proposal = await governance.methods
        .proposals(voteEvent.returnValues.proposalId)
        .call();

      const voteElement = document.createElement('div');
      voteElement.className = 'vote-item';
      voteElement.innerHTML = `
                <p>
                    <strong>${voteEvent.returnValues.voter.slice(
                      0,
                      6
                    )}...${voteEvent.returnValues.voter.slice(-4)}</strong> 
                    voted ${voteEvent.returnValues.support ? 'for' : 'against'} 
                    proposal #${voteEvent.returnValues.proposalId}
                </p>
                <span class="vote-weight">
                    Weight: ${web3.utils.fromWei(
                      voteEvent.returnValues.weight,
                      'ether'
                    )}
                </span>
            `;
      votesList.appendChild(voteElement);
    }
  } catch (error) {
    console.error('Error loading recent votes:', error);
    showError('Failed to load recent votes');
  }
}

// Function to create a new proposal
async function createProposal(description) {
  try {
    const governance = new web3.eth.Contract(
      CONFIG.GOVERNANCE_ABI,
      CONFIG.GOVERNANCE_ADDRESS
    );

    await governance.methods.createProposal(description).send({
      from: window.ethereum.selectedAddress,
    });

    showMessage('Proposal created successfully');
    await loadProposals(governance, window.ethereum.selectedAddress);
  } catch (error) {
    console.error('Error creating proposal:', error);
    showError(
      'Failed to create proposal. Check if you are a member with KYC status.'
    );
  }
}

// Function to cast a vote
async function vote(proposalId, support) {
  try {
    const governance = new web3.eth.Contract(
      CONFIG.GOVERNANCE_ABI,
      CONFIG.GOVERNANCE_ADDRESS
    );

    await governance.methods.vote(proposalId, support).send({
      from: window.ethereum.selectedAddress,
    });

    showMessage('Vote cast successfully');
    await loadProposals(governance, window.ethereum.selectedAddress);
    await loadRecentVotes(governance);
  } catch (error) {
    console.error('Error casting vote:', error);
    showError('Failed to cast vote. Check if you are eligible to vote.');
  }
}

// Function to execute a proposal
async function executeProposal(proposalId) {
  try {
    const governance = new web3.eth.Contract(
      CONFIG.GOVERNANCE_ABI,
      CONFIG.GOVERNANCE_ADDRESS
    );

    await governance.methods.executeProposal(proposalId).send({
      from: window.ethereum.selectedAddress,
    });

    showMessage('Proposal executed successfully');
    await loadProposals(governance, window.ethereum.selectedAddress);
  } catch (error) {
    console.error('Error executing proposal:', error);
    showError('Failed to execute proposal. Check if conditions are met.');
  }
}

// Function to delegate voting power
async function delegateVotingPower(delegatee) {
  try {
    const governance = new web3.eth.Contract(
      CONFIG.GOVERNANCE_ABI,
      CONFIG.GOVERNANCE_ADDRESS
    );

    await governance.methods.delegate(delegatee).send({
      from: window.ethereum.selectedAddress,
    });

    showMessage('Voting power delegated successfully');
    await loadDAOStats(governance, null, window.ethereum.selectedAddress);
  } catch (error) {
    console.error('Error delegating voting power:', error);
    showError('Failed to delegate voting power. Check the address is valid.');
  }
}

// Function to set up event listeners for real-time updates
function setupEventListeners(governance, token, userAddress) {
  // Listen for proposal creation
  governance.events
    .ProposalCreated()
    .on('data', async () => {
      await loadProposals(governance, userAddress);
      await loadDAOStats(governance, token, userAddress);
    })
    .on('error', console.error);

  // Listen for votes
  governance.events
    .Voted()
    .on('data', async () => {
      await loadProposals(governance, userAddress);
      await loadRecentVotes(governance);
      await loadDAOStats(governance, token, userAddress);
    })
    .on('error', console.error);

  // Listen for proposal execution
  governance.events
    .ProposalExecuted()
    .on('data', async () => {
      await loadProposals(governance, userAddress);
      await loadDAOStats(governance, token, userAddress);
    })
    .on('error', console.error);

  // Listen for delegation changes
  governance.events
    .DelegateChanged()
    .on('data', async () => {
      await loadDAOStats(governance, token, userAddress);
    })
    .on('error', console.error);
}

// Function to set up form listeners
function setupFormListeners(governance, userAddress) {
  // Proposal creation form
  const proposalForm = document.getElementById('proposalForm');
  if (proposalForm) {
    proposalForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const description = document.getElementById('proposalDescription').value;
      await createProposal(description);
    });
  }

  // Delegation form
  const delegateForm = document.getElementById('delegateForm');
  if (delegateForm) {
    delegateForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const delegatee = document.getElementById('delegateAddress').value;
      await delegateVotingPower(delegatee);
    });
  }
}

// Utility function to get member list
async function getMemberList(governance) {
  try {
    const memberList = [];
    let i = 0;
    while (true) {
      try {
        const member = await governance.methods.memberList(i).call();
        if (member === '0x0000000000000000000000000000000000000000') break;
        memberList.push(member);
        i++;
      } catch (error) {
        break;
      }
    }
    return memberList;
  } catch (error) {
    console.error('Error getting member list:', error);
    return [];
  }
}

// Utility function to show messages
function showMessage(message, type = 'info') {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${type}`;
  messageDiv.textContent = message;
  document.body.appendChild(messageDiv);
  setTimeout(() => messageDiv.remove(), 5000);
}

// Utility function to show errors
function showError(message) {
  showMessage(message, 'error');
}

// Add MetaMask account change listener
if (window.ethereum) {
  window.ethereum.on('accountsChanged', function (accounts) {
    window.location.reload();
  });

  window.ethereum.on('chainChanged', function (chainId) {
    window.location.reload();
  });
}

// Make functions available globally for button onclick handlers
window.vote = vote;
window.executeProposal = executeProposal;
window.createProposal = createProposal;
window.delegateVotingPower = delegateVotingPower;
