import { EventEmitter } from './EventEmitter.js';
let isContractInitializing = false;
let isContractInitialized = false;

/**
 * Manages contract instances and interactions
 */
export class ContractManager {
  constructor(web3Instance) {
    // Only log once during construction
    if (!isContractInitialized) {
      console.log('ContractManager: Initializing...');
    }
    this.web3 = web3Instance;
    this.contracts = new Map();
    this.currentAccount = null;
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
      if (!isContractInitialized) {
        console.log('ContractManager: Starting initialization...');
      }

      // 1. Check permissions and requirements
      if (!this.web3) {
        throw new Error('Web3 instance not provided');
      }
      if (!account) {
        throw new Error('No account provided');
      }

      // 2. Initialize contracts
      await this.initializeContracts();

      // 3. Verify contracts
      await this.verifyContracts();

      isContractInitialized = true;
      return true;
    } catch (error) {
      console.error('ContractManager: Initialization failed:', error);
      throw error;
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
      if (!isContractInitialized) {
        console.log('ContractManager: Governance contract initialized');
      }

      // Initialize GovernanceToken contract
      this.contracts.set(
        'GovernanceToken',
        new this.web3.eth.Contract(
          window.CONFIG.GOVERNANCE_TOKEN_ABI,
          window.CONFIG.TOKEN_ADDRESS
        )
      );
      if (!isContractInitialized) {
        console.log('ContractManager: GovernanceToken contract initialized');
      }
    } catch (error) {
      console.error('ContractManager: Failed to initialize contracts:', error);
      throw error;
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
      if (!isContractInitialized) {
        console.log('ContractManager: Governance contract verified');
      }

      // Verify GovernanceToken contract
      const token = this.getContract('GovernanceToken');
      await token.methods.name().call();
      if (!isContractInitialized) {
        console.log('ContractManager: GovernanceToken contract verified');
      }
    } catch (error) {
      console.error('ContractManager: Contract verification failed:', error);
      throw error;
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
      throw new Error(`Contract ${name} not initialized`);
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
        throw new Error('No account connected');
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
      // 4. Handle errors with specific messages
      console.error(
        `ContractManager: Call to ${contractName}.${method} failed:`,
        error
      );
      throw new Error(`Contract call failed: ${error.message}`);
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
        throw new Error('No account connected');
      }

      // 2. Verify contract state
      const contract = this.getContract(contractName);

      // 3. Execute transaction
      console.log(
        `ContractManager: Sending ${contractName}.${method} with args:`,
        args
      );

      // Estimate gas for the transaction
      const gas = await contract.methods[method](...args).estimateGas({
        from: this.currentAccount,
        ...options,
      });

      // Add 20% buffer to gas estimate
      const gasLimit = Math.floor(gas * 1.2);

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
      let errorMessage = `Transaction to ${contractName}.${method} failed: `;

      if (error.code === 4001) {
        errorMessage += 'Transaction rejected by user';
      } else if (error.message.includes('execution reverted')) {
        errorMessage += 'Transaction reverted: ' + error.message;
      } else {
        errorMessage += error.message;
      }

      console.error('ContractManager:', errorMessage, error);
      throw new Error(errorMessage);
    }
  }
}
