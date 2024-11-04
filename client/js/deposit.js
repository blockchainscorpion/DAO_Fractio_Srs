// src/js/deposit.js

function handleDeposit(event) {
  event.preventDefault();

  const amount = document.getElementById('amount').value;
  const paymentMethod = document.getElementById('paymentMethod').value;

  // This would typically be an API call to process the deposit
  console.log(`Processing deposit of $${amount} via ${paymentMethod}`);
  alert(
    `Deposit of $${amount} via ${paymentMethod} is being processed. You will be redirected to complete the transaction.`
  );

  // Here you would typically redirect the user to the appropriate payment gateway
  // For demonstration purposes, we'll just redirect back to the wallet page
  window.location.href = 'wallet.html';
}

function init() {
  const depositForm = document.getElementById('depositForm');
  depositForm.addEventListener('submit', handleDeposit);
}

document.addEventListener('DOMContentLoaded', init);
