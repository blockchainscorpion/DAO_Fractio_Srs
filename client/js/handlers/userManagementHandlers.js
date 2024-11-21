import { Web3Setup } from '../modules/core/web3Setup.js';
import { ContractManager } from '../modules/core/contractManager.js';
import { EventManager } from '../modules/core/eventManager.js';
import { DAOManager } from '../modules/dao/daoManager.js';
import { UserManagement } from '../modules/dao/userManagement.js';

let userManager = null;
let debugInfo = null;

export async function initializeUserManagement() {
  try {
    debugInfo = document.getElementById('debugInfo');
    updateDebugInfo('Initializing user management...');

    const web3Setup = new Web3Setup();
    await web3Setup.initializeWeb3();

    const contractManager = new ContractManager(web3Setup.getWeb3Instance());
    const eventManager = new EventManager(contractManager);

    const daoManager = new DAOManager(
      web3Setup.getWeb3Instance(),
      contractManager,
      eventManager
    );
    userManager = new UserManagement(daoManager, contractManager);
    await userManager.initialize();

    setupUIHandlers();
    setupDebugPanel();
    await loadMembers();

    updateDebugInfo('User management initialized successfully');
    return true;
  } catch (error) {
    updateDebugInfo(`Initialization failed: ${error.message}`);
    return false;
  }
}

function setupUIHandlers() {
  // Add Member button
  document
    .querySelector('.btn-toolbar')
    ?.querySelector('button:first-child')
    ?.addEventListener('click', () => $('#addMemberModal').modal('show'));

  // Refresh List button
  document
    .querySelector('.btn-toolbar')
    ?.querySelector('button:nth-child(2)')
    ?.addEventListener('click', () => loadMembers());

  // Add Member form submission
  document
    .getElementById('submitAddMember')
    ?.addEventListener('click', handleAddMember);

  // Manage Member modal handlers
  document
    .getElementById('updateMemberBtn')
    ?.addEventListener('click', handleUpdateMember);
  document
    .getElementById('removeMemberBtn')
    ?.addEventListener('click', handleRemoveMember);
}

function setupDebugPanel() {
  // Debug panel buttons
  document
    .querySelector('.debug-section .btn-group')
    ?.addEventListener('click', (e) => {
      if (e.target.textContent.includes('Reload')) {
        location.reload();
      } else if (e.target.textContent.includes('Initialize')) {
        initializeUserManagement();
      } else if (e.target.textContent.includes('Check')) {
        checkCurrentPermissions();
      }
    });

  // Test Runner
  document.getElementById('testControls')?.addEventListener('click', runTests);
}

async function loadMembers() {
  try {
    updateDebugInfo('Loading members...');
    const membersTableBody = document.querySelector('.card-body table tbody');
    if (!membersTableBody) {
      throw new Error('Members table not found');
    }

    membersTableBody.innerHTML = ''; // Clear existing entries
    let memberCount = 0;

    while (true) {
      try {
        const memberAddress =
          await userManager.daoManager.governanceContract.methods
            .memberList(memberCount)
            .call();

        const memberInfo = await userManager.getMemberDetails(memberAddress);
        const delegateInfo =
          await userManager.daoManager.governanceContract.methods
            .delegates(memberAddress)
            .call();

        const row = createMemberRow({
          address: memberAddress,
          ...memberInfo,
          delegatedTo: delegateInfo,
        });

        membersTableBody.appendChild(row);
        memberCount++;
      } catch (e) {
        break;
      }
    }

    updateDebugInfo(`Loaded ${memberCount} members successfully`);
  } catch (error) {
    updateDebugInfo(`Error loading members: ${error.message}`);
  }
}

