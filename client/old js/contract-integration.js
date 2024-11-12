if (window.ethereum) {
  window.ethereum.autoRefreshOnNetworkChange = false;
}

// Global state object to store contract instances and web3 connection
const ContractState = {
  web3: null,
  governanceContract: null,
  tokenContract: null,
  accounts: [],
  isInitialized: false,
};

/**
 * Check if MetaMask is installed and accessible
 * @returns {boolean} Whether MetaMask is available
 */
function checkMetaMaskAvailability() {
  if (typeof window.ethereum !== 'undefined') {
    return true;
  }
  console.error(
    'MetaMask is not installed. Please install MetaMask to use this application.'
  );
  return false;
}

/**
 * Request account access from MetaMask
 * @returns {Promise<string[]>} Array of account addresses
 */
async function requestAccounts() {
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
 * Initialize Web3 instance with MetaMask provider
 */
function initializeWeb3() {
  ContractState.web3 = new Web3(window.ethereum);
}

/**
 * Initialize contract instances using ABIs from config.js
 */
function initializeContracts() {
  try {
    // Initialize Governance Contract
    ContractState.governanceContract = new ContractState.web3.eth.Contract(
      window.CONFIG.GOVERNANCE_ABI,
      window.CONFIG.GOVERNANCE_ADDRESS
    );

    // Initialize Token Contract
    ContractState.tokenContract = new ContractState.web3.eth.Contract(
      window.CONFIG.GOVERNANCE_TOKEN_ABI,
      window.CONFIG.TOKEN_ADDRESS
    );
  } catch (error) {
    console.error('Error initializing contracts:', error);
    throw error;
  }
}

/**
 * Set up MetaMask account change listener
 */
function setupAccountChangeListener() {
  window.ethereum.on('accountsChanged', async (accounts) => {
    ContractState.accounts = accounts;
    // Dispatch custom event for components to respond to account changes
    window.dispatchEvent(
      new CustomEvent('accountsChanged', { detail: accounts })
    );
  });
}

/**
 * Set up network change listener
 */
function setupNetworkChangeListener() {
  window.ethereum.on('chainChanged', (chainId) => {
    // Reload the page on network change as recommended by MetaMask
    window.location.reload();
  });
}

/**
 * Initialize the entire Web3 environment
 * @returns {Promise<boolean>} Success status of initialization
 */
async function initializeWeb3Environment() {
  try {
    // Check if already initialized
    if (ContractState.isInitialized) {
      return true;
    }

    // Check MetaMask availability
    if (!checkMetaMaskAvailability()) {
      return false;
    }

    // Get accounts
    const accounts = await requestAccounts();
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts available');
    }
    ContractState.accounts = accounts;

    // Initialize Web3
    initializeWeb3();

    // Initialize contracts
    initializeContracts();

    // Setup event listeners
    setupAccountChangeListener();
    setupNetworkChangeListener();

    ContractState.isInitialized = true;
    return true;
  } catch (error) {
    console.error('Error initializing Web3 environment:', error);
    return false;
  }
}

/**
 * Get the current user's address
 * @returns {string|null} Current user's address or null if not available
 */
function getCurrentUserAddress() {
  return ContractState.accounts[0] || null;
}

/**
 * Check if Web3 is initialized
 * @returns {boolean} Initialization status
 */
function isWeb3Initialized() {
  return ContractState.isInitialized;
}

// Export methods for use in other files
window.ContractIntegration = {
  initialize: initializeWeb3Environment,
  isInitialized: isWeb3Initialized,
  getCurrentUser: getCurrentUserAddress,
  getContracts: () => ({
    governance: ContractState.governanceContract,
    token: ContractState.tokenContract,
  }),
  getWeb3: () => ContractState.web3,
};

// Auto-initialize when the script loads
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await initializeWeb3Environment();
  } catch (error) {
    console.error('Error during auto-initialization:', error);
  }
});
