import { ErrorService, ErrorCodes } from './errorService.js';

let isInitializing = false;

/**
 * Core Web3 initialization and setup functionality
 */
export class Web3Setup {
  constructor() {
    console.log('Web3Setup: Constructor initialized');
    this.web3Instance = null;
    this.networkId = null;
    this.currentAccount = null;
    this.requiredChainId = '0x539'; // Ganache chainId (1337 in hex)
    this.errorService = new ErrorService({ debug: true });
  }

  /**
   * Check if MetaMask is installed and accessible
   * @returns {boolean} Whether MetaMask is available
   */
  static checkMetaMaskAvailability() {
    console.log('Web3Setup: Checking MetaMask availability...');

    if (typeof window.ethereum === 'undefined') {
      throw this.errorService.createError(
        'MetaMask not installed. Please install MetaMask to use this application.',
        ErrorCodes.METAMASK_NOT_FOUND,
        { browserInfo: navigator.userAgent }
      );
    }

    console.log('Web3Setup: MetaMask is available');
    return true;
  }

  /**
   * Initialize Web3 with MetaMask provider
   * @returns {Promise<Web3>} Initialized Web3 instance
   */
  async initializeWeb3() {
    console.log('Web3Setup: Starting Web3 initialization...');

    if (isInitializing) {
      return this.web3Instance;
    }

    isInitializing = true;

    try {
      // 1. Check permissions
      if (!Web3Setup.checkMetaMaskAvailability()) {
        throw this.errorService.createError(
          'No Web3 provider available',
          ErrorCodes.WEB3_NOT_INITIALIZED
        );
      }

      // 2. Create Web3 instance
      console.log('Web3Setup: Creating Web3 instance...');
      this.web3Instance = new Web3(window.ethereum);

      // 3. Verify network
      console.log('Web3Setup: Verifying network...');
      await this.verifyNetwork();

      // 4. Request account access
      console.log('Web3Setup: Requesting account access...');
      const accounts = await this.requestAccounts();
      this.currentAccount = accounts[0];
      console.log('Web3Setup: Connected account:', this.currentAccount);

      // 5. Set up event listeners
      console.log('Web3Setup: Setting up event listeners...');
      this.setupEventListeners();

      // 6. Final verification
      console.log('Web3Setup: Verifying connection...');
      const isListening = await this.web3Instance.eth.net.isListening();

      if (!isListening) {
        throw this.errorService.createError(
          'Failed to establish network connection',
          ErrorCodes.NETWORK_ERROR,
          { provider: window.ethereum?.isMetaMask ? 'MetaMask' : 'Unknown' }
        );
      }

      console.log('Web3Setup: Network connection verified:', isListening);
      return this.web3Instance;
    } catch (error) {
      const processedError = this.errorService.handleError(error, {
        operation: 'initializeWeb3',
        provider: window.ethereum?.isMetaMask ? 'MetaMask' : 'Unknown',
        originalMessage: error.message,
      });

      console.error('Web3Setup: Initialization failed:', processedError);
      throw processedError;
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
      this.errorService.handleError(error, {
        operation: 'networkDisconnect',
        context: 'eventListener',
      });
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
      throw this.errorService.handleError(error, {
        operation: 'requestAccounts',
        context: 'MetaMask interaction',
        originalMessage: error.message,
      });
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
      throw this.errorService.handleError(error, {
        operation: 'verifyNetwork',
        currentChainId: chainId,
        requiredChainId: this.requiredChainId,
        originalMessage: error.message,
      });
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
        throw this.errorService.handleError(error, {
          operation: 'switchNetwork',
          targetChainId: this.requiredChainId,
          originalMessage: error.message,
        });
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
      throw this.errorService.handleError(error, {
        operation: 'addGanacheNetwork',
        originalMessage: error.message,
      });
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
