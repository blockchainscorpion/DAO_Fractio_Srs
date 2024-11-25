/**
 * Custom error class for DAO-specific errors
 */
class DAOError extends Error {
  constructor(message, code, context = {}) {
    super(message);
    this.name = 'DAOError';
    this.code = code;
    this.context = context;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Custom error class for Web3-specific errors
 */
class Web3Error extends Error {
  constructor(message, code, context = {}) {
    super(message);
    this.name = 'Web3Error';
    this.code = code;
    this.context = context;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Error codes enumeration for standardized error handling
 */
const ErrorCodes = {
  // Web3 & Network Errors (1000-1999)
  WEB3_NOT_INITIALIZED: 1000,
  NETWORK_ERROR: 1001,
  INVALID_ADDRESS: 1002,
  METAMASK_NOT_FOUND: 1003,
  WRONG_NETWORK: 1004,

  // Contract Errors (2000-2999)
  CONTRACT_NOT_INITIALIZED: 2000,
  CONTRACT_INTERACTION_FAILED: 2001,
  INSUFFICIENT_PERMISSIONS: 2002,
  TRANSACTION_FAILED: 2003,

  // DAO Errors (3000-3999)
  MEMBER_NOT_FOUND: 3000,
  INVALID_PROPOSAL: 3001,
  VOTING_PERIOD_ENDED: 3002,
  ALREADY_VOTED: 3003,

  // User Management Errors (4000-4999)
  USER_NOT_AUTHORIZED: 4000,
  KYC_REQUIRED: 4001,
  INVALID_VOTING_POWER: 4002,

  // General Errors (5000-5999)
  INITIALIZATION_FAILED: 5000,
  INVALID_PARAMETERS: 5001,
  OPERATION_FAILED: 5002,
};

/**
 * Maps MetaMask error codes to our custom error codes
 */
const MetaMaskErrorMap = {
  '-32700': ErrorCodes.TRANSACTION_FAILED, // Parse error
  '-32600': ErrorCodes.INVALID_PARAMETERS, // Invalid request
  '-32601': ErrorCodes.CONTRACT_INTERACTION_FAILED, // Method not found
  '-32602': ErrorCodes.INVALID_PARAMETERS, // Invalid params
  '-32603': ErrorCodes.CONTRACT_INTERACTION_FAILED, // Internal error
  4001: ErrorCodes.USER_NOT_AUTHORIZED, // User rejected request
  '-32002': ErrorCodes.OPERATION_FAILED, // Request already pending
};

/**
 * Main error handling service for standardized error management
 */
class ErrorService {
  constructor(options = {}) {
    this.debug = options.debug || false;
    this.errorListeners = new Set();
    this.errorLog = [];
  }

  /**
   * Creates a standardized error object
   * @param {string} message Error message
   * @param {number} code Error code
   * @param {Object} context Additional error context
   * @returns {DAOError|Web3Error} Standardized error object
   */
  createError(message, code, context = {}) {
    const errorContext = {
      ...context,
      timestamp: new Date().toISOString(),
    };

    // Determine error type based on code range
    if (code >= 1000 && code < 2000) {
      return new Web3Error(message, code, errorContext);
    }
    return new DAOError(message, code, errorContext);
  }

  /**
   * Handles an error through the service
   * @param {Error} error Error object
   * @param {Object} context Additional context
   * @returns {Object} Processed error information
   */
  handleError(error, context = {}) {
    let processedError;

    // Handle MetaMask errors
    if (error.code && MetaMaskErrorMap[error.code]) {
      processedError = this.createError(
        error.message,
        MetaMaskErrorMap[error.code],
        context
      );
    }
    // Handle our custom errors
    else if (error instanceof DAOError || error instanceof Web3Error) {
      processedError = error;
    }
    // Handle unknown errors
    else {
      processedError = this.createError(
        error.message || 'An unknown error occurred',
        ErrorCodes.OPERATION_FAILED,
        context
      );
    }

    this.logError(processedError);
    this.notifyListeners(processedError);

    if (this.debug) {
      console.error('Error Details:', {
        name: processedError.name,
        message: processedError.message,
        code: processedError.code,
        context: processedError.context,
      });
    }

    return processedError;
  }

  /**
   * Logs an error to the internal error log
   * @param {Error} error Error to log
   */
  logError(error) {
    this.errorLog.push({
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        context: error.context,
      },
    });

    // Keep only last 100 errors
    if (this.errorLog.length > 100) {
      this.errorLog.shift();
    }
  }

  /**
   * Add error listener
   * @param {Function} listener Error listener callback
   */
  addErrorListener(listener) {
    this.errorListeners.add(listener);
  }

  /**
   * Remove error listener
   * @param {Function} listener Error listener to remove
   */
  removeErrorListener(listener) {
    this.errorListeners.delete(listener);
  }

  /**
   * Notify all error listeners
   * @param {Error} error Error to notify about
   */
  notifyListeners(error) {
    this.errorListeners.forEach((listener) => {
      try {
        listener(error);
      } catch (listenerError) {
        console.error('Error in error listener:', listenerError);
      }
    });
  }

  /**
   * Get error message for code
   * @param {number} code Error code
   * @param {Object} params Parameters for message
   * @returns {string} Error message
   */
  getErrorMessage(code, params = {}) {
    const messageTemplates = {
      [ErrorCodes.WEB3_NOT_INITIALIZED]:
        'Web3 is not initialized. Please check your wallet connection.',
      [ErrorCodes.NETWORK_ERROR]: 'Network error occurred: ${params.details}',
      [ErrorCodes.INVALID_ADDRESS]:
        'Invalid Ethereum address provided: ${params.address}',
      [ErrorCodes.METAMASK_NOT_FOUND]:
        'MetaMask not found. Please install MetaMask to use this application.',
      [ErrorCodes.CONTRACT_NOT_INITIALIZED]:
        'Contract not initialized: ${params.contractName}',
      [ErrorCodes.INSUFFICIENT_PERMISSIONS]:
        'Insufficient permissions for operation: ${params.operation}',
      // Add more message templates as needed
    };

    let message = messageTemplates[code] || 'Unknown error occurred';

    // Replace template parameters
    Object.entries(params).forEach(([key, value]) => {
      message = message.replace(`\${params.${key}}`, value);
    });

    return message;
  }

  /**
   * Get recent errors
   * @param {number} limit Number of errors to retrieve
   * @returns {Array} Recent errors
   */
  getRecentErrors(limit = 10) {
    return this.errorLog.slice(-limit);
  }
}

// Export constants and classes
export { ErrorService, DAOError, Web3Error, ErrorCodes };
