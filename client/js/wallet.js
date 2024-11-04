import { showMessage, validateForm } from './utility.js';

document.addEventListener('DOMContentLoaded', function () {
  // Common functionality for all wallet pages
  setupWalletPage();

  // Page-specific functionality
  if (document.getElementById('depositForm')) {
    setupDepositPage();
  } else if (document.getElementById('transferForm')) {
    setupTransferPage();
  } else if (document.getElementById('withdrawForm')) {
    setupWithdrawPage();
  }
});

document.addEventListener('DOMContentLoaded', function () {
  const depositForm = document.getElementById('depositForm');
  if (depositForm) {
    depositForm.addEventListener('submit', handleDepositSubmit);
  }
});

function setupWalletPage() {
  // Common setup for all wallet pages (e.g., loading user data, setting up navigation)
  console.log('Setting up wallet page');
}

function setupDepositPage() {
  const depositForm = document.getElementById('depositForm');
  depositForm.addEventListener('submit', handleDepositSubmit);
}

function setupTransferPage() {
  const transferForm = document.getElementById('transferForm');
  const tokenTypeSelect = document.getElementById('tokenType');

  transferForm.addEventListener('submit', handleTransferSubmit);
  tokenTypeSelect.addEventListener('change', updateTokenBalance);

  // Initial balance update
  updateTokenBalance();
}

function setupWithdrawPage() {
  const withdrawForm = document.getElementById('withdrawForm');
  withdrawForm.addEventListener('submit', handleWithdrawSubmit);

  // Load and display available balance
  updateAvailableBalance();
}

// Function to load wallet data
function loadWalletData() {
  // This would typically be an API call to fetch wallet data
  const walletData = {
    totalBalance: 1234567.89,
    tokens: [
      {
        name: 'Empire State Building Tokens',
        symbol: 'ESBT',
        balance: 10000,
        icon: 'https://fractio.io/empire-state-token.svg',
      },
      {
        name: 'Burj Khalifa Tokens',
        symbol: 'BKT',
        balance: 5000,
        icon: 'https://fractio.io/burj-khalifa-token.svg',
      },
      {
        name: 'Shopping Center Tokens',
        symbol: 'SCT',
        balance: 20000,
        icon: 'https://fractio.io/shopping-center-token.svg',
      },
    ],
    transactions: [
      {
        type: 'Purchase',
        description: 'Empire State Building Tokens',
        date: '2024-01-19 14:30:00',
        amount: -50000,
      },
      {
        type: 'Dividend',
        description: 'Shopping Center Tokens',
        date: '2024-01-18 09:15:00',
        amount: 1500,
      },
      {
        type: 'Deposit',
        description: 'Deposit',
        date: '2024-01-17 11:45:00',
        amount: 100000,
      },
    ],
  };

  updateWalletUI(walletData);
}

// Function to update the wallet UI
function updateWalletUI(data) {
  // Update total balance
  document.getElementById(
    'totalBalance'
  ).textContent = `Total Balance: $${data.totalBalance.toLocaleString()}`;

  // Update token list
  const tokenList = document.getElementById('tokenList');
  tokenList.innerHTML = '';
  data.tokens.forEach((token) => {
    const li = document.createElement('li');
    li.className = 'token-item';
    li.innerHTML = `
            <img src="${token.icon}" alt="${token.name}" class="token-icon">
            <span class="token-name">${token.name}</span>
            <span class="token-balance">${token.balance.toLocaleString()} ${
      token.symbol
    }</span>
        `;
    tokenList.appendChild(li);
  });

  // Update transaction history
  const transactionHistory = document.getElementById('transactionHistory');
  transactionHistory.innerHTML = '';
  data.transactions.forEach((transaction) => {
    const div = document.createElement('div');
    div.className = 'transaction-item';
    div.innerHTML = `
            <div class="transaction-details">
                <div>${transaction.type}: ${transaction.description}</div>
                <div class="transaction-date">${transaction.date}</div>
            </div>
            <div class="transaction-amount">${
              transaction.amount > 0 ? '+' : ''
            }$${Math.abs(transaction.amount).toLocaleString()}</div>
        `;
    transactionHistory.appendChild(div);
  });
}

// Handle user deposit submit event
function handleDepositSubmit(event) {
  event.preventDefault();
  const amount = document.getElementById('depositAmount').value;
  const method = document.getElementById('paymentMethod').value;
  if (!validateForm(event.target)) {
    showMessage('Please fill in all required fields.', 'error');
    return;
  }

  console.log(`Depositing ${amount} via ${method}`);
  // Here you would typically send this data to your backend or smart contract
  showMessage(
    'Deposit request submitted. Please wait for confirmation.',
    'success'
  );
}

// Handle Withdraw submit
function handleWithdrawSubmit(event) {
  event.preventDefault();
  if (!validateForm(event.target)) {
    showMessage('Please fill in all required fields.', 'error');
    return;
  }

  const amount = document.getElementById('withdrawAmount').value;
  const method = document.getElementById('withdrawMethod').value;
  const accountInfo = document.getElementById('accountInfo').value;

  console.log(`Withdrawing ${amount} via ${method} to ${accountInfo}`);
  // Here you would typically send this data to your backend or smart contract
  showMessage(
    'Withdrawal request submitted. Please wait for confirmation.',
    'success'
  );
}

// Handle transfer submit
function handleTransferSubmit(event) {
  event.preventDefault();
  if (!validateForm(event.target)) {
    showMessage('Please fill in all required fields.', 'error');
    return;
  }

  const tokenType = document.getElementById('tokenType').value;
  const recipient = document.getElementById('recipientAddress').value;
  const amount = document.getElementById('transferAmount').value;

  console.log(`Transferring ${amount} ${tokenType} to ${recipient}`);
  // Here you would typically send this data to your backend or smart contract
  showMessage(
    'Transfer request submitted. Please wait for confirmation.',
    'success'
  );
}

function updateTokenBalance() {
  const tokenType = document.getElementById('tokenType').value;
  const balanceDisplay = document.getElementById('tokenBalance');

  // In a real application, you would fetch this data from your backend or smart contract
  const mockBalances = {
    ESBT: 10000,
    BKT: 5000,
    SCT: 20000,
  };

  if (tokenType && mockBalances[tokenType]) {
    balanceDisplay.textContent = `Available Balance: ${mockBalances[tokenType]} ${tokenType}`;
  } else {
    balanceDisplay.textContent = '';
  }
}

function updateAvailableBalance() {
  const balanceDisplay = document.getElementById('availableBalance');

  // In a real application, you would fetch this data from your backend or smart contract
  const mockBalance = 1234567.89;

  balanceDisplay.textContent = `Available Balance: $${mockBalance.toFixed(2)}`;
}

// Initialize the page
function init() {
  loadWalletData();
}

// Run the initialization function when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);
