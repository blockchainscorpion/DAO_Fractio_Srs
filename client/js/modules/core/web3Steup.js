/**
 * Core Web3 initialization and setup functionality
 */
export class Web3Setup {
  constructor() {
    this.web3Instance = null;
    this.networkId = null;
  }

  /**
   * Check if MetaMask is installed and accessible
   * @returns {boolean} Whether MetaMask is available
   */
  static checkMetaMaskAvailability() {
    if (typeof window.ethereum !== 'undefined') {
      return true;
    }
    throw new Error(
      'MetaMask not installed. Please install MetaMask to use this application.'
    );
  }

  /**
   * Initialize Web3 with the appropriate provider
   * @returns {Web3} Initialized Web3 instance
   */
  async initializeWeb3() {
    try {
      // Check MetaMask first
      if (!Web3Setup.checkMetaMaskAvailability()) {
        throw new Error('No Web3 provider available');
      }

      // Create Web3 instance
      this.web3Instance = new Web3(window.ethereum);

      // Get network info
      this.networkId = await this.web3Instance.eth.net.getId();

      return this.web3Instance;
    } catch (error) {
      console.error('Failed to initialize Web3:', error);
      throw error;
    }
  }

  /**
   * Request account access from MetaMask
   * @returns {Promise<string[]>} Array of account addresses
   */
  async requestAccounts() {
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      return accounts;
    } catch (error) {
      console.error('Error requesting account access:', error);
      throw error;
    }
  }

  /**
   * Verify and switch to the correct network
   * @param {string} requiredChainId Chain ID in hex format
   */
  async verifyNetwork(requiredChainId) {
    try {
      const currentChainId = await window.ethereum.request({
        method: 'eth_chainId',
      });

      if (currentChainId !== requiredChainId) {
        await this.switchNetwork(requiredChainId);
      }
    } catch (error) {
      console.error('Network verification failed:', error);
      throw error;
    }
  }

  /**
   * Switch to specified network
   * @param {string} chainId Chain ID in hex format
   */
  async switchNetwork(chainId) {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
      });
    } catch (error) {
      if (error.code === 4902) {
        await this.addGanacheNetwork();
      }
      throw error;
    }
  }

  /**
   * Add Ganache network to MetaMask
   */
  async addGanacheNetwork() {
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: '0x539',
            chainName: 'Ganache',
            nativeToken: {
              name: 'ETH',
              symbol: 'ETH',
              decimals: 18,
            },
            rpcUrls: ['http://127.0.0.1:7545'],
          },
        ],
      });
    } catch (error) {
      console.error('Failed to add Ganache network:', error);
      throw error;
    }
  }
}
