class DAOMemberManager {
  constructor() {
    this.governanceContract = null;
    this.tokenContract = null;
    this.web3 = null;
    this.currentAccount = null;
    this.isAdmin = false;

    // DOM Elements
    this.membersTableBody = document.getElementById('membersTableBody');
    this.adminControls = document.getElementById('adminControls');

    // Initialize the manager
    this.initialize();
  }

  /**
   * Initialize Web3 and contract connections
   * Sets up event listeners and loads initial data
   */
  async initialize() {
    try {
      console.log('🔄 Initializing DAO Member Manager...');

      if (typeof window.ethereum === 'undefined') {
        throw new Error(
          'MetaMask not detected. Please install MetaMask to use this application.'
        );
      }

      // Get network info and check chain
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      console.log('Current chain ID:', chainId);

      // Check if we're on the right network (Ganache = 1337)
      if (chainId !== '0x539') {
        // 0x539 is 1337 in hex
        console.log('Switching to Ganache network...');
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x539' }],
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: '0x539',
                    chainName: 'Ganache',
                    nativeToken: {
                      name: 'ETH',
                      symbol: 'ETH',
                      decimals: 18,
                    },
                    rpcUrls: ['http://127.0.0.1:7545'],
                  },
                ],
              });
            } catch (addError) {
              throw new Error('Failed to add Ganache network to MetaMask');
            }
          } else {
            throw switchError;
          }
        }
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      this.currentAccount = accounts[0];
      console.log('✅ Connected account:', this.currentAccount);

      // Initialize Web3
      window.web3 = new Web3(window.ethereum);
      this.web3 = window.web3;

      // Initialize contracts
      this.governanceContract = new this.web3.eth.Contract(
        CONFIG.GOVERNANCE_ABI,
        CONFIG.GOVERNANCE_ADDRESS
      );
      this.tokenContract = new this.web3.eth.Contract(
        CONFIG.GOVERNANCE_TOKEN_ABI,
        CONFIG.TOKEN_ADDRESS
      );
      console.log('✅ Contracts initialized');

      // Verify contract connections
      try {
        await this.governanceContract.methods.votingPeriod().call();
        await this.tokenContract.methods.name().call();
        console.log('✅ Contract connections verified');
      } catch (error) {
        throw new Error(
          'Failed to verify contract connections: ' + error.message
        );
      }

      try {
        await this.governanceContract.methods.votingPeriod().call();
        await this.tokenContract.methods.name().call();
        console.log('✅ Contract connections verified');

        // Add KYC role verification here
        const kycRole = await this.tokenContract.methods.KYC_ROLE().call();
        console.log('KYC Role:', kycRole);

        // Check if Governance contract has KYC role
        const govHasKycRole = await this.tokenContract.methods
          .hasRole(kycRole, this.governanceContract._address)
          .call();

        if (!govHasKycRole) {
          console.log('Granting KYC role to Governance contract...');
          await this.tokenContract.methods
            .grantRole(kycRole, this.governanceContract._address)
            .send({ from: this.currentAccount });
          console.log('✅ KYC role granted to Governance contract');
        } else {
          console.log('✅ Governance contract already has KYC role');
        }
      } catch (error) {
        throw new Error(
          'Failed to verify contract connections: ' + error.message
        );
      }

      // Check if current user is admin
      const adminRole = await this.governanceContract.methods
        .ADMIN_ROLE()
        .call();
      this.isAdmin = await this.governanceContract.methods
        .hasRole(adminRole, this.currentAccount)
        .call();

      // Show/hide admin controls
      this.adminControls.style.display = this.isAdmin ? 'block' : 'none';

      // Set up event listeners
      this.setupEventListeners();

      // Load initial data
      await this.loadMembers();

      console.log('DAO Member Manager initialized successfully');
    } catch (error) {
      console.error('Initialization error:', error);
      alert('Failed to initialize: ' + error.message);
    }
  }

  /**
   * Set up all event listeners for the interface
   */
  setupEventListeners() {
    // Add member form submission
    document
      .getElementById('submitAddMember')
      .addEventListener('click', () => this.addMember());

    // Admin control buttons
    document
      .getElementById('grantAdminRole')
      .addEventListener('click', () => this.grantAdminRole());
    document
      .getElementById('revokeAdminRole')
      .addEventListener('click', () => this.revokeAdminRole());
    document
      .getElementById('updateQuorum')
      .addEventListener('click', () => this.updateQuorumPercentage());

    // Refresh button
    document
      .getElementById('refreshMembers')
      .addEventListener('click', () => this.loadMembers());

    // Add listener for update member button
    document
      .getElementById('updateMemberBtn')
      .addEventListener('click', () => this.updateMember());

    // Add listener for remove member button
    document.getElementById('removeMemberBtn').addEventListener('click', () => {
      const address = document.getElementById('manageMemberAddress').value;
      this.removeMember(address);
    });

    // Contract event listeners
    this.setupContractEventListeners();
  }

  /**
   * Set up blockchain event listeners
   */
  setupContractEventListeners() {
    // Member added event
    this.governanceContract.events
      .MemberAdded()
      .on('data', (event) => {
        console.log('Member added:', event.returnValues);
        this.loadMembers(); // Refresh the list
      })
      .on('error', (error) =>
        console.error('Member added event error:', error)
      );

    // Member removed event
    this.governanceContract.events
      .MemberRemoved()
      .on('data', (event) => {
        console.log('Member removed:', event.returnValues);
        this.loadMembers(); // Refresh the list
      })
      .on('error', (error) =>
        console.error('Member removed event error:', error)
      );

    // KYC status updated event
    this.governanceContract.events
      .KYCStatusUpdated()
      .on('data', (event) => {
        console.log('KYC status updated:', event.returnValues);
        this.loadMembers(); // Refresh the list
      })
      .on('error', (error) => console.error('KYC status event error:', error));
  }

  /**
   * Load and display all members
   */
  async loadMembers() {
    try {
      this.membersTableBody.innerHTML = ''; // Clear existing entries
      let memberCount = 0;

      // Keep fetching members until we hit an error (indicating end of list)
      while (true) {
        try {
          const memberAddress = await this.governanceContract.methods
            .memberList(memberCount)
            .call();
          const memberInfo = await this.governanceContract.methods
            .members(memberAddress)
            .call();
          const delegateInfo = await this.governanceContract.methods
            .delegates(memberAddress)
            .call();

          this.addMemberToTable({
            address: memberAddress,
            ...memberInfo,
            delegatedTo: delegateInfo,
          });

          memberCount++;
        } catch (e) {
          break; // End of list reached
        }
      }
    } catch (error) {
      console.error('Error loading members:', error);
      alert('Failed to load members: ' + error.message);
    }
  }

  /**
   * Add a member row to the table
   * @param {Object} member Member information
   */
  async addMemberToTable(member) {
    try {
      // Check if member is admin
      const adminRole = await this.governanceContract.methods
        .ADMIN_ROLE()
        .call();
      const isAdmin = await this.governanceContract.methods
        .hasRole(adminRole, member.address)
        .call();

      const row = document.createElement('tr');
      row.innerHTML = `
            <td>${member.address}</td>
            <td>${this.web3.utils.fromWei(member.votingPower, 'ether')} ETH</td>
            <td>${member.hasPassedKYC ? 'Approved' : 'Pending'}</td>
            <td>${member.isApproved ? 'Yes' : 'No'}</td>
            <td>${
              member.delegatedTo ===
              '0x0000000000000000000000000000000000000000'
                ? 'None'
                : member.delegatedTo
            }</td>
            <td>${
              isAdmin ? '<span class="badge bg-primary">Admin</span>' : 'No'
            }</td>
            <td>
                ${
                  this.isAdmin
                    ? `
                    <button class="btn btn-sm btn-primary me-2" onclick="daoManager.manageMember('${member.address}')">
                        Manage
                    </button>
                `
                    : ''
                }
                <button class="btn btn-sm btn-info" onclick="daoManager.viewMemberDetails('${
                  member.address
                }')">
                    Details
                </button>
            </td>
        `;
      this.membersTableBody.appendChild(row);
    } catch (error) {
      console.error('Error adding member to table:', error);
    }
  }

  /**
   * Add a new member
   */
  async addMember() {
    if (!this.isAdmin) {
      alert('Only admins can add members');
      return;
    }

    try {
      const address = document.getElementById('memberAddress').value;
      const votingPower = document.getElementById('votingPower').value;

      if (!this.web3.utils.isAddress(address)) {
        throw new Error('Invalid Ethereum address');
      }

      await this.governanceContract.methods
        .addMember(address, this.web3.utils.toWei(votingPower, 'ether'))
        .send({ from: this.currentAccount });

      $('#addMemberModal').modal('hide');
      await this.loadMembers();
    } catch (error) {
      console.error('Error adding member:', error);
      alert('Failed to add member: ' + error.message);
    }
  }

  /**
   * Open the manage member modal
   * @param {string} address Member's address
   */
  async manageMember(address) {
    try {
      const memberInfo = await this.governanceContract.methods
        .members(address)
        .call();

      // Populate modal fields
      document.getElementById('manageMemberAddress').value = address;
      document.getElementById('updateVotingPower').value =
        this.web3.utils.fromWei(memberInfo.votingPower, 'ether');
      document.getElementById('kycStatus').checked = memberInfo.hasPassedKYC;

      // Show modal
      $('#manageMemberModal').modal('show');
    } catch (error) {
      console.error('Error loading member details:', error);
      alert('Failed to load member details: ' + error.message);
    }
  }

  /**
   * Update member details
   */
  async updateMember() {
    try {
      const address = document.getElementById('manageMemberAddress').value;
      const newVotingPower = document.getElementById('updateVotingPower').value;
      const newKYCStatus = document.getElementById('kycStatus').checked;

      console.log('Starting member update process...', {
        updater: this.currentAccount,
        memberToUpdate: address,
        newVotingPower,
        newKYCStatus,
      });

      // 1. Check permissions
      const adminRole = await this.governanceContract.methods
        .ADMIN_ROLE()
        .call();
      const kycRole = await this.tokenContract.methods.KYC_ROLE().call(); // Changed to tokenContract

      console.log('Roles:', { adminRole, kycRole });

      const [isAdmin, hasKycRole] = await Promise.all([
        this.governanceContract.methods
          .hasRole(adminRole, this.currentAccount)
          .call(),
        this.tokenContract.methods.hasRole(kycRole, this.currentAccount).call(), // Changed to tokenContract
      ]);

      console.log('Permission check:', {
        isAdmin,
        hasKycRole,
      });

      if (!isAdmin) {
        throw new Error('Current user does not have admin rights');
      }

      if (!hasKycRole && newKYCStatus !== undefined) {
        throw new Error('Current user does not have KYC management rights');
      }

      // 2. Get current member info
      const currentMemberInfo = await this.governanceContract.methods
        .members(address)
        .call();
      console.log('Current member info:', currentMemberInfo);

      // 3. Update KYC status if changed and have permission
      if (currentMemberInfo.hasPassedKYC !== newKYCStatus && hasKycRole) {
        console.log('Attempting KYC status update...');

        try {
          // Check if Governance contract has KYC role
          const govHasKycRole = await this.tokenContract.methods
            .hasRole(kycRole, this.governanceContract._address)
            .call();

          if (!govHasKycRole) {
            console.log('Granting KYC role to Governance contract...');
            await this.tokenContract.methods
              .grantRole(kycRole, this.governanceContract._address)
              .send({ from: this.currentAccount });
          }

          // Update KYC status
          console.log('Sending KYC update transaction...');
          const receipt = await this.governanceContract.methods
            .updateKYCStatus(address, newKYCStatus)
            .send({ from: this.currentAccount });

          console.log('KYC update successful, receipt:', receipt);
        } catch (txError) {
          console.error('Detailed transaction error:', txError);
          throw new Error(`KYC update failed: ${txError.message}`);
        }
      }

      // 4. Update voting power if changed
      const currentVotingPower = this.web3.utils.fromWei(
        currentMemberInfo.votingPower,
        'ether'
      );
      if (currentVotingPower !== newVotingPower) {
        console.log('Updating voting power...');
        await this.governanceContract.methods
          .setMemberVotingPower(
            address,
            this.web3.utils.toWei(newVotingPower, 'ether')
          )
          .send({ from: this.currentAccount });
      }

      // 5. Close modal and refresh
      const modal = bootstrap.Modal.getInstance(
        document.getElementById('manageMemberModal')
      );
      modal.hide();
      await this.loadMembers();

      console.log('Member update completed successfully');
      alert('Member updated successfully');
    } catch (error) {
      console.error('Error updating member:', error);

      let errorMessage = 'Failed to update member: ';
      if (error.message.includes('KYC management rights')) {
        errorMessage = error.message;
      } else if (error.message.includes('revert')) {
        errorMessage +=
          'Transaction failed. Check your permissions and try again.';
      } else if (error.code === 4001) {
        errorMessage += 'Transaction rejected by user.';
      } else {
        errorMessage += error.message || 'Unknown error occurred';
      }

      alert(errorMessage);
    }
  }

  /**
   * Remove a member
   * @param {string} address Member's address
   */
  async removeMember(address) {
    if (confirm('Are you sure you want to remove this member?')) {
      try {
        await this.governanceContract.methods
          .removeMember(address)
          .send({ from: this.currentAccount });

        $('#manageMemberModal').modal('hide');
        await this.loadMembers();
      } catch (error) {
        console.error('Error removing member:', error);
        alert('Failed to remove member: ' + error.message);
      }
    }
  }

  /**
   * Update the quorum percentage
   */
  async updateQuorumPercentage() {
    try {
      const newQuorum = document.getElementById('quorumPercentage').value;
      if (newQuorum < 1 || newQuorum > 100) {
        throw new Error('Quorum must be between 1 and 100');
      }

      await this.governanceContract.methods
        .setQuorumPercentage(newQuorum)
        .send({ from: this.currentAccount });

      alert('Quorum percentage updated successfully');
    } catch (error) {
      console.error('Error updating quorum:', error);
      alert('Failed to update quorum: ' + error.message);
    }
  }

  /**
   * Grant admin role to an address
   */
  async grantAdminRole() {
    try {
      const address = document.getElementById('roleAddress').value;
      if (!this.web3.utils.isAddress(address)) {
        throw new Error('Invalid Ethereum address');
      }

      const adminRole = await this.governanceContract.methods
        .ADMIN_ROLE()
        .call();
      await this.governanceContract.methods
        .grantRole(adminRole, address)
        .send({ from: this.currentAccount });

      alert('Admin role granted successfully');
    } catch (error) {
      console.error('Error granting admin role:', error);
      alert('Failed to grant admin role: ' + error.message);
    }
  }

  /**
   * Revoke admin role from an address
   */
  async revokeAdminRole() {
    try {
      const address = document.getElementById('roleAddress').value;
      if (!this.web3.utils.isAddress(address)) {
        throw new Error('Invalid Ethereum address');
      }

      const adminRole = await this.governanceContract.methods
        .ADMIN_ROLE()
        .call();
      await this.governanceContract.methods
        .revokeRole(adminRole, address)
        .send({ from: this.currentAccount });

      alert('Admin role revoked successfully');
    } catch (error) {
      console.error('Error revoking admin role:', error);
      alert('Failed to revoke admin role: ' + error.message);
    }
  }
}

// Initialize the manager when the document is ready
document.addEventListener('DOMContentLoaded', () => {
  window.daoManager = new DAOMemberManager();
});
