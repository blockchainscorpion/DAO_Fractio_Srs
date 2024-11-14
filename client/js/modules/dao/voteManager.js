import { EventEmitter } from '../core/EventEmitter.js';
/**
 * Manages vote-related functionality
 */
export class VoteManager {
  constructor(daoManager, eventManager) {
    this.daoManager = daoManager;
    this.eventManager = eventManager;
    this.recentVotes = [];
  }

  /**
   * Load recent votes
   * @returns {Promise<Array>} List of recent votes
   */
  async loadRecentVotes() {
    try {
      // Subscribe to Vote events
      this.eventManager.subscribe(
        'Governance',
        'Voted',
        { fromBlock: 'latest' },
        this.handleVoteEvent.bind(this)
      );

      // Get past votes (last 10)
      const pastVotes = await this.daoManager.governanceContract.getPastEvents(
        'Voted',
        {
          fromBlock: 'earliest',
          toBlock: 'latest',
        }
      );

      // Process and store recent votes
      this.recentVotes = pastVotes.slice(-10).map(this.processVoteEvent);

      return this.recentVotes;
    } catch (error) {
      console.error('Error loading recent votes:', error);
      throw error;
    }
  }

  /**
   * Process a vote event into a standardized format
   * @param {Object} event Vote event
   * @returns {Object} Formatted vote data
   */
  processVoteEvent(event) {
    return {
      voter: event.returnValues.voter,
      proposalId: event.returnValues.proposalId,
      support: event.returnValues.support,
      weight: event.returnValues.weight,
      timestamp: new Date(event.timestamp * 1000),
    };
  }

  /**
   * Handle incoming vote events
   * @param {Object} event Vote event
   */
  handleVoteEvent(event) {
    const vote = this.processVoteEvent(event);
    this.recentVotes.unshift(vote);
    if (this.recentVotes.length > 10) {
      this.recentVotes.pop();
    }
  }
}
