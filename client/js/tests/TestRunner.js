/**
 * TestRunner class handles test execution and reporting
 */
class TestRunner {
  constructor() {
    this.tests = [];
    this.currentTest = null;
    this.results = [];
  }

  /**
   * Add a test to the queue
   * @param {string} name Test name
   * @param {Function} testFn Test function
   */
  addTest(name, testFn) {
    this.tests.push({ name, testFn });
  }

  /**
   * Update UI with current test status
   * @param {string} testName Name of current test
   * @param {string} status Test status
   */
  updateTestStatus(testName, status) {
    const currentTest = document.getElementById('currentTest');
    if (currentTest) {
      currentTest.textContent = `${testName}: ${status}`;
      currentTest.style.display = 'block';
    }
  }

  /**
   * Add test result to UI
   * @param {string} name Test name
   * @param {boolean} passed Test result
   * @param {string} error Error message if any
   */
  addTestResult(name, passed, error = '') {
    const resultDiv = document.createElement('div');
    resultDiv.className = `test-result ${passed ? 'pass' : 'fail'}`;
    resultDiv.innerHTML = `
            <strong>${name}:</strong> ${passed ? 'Passed' : 'Failed'}
            ${error ? `<br><small>Error: ${error}</small>` : ''}
        `;
    document.getElementById('testResults').appendChild(resultDiv);
  }

  /**
   * Display test summary in UI
   * @param {Object} report Test report object
   */
  displaySummary(report) {
    const summaryDiv = document.getElementById('summary');
    if (summaryDiv) {
      summaryDiv.innerHTML = `
                <div class="test-status ${
                  report.failedTests === 0 ? 'success' : 'error'
                }">
                    Total Tests: ${report.totalTests}<br>
                    Passed: ${report.passedTests}<br>
                    Failed: ${report.failedTests}
                </div>
            `;
    }
  }

  /**
   * Run all queued tests
   * @returns {Promise<Object>} Test results
   */
  async runTests() {
    const button = document.getElementById('runTests');
    if (button) button.disabled = true;

    try {
      // Clear previous results
      const resultsDiv = document.getElementById('testResults');
      if (resultsDiv) resultsDiv.innerHTML = '';

      const summaryDiv = document.getElementById('summary');
      if (summaryDiv) summaryDiv.innerHTML = '';

      // Initialize DAO tester
      const tester = new DAOTester();

      // Run initialization test first
      this.updateTestStatus('Initialization', 'Running');
      await this.runTest('Initialization', () => tester.initialize());

      // Run remaining tests
      for (const test of this.tests) {
        this.updateTestStatus(test.name, 'Running');
        await this.runTest(test.name, test.testFn.bind(null, tester));
      }

      // Display final results
      const report = {
        totalTests: this.results.length,
        passedTests: this.results.filter((r) => r.passed).length,
        failedTests: this.results.filter((r) => !r.passed).length,
        results: this.results,
      };

      this.displaySummary(report);
      return report;
    } catch (error) {
      console.error('Test suite failed:', error);
      this.displaySummary({
        totalTests: this.results.length,
        passedTests: this.results.filter((r) => r.passed).length,
        failedTests: this.results.filter((r) => !r.passed).length + 1,
        results: [
          ...this.results,
          { name: 'Test Suite', passed: false, error: error.message },
        ],
      });
    } finally {
      if (button) button.disabled = false;
    }
  }

  /**
   * Run a single test
   * @param {string} name Test name
   * @param {Function} testFn Test function
   */
  async runTest(name, testFn) {
    try {
      await testFn();
      this.results.push({ name, passed: true });
      this.addTestResult(name, true);
    } catch (error) {
      console.error(`Test '${name}' failed:`, error);
      this.results.push({ name, passed: false, error: error.message });
      this.addTestResult(name, false, error.message);
      throw error;
    }
  }
}

// Make TestRunner available globally
window.TestRunner = TestRunner;
