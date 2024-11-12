import { EventEmitter } from 'events';

/**
 * Manages proposal-related functionality
 */
export class ProposalManager {
  constructor(daoManager, eventManager) {
    this.daoManager = daoManager;
    this.eventManager = eventManager;
    this.proposals = [];
    // Add EventEmitter functionality
    this.events = new EventEmitter();
  }

  /**
   * Create a new proposal with additional validation and processing
   * @param {string} title Proposal title
   * @param {string} description Proposal description
   * @returns {Promise<Object>} Created proposal
   */
  async createProposal(title, description) {
    try {
      // Input validation
      if (!title || !description) {
        throw new Error('Please fill in all fields');
      }

      const accounts = await this.daoManager.web3.eth.getAccounts();
      const currentAccount = accounts[0];

      // Create proposal using DAOManager
      const tx = await this.daoManager.createProposal(
        description,
        currentAccount
      );

      // Process the transaction result
      const proposalId = tx.events.ProposalCreated.returnValues.proposalId;

      // Update local state
      await this.loadProposals();

      // Emit local event for UI updates
      this.events.emit('proposalCreated', {
        id: proposalId,
        title,
        description,
        creator: currentAccount,
      });

      return proposalId;
    } catch (error) {
      console.error('Error in ProposalManager.createProposal:', error);
      throw error;
    }
  }

  /**
   * Load all proposals
   * @returns {Promise<Array>} List of proposals
   */
  async loadProposals() {
    try {
      const contract = this.daoManager.governanceContract;
      const proposalCount = await contract.methods.proposalCount().call();
      const proposals = [];

      for (let i = 0; i < proposalCount; i++) {
        const proposal = await contract.methods.proposals(i).call();
        proposals.push({
          ...proposal,
          id: i,
          forVotes: this.daoManager.web3.utils.fromWei(
            proposal.forVotes,
            'ether'
          ),
          againstVotes: this.daoManager.web3.utils.fromWei(
            proposal.againstVotes,
            'ether'
          ),
        });
      }

      this.proposals = proposals;
      return proposals;
    } catch (error) {
      console.error('Error loading proposals:', error);
      throw error;
    }
  }

  /**
   * Vote on a proposal
   * @param {number} proposalId Proposal ID
   * @param {boolean} support Whether to support the proposal
   */
  async vote(proposalId, support) {
    try {
      const accounts = await this.daoManager.web3.eth.getAccounts();
      const currentAccount = accounts[0];

      // Check if already voted
      const hasVoted = await this.daoManager.governanceContract.methods
        .hasVoted(currentAccount, proposalId)
        .call();

      if (hasVoted) {
        throw new Error('Already voted on this proposal');
      }

      // Use executeMethod from daoManager instead
      await this.daoManager.executeMethod('vote', [proposalId, support], {
        from: currentAccount,
      });

      // Refresh proposals after voting
      await this.loadProposals();
    } catch (error) {
      console.error('Error voting on proposal:', error);
      throw error;
    }
  }

  /**
   * Get proposal by ID
   * @param {number} proposalId Proposal ID
   * @returns {Promise<Object>} Proposal data
   */
  async getProposal(proposalId) {
    try {
      const proposal = await this.daoManager.governanceContract.methods
        .proposals(proposalId)
        .call();

      return {
        ...proposal,
        id: proposalId,
        forVotes: this.daoManager.web3.utils.fromWei(
          proposal.forVotes,
          'ether'
        ),
        againstVotes: this.daoManager.web3.utils.fromWei(
          proposal.againstVotes,
          'ether'
        ),
      };
    } catch (error) {
      console.error('Error getting proposal:', error);
      throw error;
    }
  }
}
