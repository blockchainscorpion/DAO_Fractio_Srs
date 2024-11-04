// dao-integration.js - Place in Fractio_DAO_FRONTEND/js/

// Initialize Web3 and contracts using existing config
const initWeb3 = async () => {
  try {
    if (typeof window.ethereum !== 'undefined') {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      window.web3 = new Web3(window.ethereum);

      // Initialize contract instances using our config
      window.governanceContract = new web3.eth.Contract(
        CONFIG.GOVERNANCE_ABI,
        CONFIG.GOVERNANCE_ADDRESS
      );

      window.tokenContract = new web3.eth.Contract(
        CONFIG.GOVERNANCE_TOKEN_ABI,
        CONFIG.TOKEN_ADDRESS
      );

      console.log('✅ Web3 initialized successfully');
      console.log('📝 Connected account:', accounts[0]);
      return accounts[0];
    } else {
      throw new Error('Please install MetaMask');
    }
  } catch (error) {
    console.error('❌ Error initializing Web3:', error);
    return null;
  }
};

// DAO page functionality
const daoPageFunctions = {
  // Load and display DAO stats
  async loadDAOStats(account) {
    try {
      // Get total members
      const memberCount = await window.governanceContract.methods.memberList()
        .length;
      document.getElementById('totalMembers').textContent = memberCount;

      // Get user's voting power
      const votingPower = await window.governanceContract.methods
        .votingPower(account)
        .call();
      document.getElementById('votingPower').textContent = web3.utils.fromWei(
        votingPower,
        'ether'
      );

      // Get quorum percentage
      const quorum = await window.governanceContract.methods
        .quorumPercentage()
        .call();
      document.getElementById('quorumPercentage').textContent = quorum + '%';

      // Get active proposals
      const proposalCount = await window.governanceContract.methods
        .proposalCount()
        .call();
      let activeProposals = 0;

      for (let i = 0; i < proposalCount; i++) {
        const proposal = await window.governanceContract.methods
          .proposals(i)
          .call();
        if (!proposal.executed) activeProposals++;
      }

      document.getElementById('activeProposals').textContent = activeProposals;
    } catch (error) {
      console.error('Error loading DAO stats:', error);
    }
  },

  // Load and display proposals
  async loadProposals() {
    try {
      const proposalCount = await window.governanceContract.methods
        .proposalCount()
        .call();
      const proposalsList = document.getElementById('proposalsList');
      proposalsList.innerHTML = ''; // Clear existing proposals

      for (let i = 0; i < proposalCount; i++) {
        const proposal = await window.governanceContract.methods
          .proposals(i)
          .call();

        const proposalElement = document.createElement('div');
        proposalElement.className = 'proposal-item';
        proposalElement.innerHTML = `
                    <div class="flex justify-between items-center p-4 border-b">
                        <div>
                            <h3 class="text-lg font-semibold">${
                              proposal.description
                            }</h3>
                            <p class="text-sm text-gray-600">
                                Proposed by: ${proposal.proposer.slice(
                                  0,
                                  6
                                )}...${proposal.proposer.slice(-4)}
                            </p>
                            <div class="mt-2">
                                <span class="mr-4">For: ${web3.utils.fromWei(
                                  proposal.forVotes,
                                  'ether'
                                )}</span>
                                <span>Against: ${web3.utils.fromWei(
                                  proposal.againstVotes,
                                  'ether'
                                )}</span>
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="daoPageFunctions.castVote(${
                              proposal.id
                            }, true)" 
                                    class="bg-green-500 text-white px-4 py-2 rounded">
                                Vote For
                            </button>
                            <button onclick="daoPageFunctions.castVote(${
                              proposal.id
                            }, false)"
                                    class="bg-red-500 text-white px-4 py-2 rounded">
                                Vote Against
                            </button>
                        </div>
                    </div>
                `;

        proposalsList.appendChild(proposalElement);
      }
    } catch (error) {
      console.error('Error loading proposals:', error);
    }
  },

  // Cast a vote
  async castVote(proposalId, support) {
    try {
      const accounts = await web3.eth.getAccounts();
      await window.governanceContract.methods
        .vote(proposalId, support)
        .send({ from: accounts[0] });

      // Refresh the proposals list
      await this.loadProposals();
      await this.loadDAOStats(accounts[0]);
    } catch (error) {
      console.error('Error casting vote:', error);
      alert('Error casting vote. Check console for details.');
    }
  },

  // Create a new proposal
  async createProposal(description) {
    try {
      const accounts = await web3.eth.getAccounts();
      await window.governanceContract.methods
        .createProposal(description)
        .send({ from: accounts[0] });

      // Refresh the proposals list
      await this.loadProposals();
      await this.loadDAOStats(accounts[0]);
    } catch (error) {
      console.error('Error creating proposal:', error);
      alert('Error creating proposal. Check console for details.');
    }
  },
};

// Initialize DAO page
async function initDAOPage() {
  const account = await initWeb3();
  if (account) {
    // Bind create proposal form
    document
      .querySelector('#createProposalForm')
      ?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const description = document.querySelector(
          '#proposalDescription'
        ).value;
        await daoPageFunctions.createProposal(description);
      });

    // Load initial data
    await daoPageFunctions.loadDAOStats(account);
    await daoPageFunctions.loadProposals();

    // Set up event listeners for contract events
    window.governanceContract.events.ProposalCreated().on('data', async () => {
      await daoPageFunctions.loadProposals();
      await daoPageFunctions.loadDAOStats(account);
    });

    window.governanceContract.events.Voted().on('data', async () => {
      await daoPageFunctions.loadProposals();
      await daoPageFunctions.loadDAOStats(account);
    });
  }
}

// Make functions available globally
window.daoPageFunctions = daoPageFunctions;
window.initDAOPage = initDAOPage;

// Initialize when document is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDAOPage);
} else {
  initDAOPage();
}
