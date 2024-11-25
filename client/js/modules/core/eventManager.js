import { ErrorService, ErrorCodes } from './errorService.js';

/**
 * Manages contract event subscriptions
 */
export class EventManager {
  /**
   * Initialize event manager
   * @param {ContractManager} contractManager Contract manager instance
   */
  constructor(contractManager) {
    this.contractManager = contractManager;
    this.subscriptions = new Map();
    this.errorService = new ErrorService({ debug: true });
  }

  /**
   * Subscribe to a contract event
   * @param {string} contractName Contract name
   * @param {string} eventName Event name
   * @param {Object} options Event options
   * @param {Function} callback Callback function
   */
  async subscribe(contractName, eventName, options, callback) {
    try {
      // 1. Check permissions & parameters
      if (!contractName || !eventName) {
        throw this.errorService.createError(
          'Contract name and event name are required',
          ErrorCodes.INVALID_PARAMETERS,
          { contractName, eventName }
        );
      }

      // 2. Verify contract state
      const contract = this.contractManager.getContract(contractName);
      if (!contract.events[eventName]) {
        throw this.errorService.createError(
          `Event ${eventName} not found in contract ${contractName}`,
          ErrorCodes.CONTRACT_INTERACTION_FAILED,
          { contractName, eventName }
        );
      }

      // 3. Execute subscription
      const subscription = contract.events[eventName](options)
        .on('data', (event) => {
          try {
            callback(event);
          } catch (callbackError) {
            this.errorService.handleError(callbackError, {
              operation: 'eventCallback',
              event: eventName,
              contract: contractName,
            });
          }
        })
        .on('error', (error) => {
          const processedError = this.errorService.handleError(error, {
            operation: 'eventSubscription',
            event: eventName,
            contract: contractName,
          });
          console.error(`Event ${eventName} error:`, processedError);
        });

      // Store subscription
      const key = `${contractName}:${eventName}`;
      this.subscriptions.set(key, {
        subscription,
        timestamp: new Date().toISOString(),
        options,
      });

      return subscription;
    } catch (error) {
      // 4. Handle errors
      throw this.errorService.handleError(error, {
        operation: 'subscribe',
        contract: contractName,
        event: eventName,
        originalMessage: error.message,
      });
    }
  }

  /**
   * Unsubscribe from all events
   */
  async unsubscribeAll() {
    try {
      for (const [key, subscriptionData] of this.subscriptions.entries()) {
        try {
          await subscriptionData.subscription.unsubscribe();
          console.log(`Successfully unsubscribed from ${key}`);
        } catch (error) {
          // Log but don't throw error for individual unsubscribe failures
          this.errorService.handleError(error, {
            operation: 'unsubscribe',
            subscription: key,
            severity: 'warning',
          });
        }
      }
      this.subscriptions.clear();
    } catch (error) {
      throw this.errorService.handleError(error, {
        operation: 'unsubscribeAll',
        subscriptionCount: this.subscriptions.size,
        originalMessage: error.message,
      });
    }
  }

  /**
   * Unsubscribe from a specific event
   * @param {string} contractName Contract name
   * @param {string} eventName Event name
   */
  async unsubscribe(contractName, eventName) {
    try {
      // 1. Check parameters
      if (!contractName || !eventName) {
        throw this.errorService.createError(
          'Contract name and event name are required',
          ErrorCodes.INVALID_PARAMETERS,
          { contractName, eventName }
        );
      }

      // 2. Verify subscription exists
      const key = `${contractName}:${eventName}`;
      const subscriptionData = this.subscriptions.get(key);

      if (!subscriptionData) {
        throw this.errorService.createError(
          `No subscription found for ${key}`,
          ErrorCodes.OPERATION_FAILED,
          { subscription: key }
        );
      }

      // 3. Execute unsubscribe
      await subscriptionData.subscription.unsubscribe();
      this.subscriptions.delete(key);

      console.log(`Successfully unsubscribed from ${key}`);
    } catch (error) {
      throw this.errorService.handleError(error, {
        operation: 'unsubscribe',
        contract: contractName,
        event: eventName,
        originalMessage: error.message,
      });
    }
  }

  /**
   * Get active subscriptions
   * @returns {Array} List of active subscriptions
   */
  getActiveSubscriptions() {
    try {
      return Array.from(this.subscriptions.entries()).map(([key, data]) => ({
        key,
        timestamp: data.timestamp,
        options: data.options,
      }));
    } catch (error) {
      throw this.errorService.handleError(error, {
        operation: 'getActiveSubscriptions',
        originalMessage: error.message,
      });
    }
  }

  /**
   * Check if a subscription exists
   * @param {string} contractName Contract name
   * @param {string} eventName Event name
   * @returns {boolean} Whether subscription exists
   */
  hasSubscription(contractName, eventName) {
    try {
      const key = `${contractName}:${eventName}`;
      return this.subscriptions.has(key);
    } catch (error) {
      throw this.errorService.handleError(error, {
        operation: 'hasSubscription',
        contract: contractName,
        event: eventName,
        originalMessage: error.message,
      });
    }
  }

  /**
   * Clean up stale subscriptions
   * @param {number} maxAge Maximum age in milliseconds
   */
  async cleanupStaleSubscriptions(maxAge = 24 * 60 * 60 * 1000) {
    // Default 24 hours
    try {
      const now = new Date().getTime();
      for (const [key, data] of this.subscriptions.entries()) {
        const subscriptionAge = now - new Date(data.timestamp).getTime();
        if (subscriptionAge > maxAge) {
          try {
            await this.unsubscribe(...key.split(':'));
            console.log(`Cleaned up stale subscription: ${key}`);
          } catch (error) {
            // Log but don't throw error for individual cleanup failures
            this.errorService.handleError(error, {
              operation: 'cleanupSubscription',
              subscription: key,
              severity: 'warning',
            });
          }
        }
      }
    } catch (error) {
      throw this.errorService.handleError(error, {
        operation: 'cleanupStaleSubscriptions',
        maxAge,
        originalMessage: error.message,
      });
    }
  }
}
