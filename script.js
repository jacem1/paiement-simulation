// Add auto-fill functionality
document.getElementById('autoFillButton').addEventListener('click', function() {
    const randomCard = cardData[Math.floor(Math.random() * cardData.length)];
    
    document.getElementById('name').value = randomCard.name;
    document.getElementById('email').value = randomCard.name.toLowerCase().replace(' ', '.') + '@example.com';
    document.getElementById('cardNumber').value = randomCard.number;
    document.getElementById('expiryDate').value = randomCard.expiry;
    document.getElementById('cvv').value = randomCard.cvv;
});

// Payment processing with real response time measurement

document.getElementById('paymentForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const startTime = performance.now();
    const cardNumber = document.getElementById('cardNumber').value;
    const isValidCard = cardData.some(card => card.number === cardNumber);
    
    const endTime = performance.now();
    const responseTime = (endTime - startTime).toFixed(2);
    
    const transaction = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        cardNumber: cardNumber,
        expiryDate: document.getElementById('expiryDate').value,
        cvv: document.getElementById('cvv').value,
        time: new Date().toISOString(),
        status: isValidCard ? 'Success' : (Math.random() < 0.8 ? 'Success' : 'Fail'),
        responseTime: parseFloat(responseTime)
    };

    // Store transaction
    const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    transactions.push(transaction);
    localStorage.setItem('transactions', JSON.stringify(transactions));
    
    // Update last modified timestamp
    localStorage.setItem('lastModified', new Date().getTime());

    // Show message
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = `${transaction.status === 'Success' ? 'Payment Successful!' : 'Payment Failed!'} (Response Time: ${responseTime}ms)`;
    messageDiv.className = 'message ' + (transaction.status === 'Success' ? 'success' : 'error');

    if (transaction.status === 'Success') {
        this.reset();
    }
});

// ... (rest of the code remains the same)
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
