// Mock data for the investment details
const investmentDetails = {
  id: 'hmo-manchester',
  title: 'HMO Property in Manchester',
  status: 'Active',
  yourInvestment: '$5,000',
  totalPropertyValue: '$500,000',
  annualYield: '7.5%',
  occupancyRate: '95%',
  performanceData: [
    { month: 'Jan', value: 5000 },
    { month: 'Feb', value: 5200 },
    { month: 'Mar', value: 5150 },
    { month: 'Apr', value: 5300 },
    { month: 'May', value: 5400 },
    { month: 'Jun', value: 5350 },
  ],
};

function populateInvestmentDetails() {
  document.getElementById('propertyTitle').textContent =
    investmentDetails.title;
  document.getElementById('propertyStatus').textContent =
    investmentDetails.status;
  document.getElementById('yourInvestment').textContent =
    investmentDetails.yourInvestment;
  document.getElementById('totalPropertyValue').textContent =
    investmentDetails.totalPropertyValue;
  document.getElementById('annualYield').textContent =
    investmentDetails.annualYield;
  document.getElementById('occupancyRate').textContent =
    investmentDetails.occupancyRate;
}

function createPerformanceChart() {
  const chartContainer = document.getElementById('chart');
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '200');
  svg.setAttribute('viewBox', '0 0 600 200');

  const maxValue = Math.max(
    ...investmentDetails.performanceData.map((d) => d.value)
  );
  const xScale = 600 / (investmentDetails.performanceData.length - 1);
  const yScale = 180 / maxValue;

  let path = `M0,${200 - investmentDetails.performanceData[0].value * yScale}`;
  investmentDetails.performanceData.forEach((d, i) => {
    path += ` L${i * xScale},${200 - d.value * yScale}`;
  });

  const pathElement = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'path'
  );
  pathElement.setAttribute('d', path);
  pathElement.setAttribute('fill', 'none');
  pathElement.setAttribute('stroke', '#3366ff');
  pathElement.setAttribute('stroke-width', '2');

  svg.appendChild(pathElement);
  chartContainer.appendChild(svg);
}

function viewFinancials() {
  alert('Viewing financials...');
  // Implement financial view logic
}

function manageOccupancy() {
  alert('Managing occupancy...');
  // Implement occupancy management logic
}

function scheduleMaintenance() {
  alert('Scheduling maintenance...');
  // Implement maintenance scheduling logic
}

function adjustInvestment() {
  alert('Adjusting investment...');
  // Implement investment adjustment logic
}

function init() {
  populateInvestmentDetails();
  createPerformanceChart();

  document
    .getElementById('viewFinancials')
    .addEventListener('click', viewFinancials);
  document
    .getElementById('manageOccupancy')
    .addEventListener('click', manageOccupancy);
  document
    .getElementById('scheduleMaintenance')
    .addEventListener('click', scheduleMaintenance);
  document
    .getElementById('adjustInvestment')
    .addEventListener('click', adjustInvestment);
}

document.addEventListener('DOMContentLoaded', init);
