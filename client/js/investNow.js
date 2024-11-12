import investmentModule from './modules/investment';

function updateTotalInvestment() {
  const tokenCount = document.getElementById('tokenCount').value;
  const pricePerToken = 100; // This should be fetched from the server in a real application
  const totalInvestment = tokenCount * pricePerToken;
  document.getElementById('totalInvestment').textContent =
    totalInvestment.toLocaleString();
}

async function confirmInvestment() {
  try {
    const tokenCount = document.getElementById('tokenCount').value;
    const propertyId = new URLSearchParams(window.location.search).get('id');

    // Use investment module to process investment
    await investmentModule.invest({
      propertyId,
      amount: tokenCount,
      options: {
        // Additional options like slippage tolerance etc.
      },
    });

    alert('Investment successful!');
    window.location.href = 'yourEstate.html';
  } catch (error) {
    alert('Investment failed: ' + error.message);
  }
}

function init() {
  // Initialize investment module
  investmentModule.initialize().catch(console.error);

  // Set up UI event listeners
  document
    .getElementById('tokenCount')
    .addEventListener('input', updateTotalInvestment);
  document
    .getElementById('confirmInvestment')
    .addEventListener('click', confirmInvestment);
}

document.addEventListener('DOMContentLoaded', init);
