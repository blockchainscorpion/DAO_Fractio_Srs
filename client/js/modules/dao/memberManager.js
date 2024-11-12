/**
 * Manages DAO membership operations
 */
export class MemberManager {
  constructor(daoManager, transactionManager) {
    this.daoManager = daoManager;
    this.transactionManager = transactionManager;
  }

  /**
   * Check and handle membership status for an address
   * @param {string} address Address to check
   * @returns {Promise<boolean>} True if address is a valid member
   */
  async checkAndHandleMembership(address) {
    try {
      // Check current membership status
      const member = await this.daoManager.governanceContract.methods
        .members(address)
        .call();

      if (!member.isApproved) {
        // Check if address has admin role
        const adminRole = await this.daoManager.governanceContract.methods
          .ADMIN_ROLE()
          .call();

        const isAdmin = await this.daoManager.governanceContract.methods
          .hasRole(adminRole, address)
          .call();

        if (isAdmin) {
          // Self-add as member if admin
          await this.addMember(
            address,
            this.daoManager.web3.utils.toWei('1', 'ether'),
            address
          );
          return true;
        } else {
          throw new Error(
            'Membership approval required. Please contact an administrator.'
          );
        }
      }
      return true;
    } catch (error) {
      console.error('Membership check failed:', error);
      throw error;
    }
  }

  /**
   * Add a new member to the DAO
   * @param {string} memberAddress Address to add
   * @param {string} votingPower Initial voting power in wei
   * @param {string} from Transaction sender
   */
  async addMember(memberAddress, votingPower, from) {
    try {
      // Verify admin permissions
      const adminRole = await this.daoManager.governanceContract.methods
        .ADMIN_ROLE()
        .call();

      const isAdmin = await this.daoManager.governanceContract.methods
        .hasRole(adminRole, from)
        .call();

      if (!isAdmin) {
        throw new Error('Only admins can add members');
      }

      // Validate address
      if (!this.daoManager.web3.utils.isAddress(memberAddress)) {
        throw new Error('Invalid member address');
      }

      // Submit transaction
      await this.transactionManager.submitTransaction(
        this.daoManager.governanceContract,
        'addMember',
        [memberAddress, votingPower],
        { from }
      );
    } catch (error) {
      console.error('Error adding member:', error);
      throw error;
    }
  }

  /**
   * Update member's KYC status
   * @param {string} memberAddress Member's address
   * @param {boolean} status New KYC status
   * @param {string} from Transaction sender
   */
  async updateKYCStatus(memberAddress, status, from) {
    try {
      // Verify admin permissions
      const adminRole = await this.daoManager.governanceContract.methods
        .ADMIN_ROLE()
        .call();

      const isAdmin = await this.daoManager.governanceContract.methods
        .hasRole(adminRole, from)
        .call();

      if (!isAdmin) {
        throw new Error('Only admins can update KYC status');
      }

      // Verify member exists
      const member = await this.daoManager.governanceContract.methods
        .members(memberAddress)
        .call();

      if (!member.isApproved) {
        throw new Error('Address is not a member');
      }

      // Submit transaction
      await this.transactionManager.submitTransaction(
        this.daoManager.governanceContract,
        'updateKYCStatus',
        [memberAddress, status],
        { from }
      );
    } catch (error) {
      console.error('Error updating KYC status:', error);
      throw error;
    }
  }
}
