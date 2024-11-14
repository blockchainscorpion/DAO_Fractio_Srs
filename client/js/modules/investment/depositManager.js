import { ContractManager } from '../core/contractManager';
import { TransactionManager } from '../core/transactionManager';
import { EventManager } from '../core/eventManager';
import { EventEmitter } from '../core/EventEmitter';

/**
 * Manages deposit functionality for investments
 */
class DepositManager {
  constructor() {
    this.contractManager = new ContractManager();
    this.transactionManager = new TransactionManager();
    this.eventManager = new EventManager();
    this.minDepositAmount = web3.utils.toWei('0.1', 'ether'); // Minimum deposit 0.1 ETH
  }

  /**
   * Initializes deposit functionality
   * @returns {Promise<boolean>} Initialization success
   */
  async initialize() {
    try {
      // Check Web3 and contract availability
      if (!(await this.contractManager.isReady())) {
        throw new Error('Contract manager not ready');
      }

      // Set up event listeners
      this.setupEventListeners();
      return true;
    } catch (error) {
      console.error('Deposit manager initialization failed:', error);
      return false;
    }
  }

  /**
   * Process a deposit transaction
   * @param {string} amount Amount in ETH
   * @param {string} method Payment method
   * @returns {Promise<Object>} Transaction result
   */
  async processDeposit(amount, method) {
    try {
      // 1. Check permissions
      const account = await this.contractManager.getCurrentAccount();
      if (!account) {
        throw new Error('No account connected');
      }

      // 2. Verify contract state & validate amount
      const amountWei = web3.utils.toWei(amount, 'ether');
      if (amountWei < this.minDepositAmount) {
        throw new Error(
          `Minimum deposit is ${web3.utils.fromWei(
            this.minDepositAmount,
            'ether'
          )} ETH`
        );
      }

      // 3. Execute transaction based on method
      let tx;
      switch (method) {
        case 'ETH':
          tx = await this.processEthDeposit(amountWei);
          break;
        case 'TOKEN':
          tx = await this.processTokenDeposit(amountWei);
          break;
        default:
          throw new Error('Unsupported payment method');
      }

      // Emit deposit event
      this.eventManager.emit('deposit:success', {
        account,
        amount: amountWei,
        method,
        transaction: tx,
      });

      return tx;
    } catch (error) {
      // 4. Handle errors with specific messages
      let errorMessage = 'Deposit failed: ';
      if (error.code === 4001) {
        errorMessage += 'Transaction rejected by user';
      } else if (error.message.includes('insufficient funds')) {
        errorMessage += 'Insufficient funds in wallet';
      } else {
        errorMessage += error.message;
      }

      this.eventManager.emit('deposit:error', {
        error: errorMessage,
      });

      throw new Error(errorMessage);
    }
  }

  /**
   * Process ETH deposit
   * @param {string} amountWei Amount in Wei
   * @returns {Promise<Object>} Transaction result
   */
  async processEthDeposit(amountWei) {
    return this.transactionManager.sendTransaction({
      method: 'deposit',
      params: {
        value: amountWei,
      },
    });
  }

  /**
   * Process token deposit
   * @param {string} amount Token amount
   * @returns {Promise<Object>} Transaction result
   */
  async processTokenDeposit(amount) {
    const tokenContract = await this.contractManager.getTokenContract();

    // First approve token transfer
    await this.transactionManager.sendTransaction({
      contract: tokenContract,
      method: 'approve',
      params: [this.contractManager.getGovernanceAddress(), amount],
    });

    // Then process deposit
    return this.transactionManager.sendTransaction({
      method: 'depositTokens',
      params: [amount],
    });
  }

  /**
   * Set up deposit-related event listeners
   */
  setupEventListeners() {
    this.eventManager.on(
      'deposit:success',
      this.handleDepositSuccess.bind(this)
    );
    this.eventManager.on('deposit:error', this.handleDepositError.bind(this));
  }

  /**
   * Handle successful deposit
   * @param {Object} data Event data
   */
  handleDepositSuccess(data) {
    console.log('Deposit successful:', data);
    // Update UI or trigger other actions
  }

  /**
   * Handle deposit error
   * @param {Object} data Error data
   */
  handleDepositError(data) {
    console.error('Deposit error:', data);
    // Update UI or trigger error handling
  }
}
