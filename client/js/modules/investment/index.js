import { DepositManager } from './depositManager';
import { InvestmentManager } from './investmentManager';
import { PortfolioManager } from './portfolioManager';

/**
 * Main investment module that coordinates all investment-related functionality
 */
class InvestmentModule {
  constructor() {
    this.depositManager = new DepositManager();
    this.investmentManager = new InvestmentManager();
    this.portfolioManager = new PortfolioManager();
    this.initialized = false;
  }

  /**
   * Initialize the investment module and its managers
   * @returns {Promise<boolean>} Initialization success
   */
  async initialize() {
    try {
      await Promise.all([
        this.depositManager.initialize(),
        this.investmentManager.initialize(),
        this.portfolioManager.initialize(),
      ]);

      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Investment module initialization failed:', error);
      return false;
    }
  }

  /**
   * Make an investment
   * @param {Object} params Investment parameters
   * @returns {Promise<Object>} Investment result
   */
  async invest(params) {
    this.checkInitialization();
    return this.investmentManager.invest(
      params.propertyId,
      params.amount,
      params.options
    );
  }

  /**
   * Process a deposit
   * @param {Object} params Deposit parameters
   * @returns {Promise<Object>} Deposit result
   */
  async deposit(params) {
    this.checkInitialization();
    return this.depositManager.processDeposit(params.amount, params.method);
  }

  /**
   * Get user's investment portfolio
   * @returns {Promise<Array>} Portfolio investments
   */
  async getPortfolio() {
    this.checkInitialization();
    return this.portfolioManager.loadPortfolio();
  }

  /**
   * Check if module is initialized
   * @throws {Error} If module is not initialized
   */
  checkInitialization() {
    if (!this.initialized) {
      throw new Error('Investment module not initialized');
    }
  }
}

// Create singleton instance
const investmentModule = new InvestmentModule();

export default investmentModule;
export { DepositManager, InvestmentManager, PortfolioManager };
