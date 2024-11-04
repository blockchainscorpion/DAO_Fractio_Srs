// scripts/test-frontend.js
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const execAsync = promisify(exec);

async function testFrontend() {
  try {
    console.log('🚀 Starting frontend integration test...');

    // 1. Start local blockchain if not running
    console.log('\n📦 Starting local blockchain...');
    const ganacheProcess = exec('ganache --port 7545');
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 2. Deploy contracts
    console.log('\n📄 Deploying contracts...');
    await execAsync('truffle migrate --reset');

    // 3. Generate config
    console.log('\n⚙️ Generating frontend config...');
    await execAsync('node scripts/generate-config.js');

    // 4. Start local server for frontend
    console.log('\n🌐 Starting local server...');
    const serverProcess = exec('python -m http.server 8080');
    console.log('Frontend available at http://localhost:8080');

    // 5. Open the browser (if on macOS)
    if (process.platform === 'darwin') {
      await execAsync('open http://localhost:8080/DAO.html');
    } else {
      console.log('Please open http://localhost:8080/DAO.html in your browser');
    }

    console.log('\n✅ Test environment ready!');
    console.log('\nPress Ctrl+C to stop the test environment');

    // Keep the process running
    process.stdin.resume();

    // Cleanup on exit
    process.on('SIGINT', () => {
      console.log('\n🧹 Cleaning up...');
      ganacheProcess.kill();
      serverProcess.kill();
      process.exit();
    });
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the test
testFrontend();
