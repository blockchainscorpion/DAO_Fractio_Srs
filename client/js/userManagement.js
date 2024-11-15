/**
 * Enhanced UserManagement Module
 * Handles all user and admin related functionality for the DAO
 */
class UserManagement {
  constructor(daoManager, contractManager) {
    this.daoManager = daoManager;
    this.contractManager = contractManager;
    this.adminRole = null;
    this.initialized = false;
  }

  /**
   * Initialize UserManagement module
   * @returns {Promise<boolean>} Initialization success
   */
  async initialize() {
    try {
      // 1. Check permissions
      if (!this.contractManager || !this.daoManager) {
        throw new Error('Required managers not provided');
      }

      // 2. Verify contract state
      this.adminRole = await this.daoManager.governanceContract.methods
        .ADMIN_ROLE()
        .call();

      // 3. Execute initialization
      this.initialized = true;

      return true;
    } catch (error) {
      // 4. Handle errors
      console.error('UserManagement initialization failed:', error);
      throw new Error(`Failed to initialize UserManagement: ${error.message}`);
    }
  }

  /**
   * Add a new member to the DAO
   * @param {string} memberAddress Address to add
   * @param {string} votingPower Initial voting power
   * @param {Object} options Transaction options
   */
  async addMember(memberAddress, votingPower, options = {}) {
    try {
      // 1. Check permissions
      const isAdmin = await this.checkAdminPermission(options.from);
      if (!isAdmin) {
        throw new Error('Caller does not have admin permission');
      }

      // 2. Verify contract state
      if (!this.daoManager.web3.utils.isAddress(memberAddress)) {
        throw new Error('Invalid member address');
      }

      const existingMember = await this.daoManager.governanceContract.methods
        .members(memberAddress)
        .call();
      if (existingMember.isApproved) {
        throw new Error('Member already exists');
      }

      // 3. Execute transaction
      const tx = await this.daoManager.governanceContract.methods
        .addMember(memberAddress, votingPower)
        .send({
          from: options.from,
          gas: options.gas || 200000,
        });

      return tx;
    } catch (error) {
      // 4. Handle errors
      console.error('Failed to add member:', error);
      throw new Error(`Member addition failed: ${error.message}`);
    }
  }

  /**
   * Update member's KYC status
   * @param {string} memberAddress Member address
   * @param {boolean} status New KYC status
   * @param {Object} options Transaction options
   */
  async updateKYCStatus(memberAddress, status, options = {}) {
    try {
      // 1. Check permissions
      const isAdmin = await this.checkAdminPermission(options.from);
      if (!isAdmin) {
        throw new Error('Caller does not have admin permission');
      }

      // 2. Verify contract state
      const member = await this.daoManager.governanceContract.methods
        .members(memberAddress)
        .call();
      if (!member.isApproved) {
        throw new Error('Member does not exist');
      }

      // 3. Execute transaction
      const tx = await this.daoManager.governanceContract.methods
        .updateKYCStatus(memberAddress, status)
        .send({
          from: options.from,
          gas: options.gas || 200000,
        });

      return tx;
    } catch (error) {
      // 4. Handle errors
      console.error('Failed to update KYC status:', error);
      throw new Error(`KYC status update failed: ${error.message}`);
    }
  }

  /**
   * Remove a member from the DAO
   * @param {string} memberAddress Member address to remove
   * @param {Object} options Transaction options
   */
  async removeMember(memberAddress, options = {}) {
    try {
      // 1. Check permissions
      const isAdmin = await this.checkAdminPermission(options.from);
      if (!isAdmin) {
        throw new Error('Caller does not have admin permission');
      }

      // 2. Verify contract state
      const member = await this.daoManager.governanceContract.methods
        .members(memberAddress)
        .call();
      if (!member.isApproved) {
        throw new Error('Member does not exist');
      }

      // 3. Execute transaction
      const tx = await this.daoManager.governanceContract.methods
        .removeMember(memberAddress)
        .send({
          from: options.from,
          gas: options.gas || 200000,
        });

      return tx;
    } catch (error) {
      // 4. Handle errors
      console.error('Failed to remove member:', error);
      throw new Error(`Member removal failed: ${error.message}`);
    }
  }

  /**
   * Grant admin role to an address
   * @param {string} address Address to grant admin role
   * @param {Object} options Transaction options
   */
  async grantAdminRole(address, options = {}) {
    try {
      // 1. Check permissions
      const isAdmin = await this.checkAdminPermission(options.from);
      if (!isAdmin) {
        throw new Error('Caller does not have admin permission');
      }

      // 2. Verify contract state
      const hasRole = await this.daoManager.governanceContract.methods
        .hasRole(this.adminRole, address)
        .call();
      if (hasRole) {
        throw new Error('Address already has admin role');
      }

      // 3. Execute transaction
      const tx = await this.daoManager.governanceContract.methods
        .grantRole(this.adminRole, address)
        .send({
          from: options.from,
          gas: options.gas || 200000,
        });

      return tx;
    } catch (error) {
      // 4. Handle errors
      console.error('Failed to grant admin role:', error);
      throw new Error(`Admin role grant failed: ${error.message}`);
    }
  }

  /**
   * Check if an address has admin permission
   * @param {string} address Address to check
   * @returns {Promise<boolean>} Whether address has admin role
   */
  async checkAdminPermission(address) {
    if (!this.initialized) {
      throw new Error('UserManagement not initialized');
    }
    return await this.daoManager.governanceContract.methods
      .hasRole(this.adminRole, address)
      .call();
  }

  /**
   * Get member details
   * @param {string} address Member address
   * @returns {Promise<Object>} Member details
   */
  async getMemberDetails(address) {
    try {
      const member = await this.daoManager.governanceContract.methods
        .members(address)
        .call();
      const votingPower = await this.daoManager.governanceContract.methods
        .votingPower(address)
        .call();

      return {
        ...member,
        votingPower,
        isAdmin: await this.checkAdminPermission(address),
      };
    } catch (error) {
      console.error('Failed to get member details:', error);
      throw new Error(`Failed to get member details: ${error.message}`);
    }
  }
}

export default UserManagement;
