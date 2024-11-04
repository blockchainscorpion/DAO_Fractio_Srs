// src/js/newListings.js

// Array of new listings
const newListings = [
  {
    title: 'Eco Glamping Resort',
    price: 'Starting at $50 per token',
    description:
      'Exclusive camping grounds featuring luxury glamping pods, eco-friendly facilities, and breathtaking natural surroundings.',
    image:
      'https://plus.unsplash.com/premium_photo-1719610048269-68571825590c?q=80&w=2060&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
  {
    title: 'CBD Oil Processing Plant',
    price: 'Starting at $100 per token',
    description:
      'State-of-the-art CBD oil extraction and processing facility, positioned to capitalize on the growing wellness market.',
    image:
      'https://images.unsplash.com/photo-1631112086050-4ca0b7ac73f3?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
  {
    title: 'Spanish Mushroom Farm',
    price: 'Starting at $75 per token',
    description:
      'Innovative mushroom cultivation facility in Spain, leveraging ideal climate conditions and modern farming techniques.',
    image:
      'https://images.unsplash.com/photo-1542913235-1f46ce06443d?q=80&w=1978&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
];

// Function to create a listing card
function createListingCard(listing) {
  const card = document.createElement('div');
  card.className = 'listing-card';

  card.innerHTML = `
        <img src="${listing.image}" alt="${listing.title}" class="listing-image">
        <div class="listing-details">
            <div class="listing-title">${listing.title}</div>
            <div class="listing-price">${listing.price}</div>
            <div class="listing-description">${listing.description}</div>
            <div class="listing-actions">
                <button class="action-button" onclick="investNow('${listing.id}')">Invest Now</button>
                <button class="action-button secondary" onclick="viewDetails('${listing.id}')">Learn More</button>
            </div>
        </div>
    `;

  return card;
}

// Function to load new listings
function loadNewListings() {
  const listingsGrid = document.getElementById('listingsGrid');
  newListings.forEach((listing) => {
    const card = createListingCard(listing);
    listingsGrid.appendChild(card);
  });
}

// Function to handle invest now action
function investNow(listingId) {
  // Nave to invest now page
  window.location.href = `investNow.html?id=${listingId}`;
}

// Function to handle learn more action
function viewDetails(listingId) {
  // Nav to view more page
  window.location.href = `viewMore.html?id=${listingId}`;
}

// Initialize the page
function init() {
  loadNewListings();

  // Add interactivity to sidebar items
  document.querySelectorAll('.sidebar-item').forEach((item) => {
    item.addEventListener('click', function () {
      document
        .querySelectorAll('.sidebar-item')
        .forEach((i) => i.classList.remove('active'));
      this.classList.add('active');
      if (this.textContent !== 'New listings') {
        alert(
          `Navigating to ${this.textContent}... This feature is coming soon!`
        );
      }
    });
  });
}

// Run the initialization function when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);
