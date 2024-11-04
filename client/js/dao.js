// src/js/dao.js

import { showMessage } from './utility.js';

// Mock database for proposals
let proposals = [
  {
    id: 1,
    title: 'Increase Quorum Percentage',
    description: 'Proposal to increase quorum percentage from 10% to 15%',
    forVotes: 750,
    againstVotes: 250,
  },
  {
    id: 2,
    title: 'Add New Investment Category',
    description:
      'Proposal to add commercial real estate as a new investment category',
    forVotes: 1000,
    againstVotes: 500,
  },
];

// Mock database for recent votes
let recentVotes = [
  {
    voter: '0x1234...5678',
    support: true,
    proposalTitle: 'Increase Quorum Percentage',
    time: '2 hours ago',
  },
  {
    voter: '0x9876...5432',
    support: false,
    proposalTitle: 'Add New Investment Category',
    time: '5 hours ago',
  },
];

// Mock user address (this would be replaced by actual user's wallet address)
const userAddress = '0xABCD...1234';

// Function to load DAO stats
function loadDAOStats() {
  const stats = {
    totalMembers: 1500,
    activeProposals: proposals.length,
    votingPower: 250,
    quorumPercentage: 10,
  };

  document.getElementById('totalMembers').textContent = stats.totalMembers;
  document.getElementById('activeProposals').textContent =
    stats.activeProposals;
  document.getElementById('votingPower').textContent = stats.votingPower;
  document.getElementById('quorumPercentage').textContent =
    stats.quorumPercentage + '%';
}

// Function to create a proposal item
function createProposalItem(proposal) {
  const item = document.createElement('div');
  item.className = 'proposal-item';

  item.innerHTML = `
    <h3>${proposal.title}</h3>
    <p>${proposal.description}</p>
    <div class="proposal-stats">
      <span>For: ${proposal.forVotes}</span>
      <span>Against: ${proposal.againstVotes}</span>
    </div>
    <div class="proposal-actions">
      <button onclick="vote(${proposal.id}, true)" class="btn btn-primary">Vote For</button>
      <button onclick="vote(${proposal.id}, false)" class="btn btn-secondary">Vote Against</button>
    </div>
  `;

  return item;
}

// Function to load active proposals
function loadActiveProposals() {
  const proposalsList = document.getElementById('proposalsList');
  proposalsList.innerHTML = '';
  proposals.forEach((proposal) => {
    const item = createProposalItem(proposal);
    proposalsList.appendChild(item);
  });
}

// Function to create a vote item
function createVoteItem(vote) {
  const item = document.createElement('div');
  item.className = 'vote-item';

  item.innerHTML = `
        <p><strong>${vote.voter}</strong> voted ${
    vote.support ? 'for' : 'against'
  } proposal "${vote.proposalTitle}"</p>
        <span class="vote-time">${vote.time}</span>
    `;

  return item;
}

// Function to load recent votes
function loadRecentVotes() {
  const votesList = document.getElementById('votesList');
  votesList.innerHTML = '';
  recentVotes.forEach((vote) => {
    const item = createVoteItem(vote);
    votesList.appendChild(item);
  });
}

// Function to add a new vote to recent votes
function addRecentVote(proposalId, support) {
  const proposal = proposals.find((p) => p.id === proposalId);
  if (proposal) {
    const newVote = {
      voter: userAddress,
      support: support,
      proposalTitle: proposal.title,
      time: 'Just now',
    };
    recentVotes.unshift(newVote); // Add to the beginning of the array
    if (recentVotes.length > 5) {
      recentVotes.pop(); // Remove the oldest vote if we have more than 5
    }
    loadRecentVotes(); // Reload the recent votes display
  }
}

// Function to vote on a proposal
function vote(proposalId, support) {
  const proposal = proposals.find((p) => p.id === proposalId);
  if (proposal) {
    if (support) {
      proposal.forVotes += 1;
    } else {
      proposal.againstVotes += 1;
    }
    showMessage(
      `Voted ${support ? 'for' : 'against'} proposal ${proposalId}`,
      'success'
    );
    addRecentVote(proposalId, support); // Add the vote to recent votes
    loadActiveProposals(); // Reload proposals to reflect the new vote
  } else {
    showMessage(`Proposal ${proposalId} not found`, 'error');
  }
}

// Function to create a new proposal
function createProposal(event) {
  event.preventDefault();
  const title = document.getElementById('proposalTitle').value;
  const description = document.getElementById('proposalDescription').value;

  if (!title || !description) {
    showMessage('Please fill in all fields', 'error');
    return;
  }

  // Create new proposal and add it to the list
  const newProposal = {
    id: proposals.length + 1,
    title: title,
    description: description,
    forVotes: 0,
    againstVotes: 0,
  };
  proposals.push(newProposal);

  showMessage('Proposal created successfully', 'success');
  // Clear form fields
  document.getElementById('proposalTitle').value = '';
  document.getElementById('proposalDescription').value = '';
  // Reload proposals to include the new one
  loadActiveProposals();
  // Update DAO stats
  loadDAOStats();
}

// Function to delegate voting power
function delegateVotingPower(event) {
  event.preventDefault();
  const delegateAddress = document.getElementById('delegateAddress').value;

  if (!delegateAddress) {
    showMessage('Please enter a delegate address', 'error');
    return;
  }

  // This would typically be an API call to delegate voting power
  showMessage(`Delegated voting power to ${delegateAddress}`, 'success');
  // Clear form field
  document.getElementById('delegateAddress').value = '';
  // Reload DAO stats to reflect the new delegation
  loadDAOStats();
}

// Initialize the page
function init() {
  loadDAOStats();
  loadActiveProposals();
  loadRecentVotes();

  // Add event listeners
  document
    .getElementById('createProposalForm')
    .addEventListener('submit', createProposal);
  document
    .getElementById('delegateForm')
    .addEventListener('submit', delegateVotingPower);
}

// Run the initialization function when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);

// Make vote function globally available
window.vote = vote;
