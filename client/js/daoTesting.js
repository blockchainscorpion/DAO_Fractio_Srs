// daoTesting.js

class DAOTester {
  constructor() {
    this.governance = null;
    this.token = null;
    this.userAddress = null;
    this.testResults = [];
  }

  // Helper method to handle contract transactions
  async handleTransaction(transactionPromise, actionName) {
    try {
      console.log(`📝 Preparing ${actionName}...`);
      const tx = await transactionPromise;
      console.log(`✅ ${actionName} successful:`, tx);
      return tx;
    } catch (error) {
      console.error(`❌ ${actionName} failed:`, error);
      if (error.code === 4001) {
        throw new Error(`${actionName} was rejected in MetaMask`);
      }
      throw error;
    }
  }

  // Initialize Web3 and contracts
  async initialize() {
    try {
      console.log('🔄 Initializing Web3 and contracts...');

      // Check MetaMask
      if (typeof window.ethereum === 'undefined') {
        throw new Error(
          'MetaMask not detected. Please install MetaMask to use this dApp.'
        );
      }

      // Get network info
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      console.log('Current chain ID:', chainId);

      // Check if we're on the right network (Ganache = 1337)
      if (chainId !== '0x539') {
        // 0x539 is 1337 in hex
        console.log('Switching to Ganache network...');
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x539' }],
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: '0x539',
                    chainName: 'Ganache',
                    nativeToken: {
                      name: 'ETH',
                      symbol: 'ETH',
                      decimals: 18,
                    },
                    rpcUrls: ['http://127.0.0.1:7545'],
                  },
                ],
              });
            } catch (addError) {
              throw new Error('Failed to add Ganache network to MetaMask');
            }
          } else {
            throw switchError;
          }
        }
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      this.userAddress = accounts[0];
      console.log('✅ Connected account:', this.userAddress);

      // Initialize Web3
      window.web3 = new Web3(window.ethereum);

      // Initialize contracts
      this.governance = new web3.eth.Contract(
        CONFIG.GOVERNANCE_ABI,
        CONFIG.GOVERNANCE_ADDRESS
      );
      this.token = new web3.eth.Contract(
        CONFIG.GOVERNANCE_TOKEN_ABI,
        CONFIG.TOKEN_ADDRESS
      );
      console.log('✅ Contracts initialized');

      // Verify contract connections
      try {
        await this.governance.methods.votingPeriod().call();
        await this.token.methods.name().call();
        console.log('✅ Contract connections verified');
      } catch (error) {
        throw new Error(
          'Failed to verify contract connections: ' + error.message
        );
      }

      return true;
    } catch (error) {
      console.error('❌ Initialization failed:', error);
      this.logResult('Initialization', false, error.message);
      return false;
    }
  }

  // Test member status
  async testMemberStatus() {
    try {
      console.log('🔄 Testing member status...');
      const member = await this.governance.methods
        .members(this.userAddress)
        .call();

      const memberStatus = {
        isApproved: member.isApproved,
        hasPassedKYC: member.hasPassedKYC,
        votingPower: member.votingPower,
      };

      console.log('Member status:', memberStatus);
      this.logResult(
        'Member Status Check',
        true,
        `Is approved: ${memberStatus.isApproved}, 
                 Has KYC: ${memberStatus.hasPassedKYC}, 
                 Voting Power: ${memberStatus.votingPower}`
      );

      return memberStatus;
    } catch (error) {
      console.error('❌ Member status check failed:', error);
      this.logResult('Member Status Check', false, error.message);
      throw error;
    }
  }

  // Test proposal creation
  async testProposalCreation() {
    try {
      console.log('🔄 Testing proposal creation...');
      const testProposal = 'Test Proposal: Update voting parameters';

      const tx = await this.handleTransaction(
        this.governance.methods.createProposal(testProposal).send({
          from: this.userAddress,
          gas: 500000, // Specify gas limit
        }),
        'Proposal Creation'
      );

      const proposalCount = await this.governance.methods
        .proposalCount()
        .call();
      const proposal = await this.governance.methods
        .proposals(proposalCount - 1)
        .call();

      console.log('Created proposal:', proposal);
      this.logResult(
        'Proposal Creation',
        true,
        `Created proposal ID: ${proposal.id}`
      );
      return proposal.id;
    } catch (error) {
      console.error('❌ Proposal creation failed:', error);
      this.logResult('Proposal Creation', false, error.message);
      throw error;
    }
  }

  // Test voting
  async testVoting(proposalId) {
    try {
      console.log('🔄 Testing voting on proposal:', proposalId);

      // Check if already voted
      const hasVoted = await this.governance.methods
        .hasVoted(this.userAddress, proposalId)
        .call();

      if (hasVoted) {
        console.log('Already voted on this proposal');
        this.logResult('Voting', true, 'Already voted on this proposal');
        return true;
      }

      const tx = await this.handleTransaction(
        this.governance.methods.vote(proposalId, true).send({
          from: this.userAddress,
          gas: 200000,
        }),
        'Vote Submission'
      );

      const updatedProposal = await this.governance.methods
        .proposals(proposalId)
        .call();
      console.log('Updated proposal status:', updatedProposal);

      this.logResult(
        'Voting',
        true,
        `Vote recorded for proposal ${proposalId}`
      );
      return true;
    } catch (error) {
      console.error('❌ Voting failed:', error);
      this.logResult('Voting', false, error.message);
      throw error;
    }
  }

  // Test voting power calculation
  async testVotingPower() {
    try {
      console.log('🔄 Testing voting power calculation...');
      const votingPower = await this.governance.methods
        .votingPower(this.userAddress)
        .call();

      console.log('Voting power:', web3.utils.fromWei(votingPower, 'ether'));
      this.logResult(
        'Voting Power',
        true,
        `Power: ${web3.utils.fromWei(votingPower, 'ether')} ETH`
      );
      return votingPower;
    } catch (error) {
      console.error('❌ Voting power check failed:', error);
      this.logResult('Voting Power', false, error.message);
      throw error;
    }
  }

  // Test token balance
  async testTokenBalance() {
    try {
      console.log('🔄 Testing token balance...');
      const balance = await this.token.methods
        .balanceOf(this.userAddress)
        .call();

      console.log('Token balance:', web3.utils.fromWei(balance, 'ether'));
      this.logResult(
        'Token Balance',
        true,
        `Balance: ${web3.utils.fromWei(balance, 'ether')} tokens`
      );
      return balance;
    } catch (error) {
      console.error('❌ Token balance check failed:', error);
      this.logResult('Token Balance', false, error.message);
      throw error;
    }
  }

  // Test event listeners
  async testEventListeners() {
    try {
      console.log('🔄 Testing event listeners...');

      // Set up event listeners with error handling
      this.governance.events
        .ProposalCreated({
          fromBlock: 'latest',
        })
        .on('data', (event) => {
          console.log('📢 Proposal Created Event:', event.returnValues);
          this.logResult(
            'ProposalCreated Event',
            true,
            `New proposal: ${event.returnValues.description}`
          );
        })
        .on('error', (error) => {
          console.error('Event error:', error);
          this.logResult('ProposalCreated Event', false, error.message);
        });

      this.governance.events
        .Voted({
          fromBlock: 'latest',
        })
        .on('data', (event) => {
          console.log('📢 Vote Cast Event:', event.returnValues);
          this.logResult(
            'Voted Event',
            true,
            `Vote cast on proposal ${event.returnValues.proposalId}`
          );
        })
        .on('error', (error) => {
          console.error('Event error:', error);
          this.logResult('Voted Event', false, error.message);
        });

      console.log('✅ Event listeners set up');
      this.logResult('Event Listeners Setup', true, 'All listeners configured');
      return true;
    } catch (error) {
      console.error('❌ Event listener setup failed:', error);
      this.logResult('Event Listeners Setup', false, error.message);
      throw error;
    }
  }

  // Test UI updates
  async testUIUpdates() {
    try {
      console.log('🔄 Testing UI updates...');

      // Verify all required UI elements exist
      const elements = [
        'totalMembers',
        'activeProposals',
        'votingPower',
        'quorumPercentage',
      ];

      const missingElements = elements.filter(
        (id) => !document.getElementById(id)
      );

      if (missingElements.length > 0) {
        throw new Error(`Missing UI elements: ${missingElements.join(', ')}`);
      }

      console.log('✅ UI elements verified');
      this.logResult(
        'UI Elements Check',
        true,
        'All required elements present'
      );
      return true;
    } catch (error) {
      console.error('❌ UI update test failed:', error);
      this.logResult('UI Elements Check', false, error.message);
      throw error;
    }
  }

  // Log test results
  logResult(testName, passed, message) {
    this.testResults.push({
      test: testName,
      passed: passed,
      message: message,
      timestamp: new Date().toISOString(),
    });

    // Log to console for debugging
    if (passed) {
      console.log(`✅ ${testName}: ${message}`);
    } else {
      console.error(`❌ ${testName}: ${message}`);
    }
  }

  // Get test report
  getTestReport() {
    return {
      totalTests: this.testResults.length,
      passedTests: this.testResults.filter((r) => r.passed).length,
      failedTests: this.testResults.filter((r) => !r.passed).length,
      results: this.testResults,
    };
  }
}

// Make the class available globally
window.DAOTester = DAOTester;