// Function to create member row
function createMemberRow(member) {
  const row = document.createElement('tr');
  const web3 = userManager.daoManager.web3;
  row.innerHTML = `
        <td>${member.address}</td>
        <td>${web3.utils.fromWei(member.votingPower, 'ether')} ETH</td>
        <td>${member.hasPassedKYC ? 'Approved' : 'Pending'}</td>
        <td>${member.isApproved ? 'Yes' : 'No'}</td>
        <td>${
          member.delegatedTo === '0x0000000000000000000000000000000000000000'
            ? 'None'
            : member.delegatedTo
        }</td>
        <td>${
          member.isAdmin ? '<span class="badge bg-primary">Admin</span>' : 'No'
        }</td>
        <td>
            <button class="btn btn-sm btn-primary me-2" onclick="manageMember('${
              member.address
            }')">
                Manage
            </button>
            <button class="btn btn-sm btn-info" onclick="viewMemberDetails('${
              member.address
            }')">
                Details
            </button>
        </td>
    `;
  return row;
}

async function handleAddMember(event) {
  event.preventDefault();
  try {
    const address = document.getElementById('memberAddress').value;
    const votingPower = document.getElementById('votingPower').value;

    updateDebugInfo(`Adding member ${address}...`);
    await userManager.addMember(
      address,
      web3.utils.toWei(votingPower, 'ether'),
      {
        from: await userManager.daoManager.getCurrentAccount(),
      }
    );

    $('#addMemberModal').modal('hide');
    await loadMembers();
    updateDebugInfo(`Member ${address} added successfully`);
  } catch (error) {
    updateDebugInfo(`Failed to add member: ${error.message}`);
  }
}

async function handleUpdateMember() {
  try {
    const address = document.getElementById('manageMemberAddress').value;
    const newVotingPower = document.getElementById('updateVotingPower').value;
    const newKYCStatus = document.getElementById('kycStatus').checked;

    updateDebugInfo(`Updating member ${address}...`);
    await userManager.updateKYCStatus(address, newKYCStatus, {
      from: await userManager.daoManager.getCurrentAccount(),
    });

    $('#manageMemberModal').modal('hide');
    await loadMembers();
    updateDebugInfo(`Member ${address} updated successfully`);
  } catch (error) {
    updateDebugInfo(`Failed to update member: ${error.message}`);
  }
}

async function handleRemoveMember() {
  try {
    const address = document.getElementById('manageMemberAddress').value;

    if (confirm('Are you sure you want to remove this member?')) {
      updateDebugInfo(`Removing member ${address}...`);
      await userManager.removeMember(address, {
        from: await userManager.daoManager.getCurrentAccount(),
      });

      $('#manageMemberModal').modal('hide');
      await loadMembers();
      updateDebugInfo(`Member ${address} removed successfully`);
    }
  } catch (error) {
    updateDebugInfo(`Failed to remove member: ${error.message}`);
  }
}

async function checkCurrentPermissions() {
  try {
    const account = await userManager.daoManager.getCurrentAccount();
    const isAdmin = await userManager.checkAdminPermission(account);
    updateDebugInfo(
      `Current account: ${account}\nAdmin permissions: ${isAdmin}`
    );
  } catch (error) {
    updateDebugInfo(`Failed to check permissions: ${error.message}`);
  }
}

async function runTests() {
  updateDebugInfo('Running tests...');
  // Implement test runner functionality
}

function updateDebugInfo(message) {
  if (debugInfo) {
    debugInfo.textContent = `${new Date().toLocaleTimeString()} - ${message}`;
  }
  console.log(message);
}

// Make functions globally available
window.manageMember = async (address) => {
  try {
    const memberInfo = await userManager.getMemberDetails(address);
    document.getElementById('manageMemberAddress').value = address;
    document.getElementById('updateVotingPower').value = web3.utils.fromWei(
      memberInfo.votingPower,
      'ether'
    );
    document.getElementById('kycStatus').checked = memberInfo.hasPassedKYC;
    $('#manageMemberModal').modal('show');
  } catch (error) {
    updateDebugInfo(`Failed to load member details: ${error.message}`);
  }
};

window.viewMemberDetails = async (address) => {
  try {
    const memberInfo = await userManager.getMemberDetails(address);
    updateDebugInfo(
      `Member details for ${address}:\n${JSON.stringify(memberInfo, null, 2)}`
    );
  } catch (error) {
    updateDebugInfo(`Failed to view member details: ${error.message}`);
  }
};
