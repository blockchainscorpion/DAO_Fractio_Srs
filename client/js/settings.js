// src/js/settings.js

// Function to load user profile information
function loadProfileInfo() {
  // This would typically be an API call to fetch user profile data
  const profile = {
    fullName: 'Edward Cooper',
    email: 'edward.cooper@example.com',
  };

  document.getElementById('fullName').value = profile.fullName;
  document.getElementById('email').value = profile.email;
}

// Function to update profile information
function updateProfile(event) {
  event.preventDefault();
  const fullName = document.getElementById('fullName').value;
  const email = document.getElementById('email').value;

  // This would typically be an API call to update user profile data
  console.log(`Updating profile: Name - ${fullName}, Email - ${email}`);
  alert('Profile updated successfully!');
}

// Function to change password
function changePassword(event) {
  event.preventDefault();
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (newPassword !== confirmPassword) {
    alert('New passwords do not match!');
    return;
  }

  // This would typically be an API call to change the user's password
  console.log('Changing password...');
  alert('Password changed successfully!');
}

// Function to update notification settings
function updateNotificationSettings(event) {
  event.preventDefault();
  const emailNotifications =
    document.getElementById('emailNotifications').checked;
  const smsNotifications = document.getElementById('smsNotifications').checked;

  // This would typically be an API call to update notification settings
  console.log(
    `Updating notifications: Email - ${emailNotifications}, SMS - ${smsNotifications}`
  );
  alert('Notification settings updated successfully!');
}

// Function to load connected accounts
function loadConnectedAccounts() {
  // This would typically be an API call to fetch connected accounts
  const accounts = [
    { type: 'Ethereum', address: '0x1234...5678' },
    { type: 'Bitcoin', address: 'bc1qxy...zx88' },
  ];

  const connectedAccountsDiv = document.getElementById('connectedAccounts');
  accounts.forEach((account) => {
    const accountDiv = document.createElement('div');
    accountDiv.className = 'connected-account';
    accountDiv.innerHTML = `
            <span>${account.type}: ${account.address}</span>
            <button onclick="disconnectAccount('${account.type}')">Disconnect</button>
        `;
    connectedAccountsDiv.appendChild(accountDiv);
  });
}

// Function to connect a new wallet
function connectWallet() {
  // This would typically open a wallet connection interface
  alert('Opening wallet connection interface...');
}

// Function to disconnect an account
function disconnectAccount(accountType) {
  // This would typically be an API call to disconnect the account
  console.log(`Disconnecting ${accountType} account...`);
  alert(`${accountType} account disconnected successfully!`);
}

// Initialize the page
function init() {
  loadProfileInfo();
  loadConnectedAccounts();

  // Add event listeners
  document
    .getElementById('profileForm')
    .addEventListener('submit', updateProfile);
  document
    .getElementById('passwordForm')
    .addEventListener('submit', changePassword);
  document
    .getElementById('notificationForm')
    .addEventListener('submit', updateNotificationSettings);
  document
    .getElementById('connectWallet')
    .addEventListener('click', connectWallet);
}

// Run the initialization function when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);
