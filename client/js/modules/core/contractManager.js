/**
 * Manages contract instances and interactions
 */
export class ContractManager {
  constructor(web3Instance) {
    this.web3 = web3Instance;
    this.contracts = new Map();
  }

  /**
   * Initialize a contract instance
   * @param {string} name Contract name
   * @param {Object} abi Contract ABI
   * @param {string} address Contract address
   */
  initContract(name, abi, address) {
    try {
      const contract = new this.web3.eth.Contract(abi, address);
      this.contracts.set(name, contract);
      return contract;
    } catch (error) {
      console.error(`Failed to initialize ${name} contract:`, error);
      throw error;
    }
  }

  /**
   * Get a contract instance
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
   * Verify contract connection by calling a view method
   * @param {string} name Contract name
   * @param {string} method Method to call
   */
  async verifyContract(name, method) {
    try {
      const contract = this.getContract(name);
      await contract.methods[method]().call();
      return true;
    } catch (error) {
      console.error(`Contract ${name} verification failed:`, error);
      throw error;
    }
  }
}
