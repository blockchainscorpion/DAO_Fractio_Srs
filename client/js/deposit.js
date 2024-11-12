import investmentModule from './modules/investment';

async function handleDeposit(event) {
  event.preventDefault();

  const amount = document.getElementById('amount').value;
  const paymentMethod = document.getElementById('paymentMethod').value;

  try {
    // Use deposit manager to process deposit
    await investmentModule.deposit({
      amount,
      method: paymentMethod,
    });

    alert('Deposit successful!');
    window.location.href = 'wallet.html';
  } catch (error) {
    alert('Deposit failed: ' + error.message);
  }
}

function init() {
  // Initialize investment module
  investmentModule.initialize().catch(console.error);

  // Set up form listener
  const depositForm = document.getElementById('depositForm');
  depositForm.addEventListener('submit', handleDeposit);
}

document.addEventListener('DOMContentLoaded', init);
