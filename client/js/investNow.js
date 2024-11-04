// src/js/investNow.js

function updateTotalInvestment() {
  const tokenCount = document.getElementById('tokenCount').value;
  const pricePerToken = 100; // This should be fetched from the server in a real application
  const totalInvestment = tokenCount * pricePerToken;
  document.getElementById('totalInvestment').textContent =
    totalInvestment.toLocaleString();
}

function confirmInvestment() {
  const tokenCount = document.getElementById('tokenCount').value;
  const totalInvestment =
    document.getElementById('totalInvestment').textContent;
  alert(
    `Confirming investment of ${tokenCount} tokens for $${totalInvestment}. Proceeding to payment...`
  );
  // Here you would typically redirect to a payment gateway or blockchain transaction
}

function init() {
  document
    .getElementById('tokenCount')
    .addEventListener('input', updateTotalInvestment);
  document
    .getElementById('confirmInvestment')
    .addEventListener('click', confirmInvestment);
}

document.addEventListener('DOMContentLoaded', init);
