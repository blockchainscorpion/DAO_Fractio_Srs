/**
 * Manages DAO statistics
 */
export class StatsManager {
  constructor(daoManager) {
    this.daoManager = daoManager;
  }

  /**
   * Load DAO statistics
   * @returns {Promise<Object>} DAO statistics
   */
  async loadDAOStats() {
    try {
      const [totalMembers, activeProposals, votingPower, quorumPercentage] =
        await Promise.all([
          this.getTotalMembers(),
          this.getActiveProposals(),
          this.getVotingPower(),
          this.getQuorumPercentage(),
        ]);

      return {
        totalMembers,
        activeProposals,
        votingPower,
        quorumPercentage,
      };
    } catch (error) {
      console.error('Error loading DAO stats:', error);
      throw error;
    }
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
