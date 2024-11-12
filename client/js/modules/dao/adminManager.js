/**
 * Manages administrative functions of the DAO
 */
export class AdminManager {
  constructor(daoManager, transactionManager) {
    this.daoManager = daoManager;
    this.transactionManager = transactionManager;
  }

  /**
   * Grant admin role to an address
   * @param {string} address Address to grant role to
   * @param {string} from Transaction sender
   */
  async grantAdminRole(address, from) {
    try {
      // Get admin role hash
      const adminRole = await this.daoManager.governanceContract.methods
        .ADMIN_ROLE()
        .call();

      // Verify sender has admin role
      const hasAdminRole = await this.daoManager.governanceContract.methods
        .hasRole(adminRole, from)
        .call();

      if (!hasAdminRole) {
        throw new Error('Only existing admins can grant admin roles');
      }

      // Submit transaction
      await this.transactionManager.submitTransaction(
        this.daoManager.governanceContract,
        'grantRole',
        [adminRole, address],
        { from }
      );
    } catch (error) {
      console.error('Error granting admin role:', error);
      throw error;
    }
  }

  /**
   * Update DAO quorum percentage
   * @param {number} percentage New quorum percentage
   * @param {string} from Transaction sender
   */
  async setQuorumPercentage(percentage, from) {
    try {
      // Validate percentage
      if (percentage <= 0 || percentage > 100) {
        throw new Error('Quorum percentage must be between 1 and 100');
      }

      // Verify admin permissions
      const adminRole = await this.daoManager.governanceContract.methods
        .ADMIN_ROLE()
        .call();

      const isAdmin = await this.daoManager.governanceContract.methods
        .hasRole(adminRole, from)
        .call();

      if (!isAdmin) {
        throw new Error('Only admins can update quorum percentage');
      }

      // Submit transaction
      await this.transactionManager.submitTransaction(
        this.daoManager.governanceContract,
        'setQuorumPercentage',
        [percentage],
        { from }
      );
    } catch (error) {
      console.error('Error setting quorum percentage:', error);
      throw error;
    }
  }

  /**
   * Update DAO voting period
   * @param {number} period New voting period in seconds
   * @param {string} from Transaction sender
   */
  async setVotingPeriod(period, from) {
    try {
      // Validate period
      if (period <= 0) {
        throw new Error('Voting period must be greater than 0');
      }

      // Verify admin permissions
      const adminRole = await this.daoManager.governanceContract.methods
        .ADMIN_ROLE()
        .call();

      const isAdmin = await this.daoManager.governanceContract.methods
        .hasRole(adminRole, from)
        .call();

      if (!isAdmin) {
        throw new Error('Only admins can update voting period');
      }

      // Submit transaction
      await this.transactionManager.submitTransaction(
        this.daoManager.governanceContract,
        'setVotingPeriod',
        [period],
        { from }
      );
    } catch (error) {
      console.error('Error setting voting period:', error);
      throw error;
    }
  }
}
