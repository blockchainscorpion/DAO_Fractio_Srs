// src/js/transfer.js

const tokenBalances = {
  ESBT: 10000,
  BKT: 5000,
  SCT: 20000,
};

function updateTokenBalance() {
  const selectedToken = document.getElementById('tokenSelect').value;
  const balanceElement = document.getElementById('tokenBalance');
  balanceElement.textContent = selectedToken
    ? tokenBalances[selectedToken]
    : '0';
}

function handleTransfer(event) {
  event.preventDefault();

  const token = document.getElementById('tokenSelect').value;
  const recipient = document.getElementById('recipientAddress').value;
  const amount = document.getElementById('amount').value;

  // This would typically be an API call to process the transfer
  console.log(`Transferring ${amount} ${token} to ${recipient}`);
  alert(
    `Transfer of ${amount} ${token} to ${recipient} is being processed. Please wait for confirmation.`
  );

  // Here you would typically update the user's token balance and transaction history
  // For demonstration purposes, we'll just redirect back to the wallet page
  window.location.href = 'wallet.html';
}

function init() {
  const tokenSelect = document.getElementById('tokenSelect');
  tokenSelect.addEventListener('change', updateTokenBalance);

  const transferForm = document.getElementById('transferForm');
  transferForm.addEventListener('submit', handleTransfer);

  updateTokenBalance();
}

document.addEventListener('DOMContentLoaded', init);
