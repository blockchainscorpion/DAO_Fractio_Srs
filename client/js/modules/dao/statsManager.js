/**
 * Manages DAO statistics
 */
export class StatsManager {
  constructor(daoManager) {
    if (!daoManager) {
      throw new Error('DAOManager instance required');
    }
    this.daoManager = daoManager;
  }

  /**
   * Initialize stats manager
   * @returns {Promise<boolean>} Initialization success
   */
  async initialize() {
    try {
      // Verify contract availability
      if (!this.daoManager.governanceContract) {
        throw new Error('Governance contract not initialized');
      }

      // Test contract connection
      await this.daoManager.governanceContract.methods.votingPeriod().call();

      return true;
    } catch (error) {
      console.error('StatsManager initialization failed:', error);
      throw error;
    }
  }

  /**
   * Load DAO statistics with validation
   * @returns {Promise<Object>} DAO statistics
   */
  async loadDAOStats() {
    try {
      // Ensure initialized
      if (!this.daoManager.governanceContract) {
        throw new Error('Must initialize StatsManager first');
      }

      const stats = {
        totalMembers: await this.getTotalMembers().catch(() => 0),
        activeProposals: await this.getActiveProposals().catch(() => 0),
        votingPower: await this.getVotingPower().catch(() => '0'),
        quorumPercentage: await this.getQuorumPercentage().catch(() => 0),
      };

      this.updateUI(stats);
      return stats;
    } catch (error) {
      console.error('Error loading DAO stats:', error);
      const defaultStats = {
        totalMembers: 0,
        activeProposals: 0,
        votingPower: '0',
        quorumPercentage: 0,
      };
      this.updateUI(defaultStats);
      return defaultStats;
    }
  }

  /**
   * Update UI with stats
   * @private
   */
  updateUI(stats) {
    Object.entries(stats).forEach(([key, value]) => {
      const element = document.getElementById(key);
      if (element) {
        element.textContent = value.toString();
      }
    });
  }

  /**
   * Update UI elements with stats
   * @param {Object} stats DAO statistics
   */
  updateUIStats(stats) {
    const elements = {
      totalMembers: document.getElementById('totalMembers'),
      activeProposals: document.getElementById('activeProposals'),
      votingPower: document.getElementById('votingPower'),
      quorumPercentage: document.getElementById('quorumPercentage'),
    };

    // Update each element if it exists
    Object.entries(elements).forEach(([key, element]) => {
      if (element) {
        element.textContent = stats[key].toString();
      }
    });
  }

  /**
   * Get total member count
   * @returns {Promise<number>} Total members
   */
  async getTotalMembers() {
    try {
      // Count members by iterating through memberList until we hit an error
      let count = 0;
      while (true) {
        try {
          await this.daoManager.governanceContract.methods
            .memberList(count)
            .call();
          count++;
        } catch {
          break;
        }
      }
      return count;
    } catch (error) {
      console.error('Error getting member count:', error);
      throw error;
    }
  }

  /**
   * Get active proposal count
   * @returns {Promise<number>} Active proposals
   */
  async getActiveProposals() {
    try {
      const proposalCount = await this.daoManager.governanceContract.methods
        .proposalCount()
        .call();

      let activeCount = 0;
      for (let i = 0; i < proposalCount; i++) {
        const proposal = await this.daoManager.governanceContract.methods
          .proposals(i)
          .call();
        if (!proposal.executed) {
          activeCount++;
        }
      }
      return activeCount;
    } catch (error) {
      console.error('Error getting active proposals:', error);
      throw error;
    }
  }

  /**
   * Get current user's voting power
   * @returns {Promise<string>} Voting power in ETH
   */
  async getVotingPower() {
    try {
      const accounts = await this.daoManager.web3.eth.getAccounts();
      const votingPower = await this.daoManager.governanceContract.methods
        .votingPower(accounts[0])
        .call();
      return this.daoManager.web3.utils.fromWei(votingPower, 'ether');
    } catch (error) {
      console.error('Error getting voting power:', error);
      throw error;
    }
  }

  /**
   * Get current quorum percentage
   * @returns {Promise<number>} Quorum percentage
   */
  async getQuorumPercentage() {
    try {
      return await this.daoManager.governanceContract.methods
        .quorumPercentage()
        .call();
    } catch (error) {
      console.error('Error getting quorum percentage:', error);
      throw error;
    }
  }
}
