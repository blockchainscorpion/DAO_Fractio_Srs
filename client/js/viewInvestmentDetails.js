// Mock data for the investment details
const investmentDetails = {
  id: 'hmo-manchester',
  title: 'HMO Property in Manchester',
  status: 'Active',
  image: 'https://fractio.io/hmo-manchester.jpg',
  description:
    'A high-yield House in Multiple Occupation (HMO) property located in a prime area of Manchester, catering to young professionals and students.',
  keyFeatures: [
    '6 bedroom HMO property',
    'Fully renovated and furnished',
    'High-speed internet and smart home features',
    'Excellent location near universities and business districts',
    'Strong rental demand in the area',
  ],
  performance:
    'This property has consistently delivered a 8.5% annual yield since its acquisition two years ago. Occupancy rates have remained above 95% throughout this period.',
  location:
    'Situated in the heart of Manchester, this property benefits from excellent transport links and proximity to major universities and employment centers.',
  investmentStats: [
    { label: 'Property Value', value: '£450,000' },
    { label: 'Total Tokenization', value: '80%' },
    { label: 'Total Tokens', value: '3,600' },
    { label: 'Token Price', value: '£100' },
    { label: 'Projected Annual ROI', value: '8-10%' },
  ],
  yourInvestment: [
    { label: 'Your Tokens', value: '50' },
    { label: 'Investment Value', value: '£5,000' },
    { label: 'Ownership Percentage', value: '1.39%' },
    { label: "Last Year's Returns", value: '£425' },
  ],
};

function populateInvestmentDetails() {
  if (!investmentDetails) {
    console.error('Investment details not found');
    document.getElementById('investmentTitle').textContent =
      'Investment Not Found';
    return;
  }

  document.getElementById('investmentTitle').textContent =
    investmentDetails.title;
  document.getElementById(
    'investmentStatus'
  ).textContent = `Status: ${investmentDetails.status}`;
  document.getElementById('investmentImage').src = investmentDetails.image;
  document.getElementById('investmentDescription').textContent =
    investmentDetails.description;

  const keyFeaturesList = document.getElementById('keyFeatures');
  investmentDetails.keyFeatures.forEach((feature) => {
    const li = document.createElement('li');
    li.textContent = feature;
    keyFeaturesList.appendChild(li);
  });

  document.getElementById('performanceDetails').textContent =
    investmentDetails.performance;
  document.getElementById('locationDetails').textContent =
    investmentDetails.location;

  const investmentStatsList = document.getElementById('investmentStats');
  investmentDetails.investmentStats.forEach((stat) => {
    const div = document.createElement('div');
    div.className = 'stat-item';
    div.innerHTML = `<span>${stat.label}:</span> <span>${stat.value}</span>`;
    investmentStatsList.appendChild(div);
  });

  const yourInvestmentList = document.getElementById('yourInvestment');
  investmentDetails.yourInvestment.forEach((item) => {
    const div = document.createElement('div');
    div.className = 'stat-item';
    div.innerHTML = `<span>${item.label}:</span> <span>${item.value}</span>`;
    yourInvestmentList.appendChild(div);
  });
}

function getInvestmentIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('id');
}

function manageInvestment() {
  const investmentId = getInvestmentIdFromUrl();
  window.location.href = `manageInvestment.html?id=${investmentDetails.id}`;
}

function init() {
  const investmentId = getInvestmentIdFromUrl();
  console.log(`Fetching details for investment ID: ${investmentId}`);

  // In the real app, we'll fetch the details based on this ID
  populateInvestmentDetails();
  document
    .getElementById('manageInvestment')
    .addEventListener('click', manageInvestment);
}

document.addEventListener('DOMContentLoaded', init);
