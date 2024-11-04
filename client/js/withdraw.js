// src/js/withdraw.js

function handleWithdraw(event) {
  event.preventDefault();

  const amount = document.getElementById('amount').value;
  const withdrawalMethod = document.getElementById('withdrawalMethod').value;
  const accountInfo = document.getElementById('accountInfo').value;

  // This would typically be an API call to process the withdrawal
  console.log(
    `Processing withdrawal of $${amount} via ${withdrawalMethod} to ${accountInfo}`
  );
  alert(
    `Withdrawal of $${amount} via ${withdrawalMethod} is being processed. Please allow 1-3 business days for the transaction to complete.`
  );

  // Here you would typically update the user's balance and transaction history
  // For demonstration purposes, we'll just redirect back to the wallet page
  window.location.href = 'wallet.html';
}

function init() {
  const withdrawForm = document.getElementById('withdrawForm');
  withdrawForm.addEventListener('submit', handleWithdraw);

  // In a real application, you would fetch the actual balance from the server
  document.getElementById('availableBalance').textContent = '$1,234,567.89';
}

document.addEventListener('DOMContentLoaded', init);
