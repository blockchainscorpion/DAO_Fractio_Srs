// src/js/yourEstate.js

// Function to create an investment item
function createInvestmentItem(investment) {
  const item = document.createElement('div');
  item.className = 'investment-item';

  item.innerHTML = `
    <div class="investment-info">
      <h3>${investment.title}</h3>
      <p>Minimum Investment: $${investment.minInvestment} | Status: ${investment.status}</p>
    </div>
    <div class="investment-actions">
      <button class="btn btn-details" onclick="viewDetails('${investment.id}')">View Details</button>
      <button class="btn btn-manage" onclick="manageProperty('${investment.id}')">Manage</button>
    </div>
  `;

  return item;
}

// Function to load user's investments and populate the list
function loadInvestments() {
  // This would typically be an API call to fetch user's investment data
  const investments = [
    {
      id: 'hmo-manchester',
      title: 'HMO Property in Manchester',
      minInvestment: '5,000',
      status: 'Active',
    },
    {
      id: 'mushroom-farm',
      title: 'Gourmet Mushroom Farm in California',
      minInvestment: '7,500',
      status: 'Active',
    },
    {
      id: 'hemp-plant',
      title: 'Hemp Processing Plant in Colorado',
      minInvestment: '15,000',
      status: 'Active',
    },
  ];

  const investmentsList = document.getElementById('investmentsList');
  investmentsList.innerHTML = ''; // Clear existing items

  investments.forEach((investment) => {
    const item = createInvestmentItem(investment);
    investmentsList.appendChild(item);
  });

  // Update stats
  updateEstateStats(investments);
}

// Function to update estate statistics
function updateEstateStats(investments) {
  const totalInvestments = investments.length;
  const totalInvested = investments.reduce(
    (sum, inv) => sum + parseInt(inv.minInvestment.replace(',', '')),
    0
  );
  const diversityScore = calculateDiversityScore(investments);

  document.getElementById('totalInvestments').textContent = totalInvestments;
  document.getElementById(
    'totalInvested'
  ).textContent = `$${totalInvested.toLocaleString()}`;
  document.getElementById('diversityScore').textContent = `${diversityScore}%`;
}

// Function to calculate diversity score (simplified version)
function calculateDiversityScore(investments) {
  const uniqueTypes = new Set(
    investments.map((inv) => inv.title.split(' ')[0])
  );
  return Math.round((uniqueTypes.size / investments.length) * 100);
}

// Function to view investment details
function viewDetails(investmentId) {
  showMessage(`Viewing details for investment: ${investmentId}`);
  // Implement investment details view
  window.location.href = `viewInvestmentDetails.html?id=${investmentId}`;
}

// Function to manage investment
function manageProperty(investmentId) {
  showMessage(`Opening management interface for investment: ${investmentId}`);
  // Implement investment management interface
}

// Initialize the page
function init() {
  loadInvestments();
  // Add event listeners and other initialization code here
}

// Run the initialization function when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);
