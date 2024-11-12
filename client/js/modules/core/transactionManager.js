/**
 * Manages transaction submission and monitoring
 */
export class TransactionManager {
  constructor(web3Instance) {
    this.web3 = web3Instance;
  }

  /**
   * Submit a transaction with error handling and confirmations
   * @param {Object} contract Contract instance
   * @param {string} method Method name
   * @param {Array} args Method arguments
   * @param {Object} options Transaction options
   */
  async submitTransaction(contract, method, args = [], options = {}) {
    try {
      // Estimate gas for the transaction
      const gasEstimate = await contract.methods[method](...args).estimateGas(
        options
      );

      // Add 20% buffer to gas estimate
      const gasLimit = Math.floor(gasEstimate * 1.2);

      // Send transaction
      const tx = await contract.methods[method](...args).send({
        ...options,
        gas: gasLimit,
      });

      return tx;
    } catch (error) {
      // Handle specific error types
      if (error.code === 4001) {
        throw new Error('Transaction rejected by user');
      } else if (error.message.includes('execution reverted')) {
        throw new Error('Transaction reverted: ' + error.message);
      }
      throw error;
    }
  }

  /**
   * Wait for transaction receipt with timeout
   * @param {string} txHash Transaction hash
   * @param {number} timeout Timeout in milliseconds
   */
  async waitForReceipt(txHash, timeout = 60000) {
    const startTime = Date.now();

    while (Date.now() < startTime + timeout) {
      const receipt = await this.web3.eth.getTransactionReceipt(txHash);
      if (receipt) {
        return receipt;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    throw new Error('Transaction receipt timeout');
  }
}
