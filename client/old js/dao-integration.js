/**
 * Initialize Web3 and connect to MetaMask
 * @returns {Promise<string|null>} Connected account address or null if failed
 */
const initWeb3 = async () => {
  try {
    if (typeof window.ethereum !== 'undefined') {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      window.web3 = new Web3(window.ethereum);

      // Initialize contract instances
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
  /**
   * Check if an address is a member and handle membership if needed
   * @param {string} address Address to check
   * @returns {Promise<boolean>} True if address is a member
   */
  async checkAndHandleMembership(address) {
    try {
      // Check if user is already a member
      const member = await window.governanceContract.methods
        .members(address)
        .call();

      if (!member.isApproved) {
        // Check if user has admin role to add themselves as member
        const adminRole = await window.governanceContract.methods
          .ADMIN_ROLE()
          .call();
        const isAdmin = await window.governanceContract.methods
          .hasRole(adminRole, address)
          .call();

        if (isAdmin) {
          // If admin, add self as member
          console.log('Adding user as member (admin)...');
          await window.governanceContract.methods
            .addMember(address, web3.utils.toWei('1', 'ether')) // Default voting power of 1 ETH
            .send({
              from: address,
              gas: 200000,
            });
          return true;
        } else {
          // If not admin, show appropriate message
          throw new Error(
            'You need to be added as a member by an admin before creating proposals. Please contact the DAO administrator.'
          );
        }
      }
      return true;
    } catch (error) {
      console.error('Membership check failed:', error);
      throw error;
    }
  },

  /**
   * Grant admin role to an address (helper function for testing)
   * @param {string} address Address to grant admin role to
   */
  async grantAdminRole(address) {
    try {
      const adminRole = await window.governanceContract.methods
        .ADMIN_ROLE()
        .call();
      const accounts = await web3.eth.getAccounts();

      // Check if caller has admin role
      const hasAdminRole = await window.governanceContract.methods
        .hasRole(adminRole, accounts[0])
        .call();

      if (!hasAdminRole) {
        throw new Error('Only existing admins can grant admin roles');
      }

      await window.governanceContract.methods
        .grantRole(adminRole, address)
        .send({
          from: accounts[0],
          gas: 200000,
        });

      console.log('Admin role granted to:', address);
      return true;
    } catch (error) {
      console.error('Error granting admin role:', error);
      throw error;
    }
  },
  /**
   * Load and display DAO statistics
   * @param {string} account Connected account address
   */
  async loadDAOStats(account) {
    try {
      // Get member list length using events or direct query
      const memberList = await window.governanceContract.methods
        .memberList(0)
        .call();
      let memberCount = 0;
      while (true) {
        try {
          await window.governanceContract.methods
            .memberList(memberCount)
            .call();
          memberCount++;
        } catch (e) {
          break;
        }
      }
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
      throw error;
    }
  },

  /**
   * Load and display all proposals
   */
  async loadProposals() {
    try {
      const proposalCount = await window.governanceContract.methods
        .proposalCount()
        .call();
      const proposalsList = document.getElementById('proposalsList');
      proposalsList.innerHTML = '';

      for (let i = 0; i < proposalCount; i++) {
        const proposal = await window.governanceContract.methods
          .proposals(i)
          .call();

        // Check if user has already voted
        const userAddress = (await web3.eth.getAccounts())[0];
        const hasVoted = await window.governanceContract.methods
          .hasVoted(userAddress, i)
          .call();

        const proposalElement = this.createProposalElement(
          proposal,
          i,
          hasVoted
        );
        proposalsList.appendChild(proposalElement);
      }
    } catch (error) {
      console.error('Error loading proposals:', error);
      throw error;
    }
  },

  /**
   * Create a proposal HTML element
   * @param {Object} proposal Proposal data
   * @param {number} proposalId Proposal ID
   * @param {boolean} hasVoted Whether current user has voted
   * @returns {HTMLElement} Proposal element
   */
  createProposalElement(proposal, proposalId, hasVoted) {
    const element = document.createElement('div');
    element.className = 'proposal-item p-4 border-b';

    element.innerHTML = `
      <div>
        <h3 class="text-lg font-semibold">${proposal.description}</h3>
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
      ${
        !hasVoted && !proposal.executed
          ? `<div class="flex gap-2 mt-2">
               <button onclick="daoPageFunctions.castVote(${proposalId}, true)" 
                       class="bg-green-500 text-white px-4 py-2 rounded">
                 Vote For
               </button>
               <button onclick="daoPageFunctions.castVote(${proposalId}, false)"
                       class="bg-red-500 text-white px-4 py-2 rounded">
                 Vote Against
               </button>
             </div>`
          : '<p class="text-sm text-gray-500 mt-2">Already voted or proposal executed</p>'
      }
    `;

    return element;
  },

  /**
   * Cast a vote on a proposal
   * @param {number} proposalId Proposal ID
   * @param {boolean} support Whether to support the proposal
   */
  async castVote(proposalId, support) {
    try {
      const accounts = await web3.eth.getAccounts();
      await window.governanceContract.methods.vote(proposalId, support).send({
        from: accounts[0],
        gas: 200000, // Specify gas limit
      });

      await this.loadProposals();
      await this.loadDAOStats(accounts[0]);
    } catch (error) {
      console.error('Error casting vote:', error);
      alert('Error casting vote: ' + error.message);
    }
  },

  /**
   * Create a new proposal
   * @param {string} description Proposal description
   */
  async createProposal(description) {
    try {
      const accounts = await web3.eth.getAccounts();

      // First check and handle membership
      await this.checkAndHandleMembership(accounts[0]);

      console.log('Creating proposal...');
      const tx = await window.governanceContract.methods
        .createProposal(description)
        .send({
          from: accounts[0],
          gas: 500000, // Specify gas limit
        });

      await this.loadProposals();
      await this.loadDAOStats(accounts[0]);
    } catch (error) {
      console.error('Error creating proposal:', error);
      alert('Error creating proposal: ' + error.message);
    }
  },
};

/**
 * Initialize the DAO page
 */
async function initDAOPage() {
  try {
    const account = await initWeb3();
    if (!account) {
      throw new Error('Failed to get account');
    }

    console.log('Checking initial setup...');

    // Check if user has admin role or if we need to set up initial admin
    const adminRole = await window.governanceContract.methods
      .ADMIN_ROLE()
      .call();
    const hasAdminRole = await window.governanceContract.methods
      .hasRole(adminRole, account)
      .call();

    if (!hasAdminRole) {
      // Check if this is the first user (no admins set)
      const defaultAdmin = await window.governanceContract.methods
        .getRoleAdmin(adminRole)
        .call();

      if (defaultAdmin === '0x0000000000000000000000000000000000000000') {
        console.log('Setting up initial admin...');
        await daoPageFunctions.grantAdminRole(account);
      }
    }

    // Check and handle membership
    await daoPageFunctions.checkAndHandleMembership(account);
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

    // Store event subscriptions for cleanup
    const eventSubscriptions = {
      proposalCreated: window.governanceContract.events
        .ProposalCreated({
          fromBlock: 'latest',
        })
        .on('data', async (event) => {
          try {
            console.log('📝 New proposal created:', event.returnValues);
            await daoPageFunctions.loadProposals();
            await daoPageFunctions.loadDAOStats(account);
          } catch (error) {
            console.error('Error handling ProposalCreated event:', error);
          }
        })
        .on('error', (error) => {
          console.error('ProposalCreated event error:', error);
        })
        .on('connected', (subscriptionId) => {
          console.log('ProposalCreated event connected:', subscriptionId);
        }),

      voted: window.governanceContract.events
        .Voted({
          fromBlock: 'latest',
        })
        .on('data', async (event) => {
          try {
            console.log('🗳️ New vote cast:', event.returnValues);
            await daoPageFunctions.loadProposals();
            await daoPageFunctions.loadDAOStats(account);
          } catch (error) {
            console.error('Error handling Voted event:', error);
          }
        })
        .on('error', (error) => {
          console.error('Voted event error:', error);
        })
        .on('connected', (subscriptionId) => {
          console.log('Voted event connected:', subscriptionId);
        }),
    };

    // Cleanup function for event listeners
    const cleanup = () => {
      try {
        console.log('Cleaning up event listeners...');
        Object.values(eventSubscriptions).forEach((subscription) => {
          subscription.unsubscribe((error, success) => {
            if (error) {
              console.error('Error unsubscribing:', error);
            } else {
              console.log('Successfully unsubscribed');
            }
          });
        });
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    };

    // Add cleanup on page unload
    window.addEventListener('unload', cleanup);

    // Return cleanup function for component unmounting
    return cleanup;
  } catch (error) {
    console.error('Error in initDAOPage:', error);
    throw error;
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
