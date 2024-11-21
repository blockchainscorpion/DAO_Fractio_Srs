import { EventEmitter } from '../core/EventEmitter.js';
/**
 * Core DAO management functionality
 */
export class DAOManager {
  constructor(web3Instance, contractManager,eventManager, transactionManager) {
    this.web3 = web3Instance;
    this.contractManager = contractManager;
    this.transactionManager = transactionManager;
    this.eventManager = eventManager;
    this.governanceContract = null;
    this.tokenContract = null;
    this.currentAccount = null;
  }

  /**
   * Initialize DAO contracts and verify connections
   */
  async initialize() {
    try {
      // Initialize contracts directly instead of using ContractManager
      this.governanceContract = new this.web3.eth.Contract(
        CONFIG.GOVERNANCE_ABI,
        CONFIG.GOVERNANCE_ADDRESS
      );

      this.tokenContract = new this.web3.eth.Contract(
        CONFIG.GOVERNANCE_TOKEN_ABI,
        CONFIG.TOKEN_ADDRESS
      );

      // Verify contracts
      await this.governanceContract.methods.votingPeriod().call();
      await this.tokenContract.methods.name().call();

      // Get current account
      const accounts = await this.web3.eth.getAccounts();
      this.currentAccount = accounts[0];

      return true;
    } catch (error) {
      console.error('Failed to initialize DAO Manager:', error);
      throw error;
    }
  }

  /**
   * Create a new proposal
   * @param {string} description Proposal description
   * @param {string} from Address creating the proposal
   * @returns {Promise<Object>} Transaction receipt
   */
  async createProposal(description, from) {
    try {
      // Check if sender is approved member
      const member = await this.governanceContract.methods.members(from).call();
      if (!member.isApproved) {
        throw new Error('Only approved members can create proposals');
      }

      // Check if member has passed KYC
      if (!member.hasPassedKYC) {
        throw new Error('KYC approval required to create proposals');
      }

      // Check if member has voting power
      const votingPower = await this.governanceContract.methods
        .votingPower(from)
        .call();
      if (votingPower <= 0) {
        throw new Error('No voting power available');
      }

      // Create proposal transaction
      return await this.executeMethod(
        'createProposal',
        [description],
        { from },
        null // No specific role required since we check membership
      );
    } catch (error) {
      console.error('Error creating proposal:', error);
      throw error;
    }
  }

  /**
   * Get current connected account
   * @returns {string} Current account address
   */
  getCurrentAccount() {
    return this.currentAccount;
  }

  /**
   * Check if an address has a specific role
   * @param {string} role Role identifier
   * @param {string} address Address to check
   * @returns {Promise<boolean>} Whether address has role
   */
  async hasRole(role, address) {
    try {
      return await this.governanceContract.methods
        .hasRole(role, address)
        .call();
    } catch (error) {
      console.error('Error checking role:', error);
      throw error;
    }
  }

  /**
   * Get the admin role identifier
   * @returns {Promise<string>} Admin role identifier
   */
  async getAdminRole() {
    try {
      return await this.governanceContract.methods.ADMIN_ROLE().call();
    } catch (error) {
      console.error('Error getting admin role:', error);
      throw error;
    }
  }

  /**
   * Execute a contract method with permission check
   * @param {string} method Method name
   * @param {Array} args Method arguments
   * @param {Object} options Transaction options
   * @param {string} requiredRole Required role for execution (optional)
   */
  async executeMethod(method, args = [], options = {}, requiredRole = null) {
    try {
      // Check permissions if role specified
      if (requiredRole) {
        const hasRole = await this.hasRole(requiredRole, this.currentAccount);
        if (!hasRole) {
          throw new Error(
            `Account does not have required role: ${requiredRole}`
          );
        }
      }

      // Execute transaction
      return await this.transactionManager.submitTransaction(
        this.governanceContract,
        method,
        args,
        {
          from: this.currentAccount,
          ...options,
        }
      );
    } catch (error) {
      console.error(`Error executing method ${method}:`, error);
      throw error;
    }
  }

  /**
   * Get contract instance
   * @param {string} name Contract name ('Governance' or 'GovernanceToken')
   * @returns {Object} Contract instance
   */
  getContract(name) {
    if (name === 'Governance') return this.governanceContract;
    if (name === 'GovernanceToken') return this.tokenContract;
    throw new Error(`Unknown contract: ${name}`);
  }

  /**
   * Subscribe to contract events
   * @param {string} contractName Contract name
   * @param {string} eventName Event name
   * @param {Object} options Event options
   * @param {Function} callback Event callback
   */
  subscribeToEvent(contractName, eventName, options, callback) {
    this.eventManager.subscribe(contractName, eventName, options, callback);
  }
}
