class TestRunner {
  constructor() {
    this.tests = [];
    this.currentTest = null;
    this.results = [];
  }

  addTest(name, testFn) {
    console.log(`Adding test: ${name}`);
    this.tests.push({ name, testFn });
  }

  addTestResult(name, passed, error = '') {
    console.log(`Test Result - ${name}: ${passed ? 'PASSED' : 'FAILED'}`);
    if (error) console.log(`Error: ${error}`);

    const resultDiv = document.createElement('div');
    resultDiv.className = `test-result ${passed ? 'pass' : 'fail'}`;
    resultDiv.innerHTML = `
            <strong>${name}:</strong> ${passed ? 'Passed' : 'Failed'}
            ${error ? `<br><small>Error: ${error}</small>` : ''}
        `;

    const resultsContainer = document.getElementById('testResults');
    if (resultsContainer) {
      console.log(`Appending result to container for: ${name}`);
      resultsContainer.appendChild(resultDiv);
    } else {
      console.error('Results container not found!');
    }
  }

  displaySummary(report) {
    console.log('Displaying summary:', report);
    const summaryDiv = document.getElementById('summary');
    if (summaryDiv) {
      const summaryHtml = `
                <div class="test-status ${
                  report.failedTests === 0 ? 'success' : 'error'
                }">
                    <h3>Test Summary:</h3>
                    <p>Total Tests: ${report.totalTests}</p>
                    <p>Passed: ${report.passedTests}</p>
                    <p>Failed: ${report.failedTests}</p>
                </div>
            `;
      console.log('Setting summary HTML');
      summaryDiv.innerHTML = summaryHtml;
    } else {
      console.error('Summary container not found!');
    }
  }

  async runTests(event) {
    console.log('runTests called');
    if (event) {
      event.preventDefault();
    }

    // Immediately show that tests are starting
    const summaryDiv = document.getElementById('summary');
    if (summaryDiv) {
      summaryDiv.innerHTML = '<div class="test-status">Running tests...</div>';
    }

    console.log('Starting test run...');
    const button = document.getElementById('runTests');
    if (button) button.disabled = true;

    try {
      // Clear previous results
      const resultsDiv = document.getElementById('testResults');
      const summaryDiv = document.getElementById('summary');

      if (resultsDiv) {
        console.log('Clearing previous results');
        resultsDiv.innerHTML = '';
      }
      if (summaryDiv) {
        summaryDiv.innerHTML = '';
      }

      // Initialize and run tests
      console.log('Initializing DAO tester...');
      const tester = new DAOTester();

      console.log('Running initialization test...');
      await this.runTest('Initialization', () => tester.initialize());

      // Run remaining tests
      for (const test of this.tests) {
        console.log(`Running test: ${test.name}`);
        await this.runTest(test.name, test.testFn.bind(null, tester));
      }

      // Compile and display results
      const report = {
        totalTests: this.results.length,
        passedTests: this.results.filter((r) => r.passed).length,
        failedTests: this.results.filter((r) => !r.passed).length,
        results: this.results,
      };

      console.log('Final test report:', report);
      this.displaySummary(report);
    } catch (error) {
      console.error('Test suite failed:', error);
      this.displaySummary({
        totalTests: this.results.length,
        passedTests: this.results.filter((r) => r.passed).length,
        failedTests: this.results.filter((r) => !r.passed).length + 1,
        results: [
          ...this.results,
          {
            name: 'Test Suite',
            passed: false,
            error: error.message,
          },
        ],
      });
    } finally {
      if (button) {
        button.disabled = false;
      }
    }
  }

  async runTest(name, testFn) {
    console.log(`Executing test: ${name}`);
    try {
      await testFn();
      console.log(`Test passed: ${name}`);
      this.results.push({ name, passed: true });
      this.addTestResult(name, true);
    } catch (error) {
      console.error(`Test failed: ${name}`, error);
      this.results.push({ name, passed: false, error: error.message });
      this.addTestResult(name, false, error.message);
      throw error;
    }
  }
}

// Make TestRunner available globally
window.TestRunner = TestRunner;
