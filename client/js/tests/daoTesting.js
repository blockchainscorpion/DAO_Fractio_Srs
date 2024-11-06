/**
 * DAOTester class handles integration testing for the DAO functionality
 * Works with existing ContractIntegration setup
 */
class DAOTester {
  constructor() {
    this.testResults = [];
    this.userAddress = null;
    this.initialized = false;
    this.contracts = null;
  }

  /**
   * Initialize the tester using existing ContractIntegration
   * @returns {Promise<boolean>} Initialization success
   */
  async initialize() {
    try {
      console.log('🔄 Initializing DAO tester...');

      // Use existing ContractIntegration initialization
      if (!window.ContractIntegration) {
        throw new Error('ContractIntegration not found');
      }

      // Initialize if not already done
      if (!window.ContractIntegration.isInitialized()) {
        const initialized = await window.ContractIntegration.initialize();
        if (!initialized) {
          throw new Error('Contract initialization failed');
        }
      }

      // Get current user
      this.userAddress = window.ContractIntegration.getCurrentUser();
      if (!this.userAddress) {
        throw new Error('No user account available');
      }

      // Get contract instances
      this.contracts = window.ContractIntegration.getContracts();
      if (!this.contracts.governance || !this.contracts.token) {
        throw new Error('Contract instances not available');
      }

      // Verify contract connections
      await this.verifyContracts();

      this.initialized = true;
      this.logResult(
        'Initialization',
        true,
        'Contracts initialized successfully'
      );
      return true;
    } catch (error) {
      console.error('❌ Initialization failed:', error);
      this.logResult('Initialization', false, error.message);
      throw error;
    }
  }

  /**
   * Verify contract connections
   */
  async verifyContracts() {
    try {
      // Verify Governance contract
      await this.contracts.governance.methods.votingPeriod().call();

      // Verify Token contract
      await this.contracts.token.methods.name().call();

      console.log('✅ Contract connections verified');
    } catch (error) {
      throw new Error(`Contract verification failed: ${error.message}`);
    }
  }

  /**
   * Test member status functionality
   */
  async testMemberStatus() {
    try {
      console.log('🔄 Testing member status...');

      const member = await this.contracts.governance.methods
        .members(this.userAddress)
        .call();

      const status = {
        isApproved: member.isApproved,
        hasPassedKYC: member.hasPassedKYC,
        votingPower: member.votingPower,
      };

      this.logResult(
        'Member Status',
        true,
        `Approved: ${status.isApproved}, KYC: ${status.hasPassedKYC}, Power: ${status.votingPower}`
      );
      return status;
    } catch (error) {
      this.logResult('Member Status', false, error.message);
      throw error;
    }
  }

  /**
   * Test proposal creation
   */
  async testProposalCreation() {
    try {
      console.log('🔄 Testing proposal creation...');

      const description = 'Test Proposal: Update voting parameters';
      const tx = await this.contracts.governance.methods
        .createProposal(description)
        .send({
          from: this.userAddress,
          gas: 500000,
        });

      const proposalId = await this.contracts.governance.methods
        .proposalCount()
        .call();

      this.logResult(
        'Proposal Creation',
        true,
        `Created proposal ID: ${proposalId}`
      );
      return proposalId;
    } catch (error) {
      this.logResult('Proposal Creation', false, error.message);
      throw error;
    }
  }

  /**
   * Test voting functionality
   */
  async testVoting(proposalId) {
    try {
      console.log('🔄 Testing voting...');

      const hasVoted = await this.contracts.governance.methods
        .hasVoted(this.userAddress, proposalId)
        .call();

      if (hasVoted) {
        this.logResult('Voting', true, 'Already voted on this proposal');
        return true;
      }

      await this.contracts.governance.methods.vote(proposalId, true).send({
        from: this.userAddress,
        gas: 200000,
      });

      this.logResult('Voting', true, `Vote cast on proposal ${proposalId}`);
      return true;
    } catch (error) {
      this.logResult('Voting', false, error.message);
      throw error;
    }
  }

  /**
   * Test voting power calculation
   */
  async testVotingPower() {
    try {
      console.log('🔄 Testing voting power...');

      const power = await this.contracts.governance.methods
        .votingPower(this.userAddress)
        .call();

      const web3 = window.ContractIntegration.getWeb3();
      this.logResult(
        'Voting Power',
        true,
        `Power: ${web3.utils.fromWei(power, 'ether')} ETH`
      );
      return power;
    } catch (error) {
      this.logResult('Voting Power', false, error.message);
      throw error;
    }
  }

  /**
   * Test token balance
   */
  async testTokenBalance() {
    try {
      console.log('🔄 Testing token balance...');

      const balance = await this.contracts.token.methods
        .balanceOf(this.userAddress)
        .call();

      const web3 = window.ContractIntegration.getWeb3();
      this.logResult(
        'Token Balance',
        true,
        `Balance: ${web3.utils.fromWei(balance, 'ether')} tokens`
      );
      return balance;
    } catch (error) {
      this.logResult('Token Balance', false, error.message);
      throw error;
    }
  }

  /**
   * Test event listeners
   */
  async testEventListeners() {
    try {
      console.log('🔄 Setting up event listeners...');

      this.contracts.governance.events
        .ProposalCreated({
          fromBlock: 'latest',
        })
        .on('data', (event) => {
          console.log('📢 New proposal:', event.returnValues);
          this.logResult(
            'Event Listener',
            true,
            `Proposal created: ${event.returnValues.description}`
          );
        })
        .on('error', console.error);

      this.contracts.governance.events
        .Voted({
          fromBlock: 'latest',
        })
        .on('data', (event) => {
          console.log('📢 Vote cast:', event.returnValues);
          this.logResult(
            'Event Listener',
            true,
            `Vote recorded on proposal ${event.returnValues.proposalId}`
          );
        })
        .on('error', console.error);

      this.logResult('Event Listeners', true, 'Listeners set up successfully');
      return true;
    } catch (error) {
      this.logResult('Event Listeners', false, error.message);
      throw error;
    }
  }

  /**
   * Log test result
   */
  logResult(testName, passed, message) {
    this.testResults.push({
      test: testName,
      passed: passed,
      message: message,
      timestamp: new Date().toISOString(),
    });

    console.log(`${passed ? '✅' : '❌'} ${testName}: ${message}`);
  }

  /**
   * Get test report
   */
  getTestReport() {
    return {
      totalTests: this.testResults.length,
      passedTests: this.testResults.filter((r) => r.passed).length,
      failedTests: this.testResults.filter((r) => !r.passed).length,
      results: this.testResults,
    };
  }
}

// Make tester available globally
window.DAOTester = DAOTester;
