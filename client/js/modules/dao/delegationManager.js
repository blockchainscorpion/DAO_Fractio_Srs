/**
 * Manages voting power delegation
 */
export class DelegationManager {
  constructor(daoManager) {
    this.daoManager = daoManager;
  }

  /**
   * Delegate voting power to another address
   * @param {string} delegatee Address to delegate to
   */
  async delegateVotingPower(delegatee) {
    try {
      const accounts = await this.daoManager.web3.eth.getAccounts();
      const currentAccount = accounts[0];

      // Validate delegatee address
      if (!this.daoManager.web3.utils.isAddress(delegatee)) {
        throw new Error('Invalid delegate address');
      }

      // Check if delegatee is approved member
      const member = await this.daoManager.governanceContract.methods
        .members(delegatee)
        .call();

      if (!member.isApproved) {
        throw new Error('Can only delegate to approved members');
      }

      // Submit delegation transaction
      await this.daoManager.transactionManager.submitTransaction(
        this.daoManager.governanceContract,
        'delegate',
        [delegatee],
        { from: currentAccount }
      );
    } catch (error) {
      console.error('Error delegating voting power:', error);
      throw error;
    }
  }

  /**
   * Get current delegation for an address
   * @param {string} address Address to check
   * @returns {Promise<string>} Delegatee address
   */
  async getCurrentDelegation(address) {
    try {
      return await this.daoManager.governanceContract.methods
        .delegates(address)
        .call();
    } catch (error) {
      console.error('Error getting delegation:', error);
      throw error;
    }
  }
}
