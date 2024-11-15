import { Web3Setup } from '../core/web3Setup.js';
import { ContractManager } from '../core/contractManager.js';
import { EventManager } from '../core/eventManager.js';
import { TransactionManager } from '../core/transactionManager.js';
import { DAOManager } from './daoManager.js';
import { ProposalManager } from './proposalManager.js';
import { VoteManager } from './voteManager.js';
import { StatsManager } from './statsManager.js';
import { DAOPage } from './dao.js';

async function initializeManagers() {
  try {
    // Initialize Web3
    const web3Setup = new Web3Setup();
    await web3Setup.initializeWeb3();
    const web3Instance = web3Setup.getWeb3Instance();
    const account = web3Setup.getCurrentAccount();

    // Initialize contract manager
    const contractManager = new ContractManager(web3Instance);
    await contractManager.initialize(account);

    // Initialize supporting managers
    const eventManager = new EventManager(contractManager);
    const transactionManager = new TransactionManager(web3Instance);

    // Initialize DAO manager
    const daoManager = new DAOManager(
      web3Instance,
      contractManager,
      eventManager,
      transactionManager
    );
    await daoManager.initialize();

    // Initialize feature managers
    const proposalManager = new ProposalManager(daoManager);
    const voteManager = new VoteManager(daoManager, eventManager);
    const statsManager = new StatsManager(daoManager);

    // Initialize UI
    const daoPage = new DAOPage(daoManager);
    await daoPage.initialize();

    // Make managers globally available
    window.daoManager = daoManager;
    window.proposalManager = proposalManager;
    window.voteManager = voteManager;
    window.statsManager = statsManager;

    return true;
  } catch (error) {
    console.error('Failed to initialize managers:', error);
    throw error;
  }
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await initializeManagers();
  } catch (error) {
    console.error('Initialization failed:', error);
    // Show error state in UI
    const defaultStats = {
      totalMembers: 0,
      activeProposals: 0,
      votingPower: '0',
      quorumPercentage: 0,
    };

    Object.entries(defaultStats).forEach(([key, value]) => {
      const element = document.getElementById(key);
      if (element) element.textContent = value.toString();
    });
  }
});
