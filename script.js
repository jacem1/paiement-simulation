document.getElementById('paymentForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const transaction = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        cardNumber: document.getElementById('cardNumber').value,
        expiryDate: document.getElementById('expiryDate').value,
        cvv: document.getElementById('cvv').value,
        time: new Date().toISOString(),
        status: Math.random() < 0.8 ? 'Success' : 'Fail' // 80% success rate
    };

    // Store transaction in localStorage
    const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    transactions.push(transaction);
    localStorage.setItem('transactions', JSON.stringify(transactions));

    // Show message
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = transaction.status === 'Success' ? 
        'Payment Successful!' : 'Payment Failed! Please try again.';
    messageDiv.className = 'message ' + (transaction.status === 'Success' ? 'success' : 'error');

    // Reset form
    if (transaction.status === 'Success') {
        this.reset();
    }
});

// Basic validation for card inputs
document.getElementById('cardNumber').addEventListener('input', function(e) {
    this.value = this.value.replace(/\D/g, '');
});

document.getElementById('cvv').addEventListener('input', function(e) {
    this.value = this.value.replace(/\D/g, '');
});

document.getElementById('expiryDate').addEventListener('input', function(e) {
    this.value = this.value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').slice(0, 5);
});
