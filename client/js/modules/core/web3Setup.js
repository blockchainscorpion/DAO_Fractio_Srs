// Initialization check
let isInitializing = false;
let isInitialized = false;
/**
 * Core Web3 initialization and setup functionality
 */
export class Web3Setup {
  constructor() {
    // Only log initializations once during construction
    if (!isInitialized) {
      console.log('Web3Setup: Constructor initialized');
    }
    this.web3Instance = null;
    this.networkId = null;
    this.currentAccount = null;
    this.requiredChainId = '0x539'; // Ganache chainId (1337 in hex)
  }

  /**
   * Check if MetaMask is installed and accessible
   * @returns {boolean} Whether MetaMask is available
   */
  static checkMetaMaskAvailability() {
    // Only log if not initialized
    if (!isInitialized) {
      console.log('Web3Setup: Checking MetaMask availability...');
    }

    if (typeof window.ethereum !== 'undefined') {
      if (!isInitialized) {
        console.log('Web3Setup: MetaMask is available');
      }
      return true;
    }
    console.error('Web3Setup: MetaMask not found');
    throw new Error(
      'MetaMask not installed. Please install MetaMask to use this application.'
    );
  }

  /**
   * Initialize Web3 with MetaMask provider
   * @returns {Promise<Web3>} Initialized Web3 instance
   */
  async initializeWeb3() {
    // a. If already initialized, return existing instance
    if (isInitialized && this.web3Instance) {
      return this.web3Instance;
    }

    // b. If currently initializing, wait and return
    if (isInitializing) {
      return this.web3Instance;
    }

    isInitializing = true;

    try {
      if (!isInitialized) {
        console.log('Web3Setup: Starting Web3 initialization...');
      }

      // 1. Check permissions
      if (!Web3Setup.checkMetaMaskAvailability()) {
        throw new Error('No Web3 provider available');
      }

      // 2. Create Web3 instance
      this.web3Instance = new Web3(window.ethereum);
      if (!isInitialized) {
        console.log('Web3Setup: Web3 instance created:', this.web3Instance);
      }

      // 3. Verify network
      await this.verifyNetwork();

      // 4. Request account access
      const accounts = await this.requestAccounts();
      this.currentAccount = accounts[0];
      if (!isInitialized) {
        console.log('Web3Setup: Connected account:', this.currentAccount);
      }

      // 5. Set up event listeners (only if not already initialized)
      if (!isInitialized) {
        this.setupEventListeners();
      }

      // 6. Final verification
      const isListening = await this.web3Instance.eth.net.isListening();
      if (!isInitialized) {
        console.log('Web3Setup: Network connection verified:', isListening);
      }

      isInitialized = true;
      return this.web3Instance;
    } catch (error) {
      console.error('Web3Setup: Initialization failed:', error);
      throw error;
    } finally {
      isInitializing = false;
    }
  }

  /**
   * Set up Web3 event listeners
   */
  setupEventListeners() {
    console.log('Web3Setup: Setting up event listeners');

    window.ethereum.on('accountsChanged', (accounts) => {
      console.log('Web3Setup: Account changed:', accounts[0]);
      this.currentAccount = accounts[0];
      window.dispatchEvent(
        new CustomEvent('accountChanged', {
          detail: { account: accounts[0] },
        })
      );
    });

    window.ethereum.on('chainChanged', (chainId) => {
      console.log('Web3Setup: Network changed:', chainId);
      window.location.reload();
    });

    window.ethereum.on('connect', (connectInfo) => {
      console.log('Web3Setup: Connected to network:', connectInfo);
    });

    window.ethereum.on('disconnect', (error) => {
      console.log('Web3Setup: Disconnected from network:', error);
    });
  }

  /**
   * Request account access from MetaMask
   * @returns {Promise<string[]>} Array of account addresses
   */
  async requestAccounts() {
    console.log('Web3Setup: Requesting account access...');
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      console.log('Web3Setup: Accounts received:', accounts);
      return accounts;
    } catch (error) {
      console.error('Web3Setup: Error requesting account access:', error);
      throw new Error(`Failed to get account access: ${error.message}`);
    }
  }

  /**
   * Verify and switch to the correct network if needed
   */
  async verifyNetwork() {
    console.log('Web3Setup: Verifying network...');
    try {
      const chainId = await window.ethereum.request({
        method: 'eth_chainId',
      });

      console.log('Web3Setup: Current chainId:', chainId);
      console.log('Web3Setup: Required chainId:', this.requiredChainId);

      if (chainId !== this.requiredChainId) {
        console.log('Web3Setup: Network switch required');
        await this.switchNetwork();
      }
    } catch (error) {
      console.error('Web3Setup: Network verification failed:', error);
      throw error;
    }
  }

  /**
   * Switch to Ganache network
   */
  async switchNetwork() {
    console.log('Web3Setup: Attempting to switch network...');
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: this.requiredChainId }],
      });
      console.log('Web3Setup: Network switch successful');
    } catch (error) {
      if (error.code === 4902) {
        console.log('Web3Setup: Network not found, adding Ganache...');
        await this.addGanacheNetwork();
      } else {
        throw error;
      }
    }
  }

  /**
   * Add Ganache network to MetaMask
   */
  async addGanacheNetwork() {
    console.log('Web3Setup: Adding Ganache network...');
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: this.requiredChainId,
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
      console.log('Web3Setup: Ganache network added successfully');
    } catch (error) {
      console.error('Web3Setup: Failed to add Ganache network:', error);
      throw new Error(`Failed to add Ganache network: ${error.message}`);
    }
  }

  /**
   * Get the current connected account
   * @returns {string|null} Current account address
   */
  getCurrentAccount() {
    return this.currentAccount;
  }

  /**
   * Get the Web3 instance
   * @returns {Web3|null} Web3 instance
   */
  getWeb3Instance() {
    return this.web3Instance;
  }
}
