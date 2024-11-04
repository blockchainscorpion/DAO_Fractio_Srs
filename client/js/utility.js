export function showMessage(message, type = 'info') {
  const messageDiv = document.createElement('div');
  messageDiv.textContent = message;
  messageDiv.className = `message ${type}`;
  document.body.appendChild(messageDiv);

  setTimeout(() => {
    messageDiv.remove();
  }, 5000);
}

export function validateForm(form) {
  const inputs = form.querySelectorAll('input, select, textarea');
  let isValid = true;

  inputs.forEach((input) => {
    if (input.hasAttribute('required') && !input.value.trim()) {
      isValid = false;
      input.classList.add('error');
    } else {
      input.classList.remove('error');
    }
  });

  return isValid;
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}
