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

document.getElementById('paymentForm').addEventListener('submit', async function(e) {
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

    try {
        // Get current transactions
        const response = await fetch('transactions.json');
        const transactions = await response.json();
        
        // Add new transaction
        transactions.push(transaction);

        // Save updated transactions
        await fetch('transactions.json', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(transactions)
        });

        // Show success message
        const messageDiv = document.getElementById('message');
        messageDiv.textContent = `${transaction.status === 'Success' ? 'Payment Successful!' : 'Payment Failed!'} (Response Time: ${responseTime}ms)`;
        messageDiv.className = 'message ' + (transaction.status === 'Success' ? 'success' : 'error');

        if (transaction.status === 'Success') {
            this.reset();
        }
    } catch (error) {
        console.error('Error saving transaction:', error);
        alert('Error processing transaction. Please try again.');
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
