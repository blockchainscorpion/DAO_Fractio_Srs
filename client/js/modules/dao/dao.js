import { StatsManager } from './statsManager.js';

export class DAOPage {
  constructor(daoManager) {
    this.daoManager = daoManager;
    this.statsManager = new StatsManager(daoManager);
    this.accountElement = document.getElementById('userAddress');
  }

  async initialize() {
    try {
      await this.updateAccountDisplay();
      await this.statsManager.initialize();
      await this.statsManager.loadDAOStats();
      this.setupEventListeners();
      return true;
    } catch (error) {
      console.error('DAO page initialization failed:', error);
      this.showDefaultStats();
      return false;
    }
  }

  async updateAccountDisplay() {
    const account = this.daoManager.getCurrentAccount();
    if (this.accountElement) {
      this.accountElement.textContent = account
        ? `${account.slice(0, 6)}...${account.slice(-4)}`
        : 'Not Connected';
    }
  }

  setupEventListeners() {
    window.ethereum?.on('accountsChanged', () => this.updateAccountDisplay());
  }

  showDefaultStats() {
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
}
