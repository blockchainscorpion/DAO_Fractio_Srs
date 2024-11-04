// src/js/viewMore.js

const propertyDetails = {
  title: 'CBD Oil Processing Plant',
  price: 'Starting at $100 per token',
  description:
    'This state-of-the-art CBD oil extraction and processing facility is strategically positioned to capitalize on the rapidly growing wellness market. With cutting-edge technology and a prime location, this plant offers a unique opportunity to invest in the booming CBD industry.',
  image: 'https://fractio.io/cbd-processing-plant.jpg',
  keyFeatures: [
    'Advanced CO2 extraction technology for high-quality CBD oil production',
    'Fully automated processing lines for efficiency and consistency',
    'ISO-certified clean rooms for pharmaceutical-grade product quality',
    'On-site laboratory for rigorous quality control and R&D',
    'Scalable production capacity to meet growing market demand',
    'Sustainable practices including water reclamation and solar energy integration',
    'Established partnerships with local hemp farmers for reliable raw material supply',
  ],
  marketOpportunity:
    'The CBD market is projected to reach $47.22 billion globally by 2028, with a CAGR of 21.3% from 2021 to 2028. This facility is well-positioned to meet the increasing demand for high-quality CBD products in various sectors including pharmaceuticals, cosmetics, and food & beverages.',
  location:
    'Situated in a hemp-friendly state with favorable regulations, the plant benefits from proximity to major transportation hubs, ensuring efficient distribution across North America. The location also provides access to a skilled workforce familiar with agricultural processing and biotechnology.',
  investmentStats: [
    { label: 'Total Facility Value', value: '$50,000,000' },
    { label: 'Tokenization Amount', value: '70%' },
    { label: 'Total Tokens', value: '350,000' },
    { label: 'Token Price', value: '$100' },
    { label: 'Minimum Investment', value: '5 tokens' },
    { label: 'Projected Annual ROI', value: '15-20%' },
    { label: 'Current Production Capacity', value: '5,000 kg/month' },
  ],
  tokenBenefits: [
    'Quarterly profit sharing based on facility performance',
    'Voting rights on major operational decisions',
    'Priority access to new product lines',
    'Annual facility tour and stakeholder meeting',
  ],
};

function populatePropertyDetails() {
  document.getElementById('propertyTitle').textContent = propertyDetails.title;
  document.getElementById('propertyPrice').textContent = propertyDetails.price;
  document.getElementById('propertyImage').src = propertyDetails.image;
  document.getElementById('propertyDescription').textContent =
    propertyDetails.description;

  const keyFeaturesList = document.getElementById('keyFeatures');
  propertyDetails.keyFeatures.forEach((feature) => {
    const li = document.createElement('li');
    li.textContent = feature;
    keyFeaturesList.appendChild(li);
  });

  document.getElementById('marketOpportunity').textContent =
    propertyDetails.marketOpportunity;
  document.getElementById('locationDetails').textContent =
    propertyDetails.location;

  const investmentStatsList = document.getElementById('investmentStats');
  propertyDetails.investmentStats.forEach((stat) => {
    const div = document.createElement('div');
    div.className = 'stat-item';
    div.textContent = `${stat.label}: ${stat.value}`;
    investmentStatsList.appendChild(div);
  });

  const tokenBenefitsList = document.getElementById('tokenBenefits');
  propertyDetails.tokenBenefits.forEach((benefit) => {
    const li = document.createElement('li');
    li.textContent = benefit;
    tokenBenefitsList.appendChild(li);
  });
}

function investNow() {
  window.location.href = 'investNow.html';
}

function init() {
  populatePropertyDetails();
  document.getElementById('investNow').addEventListener('click', investNow);
}

document.addEventListener('DOMContentLoaded', init);
