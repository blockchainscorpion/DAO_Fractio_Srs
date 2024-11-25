// client/js/modules/core/contractManager.js

import { ErrorService, ErrorCodes } from './errorService.js';
import { EventEmitter } from './EventEmitter.js';

let isContractInitializing = false;
let isContractInitialized = false;

/**
 * Manages contract instances and interactions
 */
export class ContractManager {
  /**
   * Initialize contract manager
   * @param {Web3} web3Instance Web3 instance
   */
  constructor(web3Instance) {
    if (!isContractInitialized) {
      console.log('ContractManager: Initializing...');
    }

    this.web3 = web3Instance;
    this.contracts = new Map();
    this.currentAccount = null;
    this.errorService = new ErrorService({ debug: true });
  }

  /**
   * Initialize contract manager with necessary contracts
   * @param {string} account Connected account address
   * @returns {Promise<boolean>} Initialization success
   */
  async initialize(account) {
    // If already initialized, return true
    if (isContractInitialized) {
      return true;
    }

    // If currently initializing, wait
    if (isContractInitializing) {
      return false;
    }

    isContractInitializing = true;

    try {
      // 1. Check permissions and requirements
      if (!this.web3) {
        throw this.errorService.createError(
          'Web3 instance not provided',
          ErrorCodes.WEB3_NOT_INITIALIZED
        );
      }

      if (!account) {
        throw this.errorService.createError(
          'No account provided',
          ErrorCodes.INVALID_PARAMETERS,
          { requiredParam: 'account' }
        );
      }

      // 2. Initialize contracts
      await this.initializeContracts();

      // 3. Verify contracts
      await this.verifyContracts();

      isContractInitialized = true;
      return true;
    } catch (error) {
      throw this.errorService.handleError(error, {
        operation: 'initialize',
        account,
        originalMessage: error.message,
      });
    } finally {
      isContractInitializing = false;
    }
  }

  /**
   * Initialize primary contracts
   */
  async initializeContracts() {
    try {
      if (!isContractInitialized) {
        console.log('ContractManager: Initializing contracts...');
      }

      // Initialize Governance contract
      this.contracts.set(
        'Governance',
        new this.web3.eth.Contract(
          window.CONFIG.GOVERNANCE_ABI,
          window.CONFIG.GOVERNANCE_ADDRESS
        )
      );

      // Initialize GovernanceToken contract
      this.contracts.set(
        'GovernanceToken',
        new this.web3.eth.Contract(
          window.CONFIG.GOVERNANCE_TOKEN_ABI,
          window.CONFIG.TOKEN_ADDRESS
        )
      );

      if (!isContractInitialized) {
        console.log('ContractManager: Contracts initialized');
      }
    } catch (error) {
      throw this.errorService.handleError(error, {
        operation: 'initializeContracts',
        originalMessage: error.message,
        context: {
          governanceAddress: window.CONFIG.GOVERNANCE_ADDRESS,
          tokenAddress: window.CONFIG.TOKEN_ADDRESS,
        },
      });
    }
  }

  /**
   * Verify contract connections by calling view methods
   */
  async verifyContracts() {
    try {
      if (!isContractInitialized) {
        console.log('ContractManager: Verifying contracts...');
      }

      // Verify Governance contract
      const governance = this.getContract('Governance');
      await governance.methods.votingPeriod().call();

      // Verify GovernanceToken contract
      const token = this.getContract('GovernanceToken');
      await token.methods.name().call();
    } catch (error) {
      throw this.errorService.handleError(error, {
        operation: 'verifyContracts',
        originalMessage: error.message,
        context: {
          contracts: Array.from(this.contracts.keys()),
        },
      });
    }
  }

  /**
   * Get a contract instance by name
   * @param {string} name Contract name
   * @returns {Object} Contract instance
   */
  getContract(name) {
    const contract = this.contracts.get(name);
    if (!contract) {
      throw this.errorService.createError(
        `Contract ${name} not initialized`,
        ErrorCodes.CONTRACT_NOT_INITIALIZED,
        { contractName: name }
      );
    }
    return contract;
  }

  /**
   * Call a contract method (view/pure function)
   * @param {string} contractName Contract name
   * @param {string} method Method name
   * @param {Array} args Method arguments
   * @returns {Promise<any>} Method result
   */
  async call(contractName, method, args = []) {
    try {
      // 1. Check permissions
      if (!this.currentAccount) {
        throw this.errorService.createError(
          'No account connected',
          ErrorCodes.USER_NOT_AUTHORIZED
        );
      }

      // 2. Verify contract state
      const contract = this.getContract(contractName);

      // 3. Execute call
      console.log(
        `ContractManager: Calling ${contractName}.${method} with args:`,
        args
      );

      const result = await contract.methods[method](...args).call();
      console.log(`ContractManager: ${contractName}.${method} result:`, result);

      return result;
    } catch (error) {
      throw this.errorService.handleError(error, {
        operation: 'call',
        contract: contractName,
        method,
        args,
        originalMessage: error.message,
      });
    }
  }

  /**
   * Send a transaction to a contract method
   * @param {string} contractName Contract name
   * @param {string} method Method name
   * @param {Array} args Method arguments
   * @param {Object} options Transaction options
   * @returns {Promise<Object>} Transaction receipt
   */
  async send(contractName, method, args = [], options = {}) {
    try {
      // 1. Check permissions
      if (!this.currentAccount) {
        throw this.errorService.createError(
          'No account connected',
          ErrorCodes.USER_NOT_AUTHORIZED,
          { requiredAccount: true }
        );
      }

      // 2. Verify contract state
      const contract = this.getContract(contractName);

      // 3. Execute transaction
      console.log(
        `ContractManager: Sending ${contractName}.${method} with args:`,
        args
      );

      // Estimate gas
      const gasEstimate = await contract.methods[method](...args).estimateGas({
        from: this.currentAccount,
        ...options,
      });

      // Add 20% buffer to gas estimate
      const gasLimit = Math.floor(gasEstimate * 1.2);

      // Send transaction
      const receipt = await contract.methods[method](...args).send({
        from: this.currentAccount,
        gas: gasLimit,
        ...options,
      });

      console.log(
        `ContractManager: ${contractName}.${method} transaction receipt:`,
        receipt
      );

      return receipt;
    } catch (error) {
      // 4. Handle errors with specific messages
      let errorToThrow;

      if (error.code === 4001) {
        errorToThrow = this.errorService.createError(
          'Transaction rejected by user',
          ErrorCodes.USER_NOT_AUTHORIZED,
          { userRejected: true }
        );
      } else if (error.message.includes('execution reverted')) {
        errorToThrow = this.errorService.createError(
          'Transaction reverted: ' + error.message,
          ErrorCodes.TRANSACTION_FAILED,
          { revertReason: error.message }
        );
      } else {
        errorToThrow = this.errorService.handleError(error, {
          operation: 'send',
          contract: contractName,
          method,
          args,
          originalMessage: error.message,
        });
      }

      console.error('ContractManager: Transaction failed:', errorToThrow);
      throw errorToThrow;
    }
  }

  /**
   * Set current account
   * @param {string} account Account address
   */
  setCurrentAccount(account) {
    if (!this.web3.utils.isAddress(account)) {
      throw this.errorService.createError(
        'Invalid account address',
        ErrorCodes.INVALID_ADDRESS,
        { address: account }
      );
    }
    this.currentAccount = account;
  }

  /**
   * Get current account
   * @returns {string|null} Current account address
   */
  getCurrentAccount() {
    return this.currentAccount;
  }
}
