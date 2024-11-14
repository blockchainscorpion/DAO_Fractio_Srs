import { Web3Setup } from '../core/web3Setup.js';
import { ContractManager } from '../core/contractManager.js';
import { EventManager } from '../core/eventManager.js';
import { TransactionManager } from '../core/transactionManager.js';
import { DAOManager } from './daoManager.js';
import { ProposalManager } from './proposalManager.js';
import { VoteManager } from './voteManager.js';
import { StatsManager } from './statsManager.js';


// Initialize everything when document loads
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const web3Setup = new Web3Setup();
    await web3Setup.initializeWeb3();

    const web3Instance = web3Setup.getWeb3Instance();
    const contractManager = new ContractManager(web3Instance);
    await contractManager.initialize(web3Setup.getCurrentAccount());

    const eventManager = new EventManager(contractManager);
    const transactionManager = new TransactionManager(web3Instance);
    const daoManager = new DAOManager(
      web3Instance,
      contractManager,
      eventManager,
      transactionManager
    );

    // Initialize managers
    const proposalManager = new ProposalManager(daoManager);
    const voteManager = new VoteManager(daoManager, eventManager);
    const statsManager = new StatsManager(daoManager);

    // Initialize DAO
    await daoManager.initialize();

    // Make necessary functions global
    window.voteManager = voteManager;
    window.proposalManager = proposalManager;
    window.daoManager = daoManager;
  } catch (error) {
    console.error('Failed to initialize:', error);
  }
});
