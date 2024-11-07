// Function to create a property card
function createPropertyCard(property) {
  const card = document.createElement('div');
  card.className = 'property-card';

  card.innerHTML = `
        <img src="${property.image}" alt="${property.title}" class="property-image">
        <div class="property-info">
            <div class="property-title">${property.title}</div>
            <div class="property-price">Invest from ${property.price} USD</div>
            <div class="button-group">
                <button type="button" onclick="investNow('${property.id}')">Invest</button>
                <button type="button" onclick="viewDetails('${property.id}')">Details</button>
            </div>
        </div>
    `;

  return card;
}

// Function to load property data and populate the grid
function loadProperties() {
  const propertyGrid = document.getElementById('propertyGrid');
  properties.forEach((property) => {
    const card = createPropertyCard(property);
    propertyGrid.appendChild(card);
  });
}

// This would typically be an API call to fetch property data
// Mock property data (replace with API call in production)
const properties = [
  {
    id: 'prop1',
    title: 'HMO Property in Manchester',
    price: '5,000',
    image:
      'https://images.unsplash.com/photo-1580041029617-861657e9f349?q=80&w=1988&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
  {
    id: 'prop2',
    title: 'Organic Hemp Farm in Oregon',
    price: '10,000',
    image:
      'https://images.unsplash.com/photo-1631112086050-4ca0b7ac73f3?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
  {
    id: 'prop3',
    title: 'Downtown Apartment Complex',
    price: '15,000',
    image:
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=2070&ixlib=rb-4.0.3',
  },
  {
    id: 'prop4',
    title: 'Solar Farm Project',
    price: '20,000',
    image:
      'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=2072&ixlib=rb-4.0.3',
  },
  // Add more property objects as needed
];

// Function to handle the "Invest Now" button click
function investNow(propertyId) {
  window.location.href = `investNow.html?id=${propertyId}`;
}

// Function to handle the "Details" button click
function viewDetails(propertyId) {
  window.location.href = `viewMore.html?id=${propertyId}`;
}

// Initialize the page
function init() {
  loadProperties();
  // Add event listeners and other initialization code here
}

// Run the initialization function when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);
