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
    
    const startTime = performance.now(); // Start time in milliseconds
    
    const cardNumber = document.getElementById('cardNumber').value;
    const isValidCard = cardData.some(card => card.number === cardNumber);
    
    // Calculate data size (rough estimation of the transaction data)
    const transactionData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        cardNumber: cardNumber,
        expiryDate: document.getElementById('expiryDate').value,
        cvv: document.getElementById('cvv').value
    };
    
    // Calculate data size in bytes (JSON string length * 2 for UTF-16)
    const dataSize = JSON.stringify(transactionData).length * 2;
    
    const endTime = performance.now(); // End time in milliseconds
    const responseTime = endTime - startTime; // Response time in milliseconds
    
    // Calculate throughput (bits per second)
    // dataSize * 8 for bits, responseTime/1000 for seconds
    const throughput = ((dataSize * 8) / (responseTime / 1000));
    
    const transaction = {
        name: transactionData.name,
        email: transactionData.email,
        cardNumber: cardNumber,
        expiryDate: transactionData.expiryDate,
        cvv: transactionData.cvv,
        time: new Date().toISOString(),
        status: isValidCard ? 'Success' : (Math.random() < 0.8 ? 'Success' : 'Fail'),
        responseTime: responseTime, // in milliseconds
        dataSize: dataSize, // in bytes
        throughput: throughput // in bits per second
    };

    // Store transaction and update UI
    try {
        const response = await fetch('/transactions.json');
        const transactions = await response.json();
        transactions.push(transaction);

        await fetch('/transactions.json', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(transactions)
        });

        // Show message with network metrics
        const messageDiv = document.getElementById('message');
        messageDiv.textContent = `${transaction.status === 'Success' ? 'Payment Successful!' : 'Payment Failed!'} 
            (Response Time: ${responseTime.toFixed(2)}ms, 
            Data Size: ${formatBytes(dataSize)}, 
            Throughput: ${formatThroughput(throughput)})`;
        messageDiv.className = 'message ' + (transaction.status === 'Success' ? 'success' : 'error');

        if (transaction.status === 'Success') {
            this.reset();
        }
    } catch (error) {
        console.error('Error saving transaction:', error);
        alert('Error processing transaction. Please try again.');
    }
});

// Utility functions for formatting
function formatBytes(bytes) {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + " KB";
    else return (bytes / 1048576).toFixed(2) + " MB";
}

function formatThroughput(bps) {
    if (bps < 1000) return bps.toFixed(2) + " bps";
    else if (bps < 1000000) return (bps / 1000).toFixed(2) + " Kbps";
    else return (bps / 1000000).toFixed(2) + " Mbps";
}

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
