// Add auto-fill functionality
document.getElementById('autoFillButton').addEventListener('click', function() {
    const randomCard = cardData[Math.floor(Math.random() * cardData.length)];
    document.getElementById('name').value = randomCard.name;
    document.getElementById('email').value = randomCard.name.toLowerCase().replace(' ', '.') + '@example.com';
    document.getElementById('cardNumber').value = randomCard.number;
    document.getElementById('expiryDate').value = randomCard.expiry;
    document.getElementById('cvv').value = randomCard.cvv;
});

// Payment processing with server-side processing time
document.getElementById('paymentForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const clientStartTime = performance.now();
    const cardNumber = document.getElementById('cardNumber').value;
    const isValidCard = cardData.some(card => card.number === cardNumber);
    
    // Calculate data size
    const transactionData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        cardNumber: cardNumber,
        expiryDate: document.getElementById('expiryDate').value,
        cvv: document.getElementById('cvv').value
    };
    
    const dataSize = JSON.stringify(transactionData).length * 2;

    try {
        // Send request to server for processing
        const processResponse = await fetch('/simulate-payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(transactionData)
        });

        const processResult = await processResponse.json();
        const clientEndTime = performance.now();

        // Calculate total response time (client + server + network)
        const totalResponseTime = clientEndTime - clientStartTime;
        
        // Calculate network time (total - server processing)
        const networkTime = totalResponseTime - processResult.processingTime;
        
        // Calculate throughput
        const throughput = ((dataSize * 8) / (networkTime / 1000));

        const transaction = {
            name: transactionData.name,
            email: transactionData.email,
            cardNumber: cardNumber,
            expiryDate: transactionData.expiryDate,
            cvv: transactionData.cvv,
            time: new Date().toISOString(),
            status: processResult.success ? 'Success' : 'Fail',
            responseTime: totalResponseTime,
            serverProcessingTime: processResult.processingTime,
            networkTime: networkTime,
            dataSize: dataSize,
            throughput: throughput
        };

        // Store transaction
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

        // Show detailed message
        const messageDiv = document.getElementById('message');
        messageDiv.textContent = `${transaction.status === 'Success' ? 'Payment Successful!' : 'Payment Failed!'} 
            (Total Time: ${totalResponseTime.toFixed(2)}ms, 
            Server Time: ${processResult.processingTime}ms,
            Network Time: ${networkTime.toFixed(2)}ms,
            Data Size: ${formatBytes(dataSize)}, 
            Throughput: ${formatThroughput(throughput)})`;
        messageDiv.className = 'message ' + (transaction.status === 'Success' ? 'success' : 'error');

        if (transaction.status === 'Success') {
            this.reset();
        }
    } catch (error) {
        console.error('Error processing transaction:', error);
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

// Add batch transaction functionality
document.getElementById('batchTransactionButton').addEventListener('click', async function() {
    const totalTransactions = 100;
    const messageDiv = document.getElementById('message');
    let successfulTransactions = 0;
    let failedTransactions = 0;
    
    // Disable the button during processing
    this.disabled = true;
    this.textContent = 'Processing...';

    try {
        for (let i = 0; i < totalTransactions; i++) {
            try {
                // Get a random card
                const randomCard = cardData[Math.floor(Math.random() * cardData.length)];
                
                // Fill the form with random card data
                document.getElementById('name').value = randomCard.name;
                document.getElementById('email').value = randomCard.name.toLowerCase().replace(' ', '.') + '@example.com';
                document.getElementById('cardNumber').value = randomCard.number;
                document.getElementById('expiryDate').value = randomCard.expiry;
                document.getElementById('cvv').value = randomCard.cvv;

                // Update progress
                messageDiv.textContent = `Processing transaction ${i + 1}/${totalTransactions}...`;
                messageDiv.className = 'message info';

                // Submit the form programmatically
                const submitEvent = new Event('submit', { cancelable: true });
                await document.getElementById('paymentForm').dispatchEvent(submitEvent);
                successfulTransactions++;

                // Increased delay between transactions to 0.5 second
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (transactionError) {
                console.error(`Error in transaction ${i + 1}:`, transactionError);
                failedTransactions++;
                // Continue with next transaction despite error
                continue;
            }
        }

        // Show completion message with statistics
        messageDiv.textContent = `Batch processing completed: 
            ${successfulTransactions} successful, 
            ${failedTransactions} failed out of ${totalTransactions} transactions`;
        messageDiv.className = 'message success';

    } catch (error) {
        console.error('Error in batch processing:', error);
        messageDiv.textContent = `Batch processing interrupted. 
            Completed: ${successfulTransactions} successful, 
            ${failedTransactions} failed out of ${totalTransactions} transactions`;
        messageDiv.className = 'message error';
    } finally {
        // Re-enable the button
        this.disabled = false;
        this.textContent = 'Launch 100 Transactions';
    }
});
