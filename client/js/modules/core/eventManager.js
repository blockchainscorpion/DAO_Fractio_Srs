/**
 * Manages contract event subscriptions
 */
export class EventManager {
  constructor(contractManager) {
    this.contractManager = contractManager;
    this.subscriptions = new Map();
  }

  /**
   * Subscribe to a contract event
   * @param {string} contractName Contract name
   * @param {string} eventName Event name
   * @param {Object} options Event options
   * @param {Function} callback Callback function
   */
  subscribe(contractName, eventName, options, callback) {
    try {
      const contract = this.contractManager.getContract(contractName);
      const subscription = contract.events[eventName](options)
        .on('data', callback)
        .on('error', (error) => {
          console.error(`Event ${eventName} error:`, error);
          throw error;
        });

      const key = `${contractName}:${eventName}`;
      this.subscriptions.set(key, subscription);
    } catch (error) {
      console.error('Event subscription failed:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from all events
   */
  unsubscribeAll() {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.subscriptions.clear();
  }
}
