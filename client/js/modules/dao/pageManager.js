/**
 * Manages DAO page initialization and updates
 */
export class PageManager {
  constructor(
    daoManager,
    memberManager,
    proposalManager,
    voteManager,
    statsManager
  ) {
    this.daoManager = daoManager;
    this.memberManager = memberManager;
    this.proposalManager = proposalManager;
    this.voteManager = voteManager;
    this.statsManager = statsManager;
    this.cleanup = null;
  }

  /**
   * Initialize the DAO page
   * @returns {Promise<Function>} Cleanup function
   */
  async initializePage() {
    try {
      const account = await this.daoManager.getCurrentAccount();
      if (!account) {
        throw new Error('No account connected');
      }

      // Check and handle initial admin setup
      await this.handleInitialSetup(account);

      // Check and handle membership
      await this.memberManager.checkAndHandleMembership(account);

      // Load initial data
      await Promise.all([
        this.statsManager.loadDAOStats(),
        this.proposalManager.loadProposals(),
        this.voteManager.loadRecentVotes(),
      ]);

      // Set up event subscriptions
      this.setupEventSubscriptions();

      // Bind form handlers
      this.bindFormHandlers();

      // Return cleanup function
      return this.cleanup;
    } catch (error) {
      console.error('Error initializing DAO page:', error);
      throw error;
    }
  }

  /**
   * Handle initial DAO setup if needed
   * @param {string} account Connected account
   */
  async handleInitialSetup(account) {
    try {
      const adminRole = await this.daoManager.governanceContract.methods
        .ADMIN_ROLE()
        .call();

      const hasAdminRole = await this.daoManager.governanceContract.methods
        .hasRole(adminRole, account)
        .call();

      if (!hasAdminRole) {
        // Check if this is first user (no admins set)
        const defaultAdmin = await this.daoManager.governanceContract.methods
          .getRoleAdmin(adminRole)
          .call();

        if (defaultAdmin === '0x0000000000000000000000000000000000000000') {
          console.log('Setting up initial admin...');
          await this.adminManager.grantAdminRole(account, account);
        }
      }
    } catch (error) {
      console.error('Error in initial setup:', error);
      throw error;
    }
  }

  /**
   * Set up event subscriptions
   */
  setupEventSubscriptions() {
    const eventSubscriptions = [
      // Proposal events
      {
        contract: 'Governance',
        event: 'ProposalCreated',
        handler: async (event) => {
          console.log('New proposal:', event.returnValues);
          await this.proposalManager.loadProposals();
          await this.statsManager.loadDAOStats();
        },
      },
      // Vote events
      {
        contract: 'Governance',
        event: 'Voted',
        handler: async (event) => {
          console.log('New vote:', event.returnValues);
          await this.proposalManager.loadProposals();
          await this.statsManager.loadDAOStats();
        },
      },
    ];

    // Subscribe to events
    eventSubscriptions.forEach((sub) => {
      this.daoManager.eventManager.subscribe(
        sub.contract,
        sub.event,
        { fromBlock: 'latest' },
        sub.handler
      );
    });

    // Set up cleanup function
    this.cleanup = () => {
      this.daoManager.eventManager.unsubscribeAll();
    };
  }

  /**
   * Bind form handlers
   */
  bindFormHandlers() {
    // Proposal creation form
    document
      .querySelector('#createProposalForm')
      ?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const description = document.querySelector(
          '#proposalDescription'
        ).value;
        await this.proposalManager.createProposal(description);
      });

    // Add other form handlers as needed
  }
}
