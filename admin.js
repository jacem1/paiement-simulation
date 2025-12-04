let updateInterval;

document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('dashboardSection').style.display = 'block';
        startPolling();
    } else {
        alert('Invalid credentials!');
    }
});

function startPolling() {
    // Initial load
    loadTransactions();
    
    // Clear any existing interval
    if (updateInterval) {
        clearInterval(updateInterval);
    }
    
    // Poll every 1 second
    updateInterval = setInterval(loadTransactions, 1000);
}

async function loadTransactions() {
    try {
        // Add timestamp to prevent caching
        const response = await fetch(`/transactions.json?t=${new Date().getTime()}`);
        const transactions = await response.json();
        
        const transactionList = document.getElementById('transactionList');
        transactionList.innerHTML = '';

        // Sort transactions by time, most recent first
        transactions.sort((a, b) => new Date(b.time) - new Date(a.time));

        transactions.forEach((transaction, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(transaction.time).toLocaleString()}</td>
                <td>${transaction.name}</td>
                <td>${transaction.email}</td>
                <td class="${transaction.status.toLowerCase()}-status">${transaction.status}</td>
                <td>${transaction.responseTime?.toFixed(2) || 'N/A'}</td>
                <td>
                    <button class="delete-btn" data-index="${index}">Delete</button>
                </td>
            `;
            transactionList.appendChild(row);
        });

        // Add event listeners for delete buttons
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                deleteTransaction(index);
            });
        });

        updateStats(transactions);
    } catch (error) {
        console.error('Error loading transactions:', error);
    }
}

async function deleteTransaction(index) {
    try {
        const response = await fetch('/transactions.json');
        const transactions = await response.json();
        
        transactions.splice(index, 1);

        await fetch('/transactions.json', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(transactions)
        });

        loadTransactions();
    } catch (error) {
        console.error('Error deleting transaction:', error);
        alert('Error deleting transaction. Please try again.');
    }
}

async function clearAllTransactions() {
    if (confirm('Are you sure you want to delete all transactions?')) {
        try {
            await fetch('/transactions.json', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify([])
            });
            loadTransactions();
        } catch (error) {
            console.error('Error clearing transactions:', error);
            alert('Error clearing transactions. Please try again.');
        }
    }
}

function updateStats(transactions) {
    const duration = document.getElementById('duration').value;
    const currentTime = new Date();
    const cutoffTime = new Date(currentTime - duration * 60000);

    const recentTransactions = transactions.filter(t => new Date(t.time) > cutoffTime);
    const successfulTransactions = recentTransactions.filter(t => t.status === 'Success');
    const failedTransactions = recentTransactions.filter(t => t.status === 'Fail');
    
    // Basic metrics
    const successRate = recentTransactions.length > 0 
        ? (successfulTransactions.length / recentTransactions.length * 100).toFixed(2)
        : 0;

    // Response time calculations
    const responseTimes = recentTransactions.map(t => t.responseTime).filter(t => t != null);
    const successResponseTimes = successfulTransactions.map(t => t.responseTime).filter(t => t != null);
    const failureResponseTimes = failedTransactions.map(t => t.responseTime).filter(t => t != null);

    const avgResponseTime = responseTimes.length > 0
        ? (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
        : 0;

    // Calculate standard deviation
    const stdDev = calculateStdDev(responseTimes, avgResponseTime);
    
    const avgSuccessRT = successResponseTimes.length > 0
        ? (successResponseTimes.reduce((a, b) => a + b, 0) / successResponseTimes.length)
        : 0;
    
    const avgFailureRT = failureResponseTimes.length > 0
        ? (failureResponseTimes.reduce((a, b) => a + b, 0) / failureResponseTimes.length)
        : 0;
    
    const transactionsPerMinute = (recentTransactions.length / duration).toFixed(2);
    const lastTransaction = recentTransactions.length > 0 
        ? new Date(Math.max(...recentTransactions.map(t => new Date(t.time))))
        : null;

    // Update display
    document.getElementById('successRate').textContent = successRate;
    document.getElementById('totalTransactions').textContent = recentTransactions.length;
    document.getElementById('successCount').textContent = successfulTransactions.length;
    document.getElementById('failureCount').textContent = failedTransactions.length;
    document.getElementById('avgResponseTime').textContent = avgResponseTime.toFixed(2);
    document.getElementById('minResponseTime').textContent = responseTimes.length ? Math.min(...responseTimes).toFixed(2) : '0';
    document.getElementById('maxResponseTime').textContent = responseTimes.length ? Math.max(...responseTimes).toFixed(2) : '0';
    document.getElementById('stdDevResponseTime').textContent = stdDev.toFixed(2);
    document.getElementById('transactionsPerMinute').textContent = transactionsPerMinute;
    document.getElementById('lastTransactionTime').textContent = lastTransaction ? lastTransaction.toLocaleString() : '-';
    document.getElementById('avgSuccessResponseTime').textContent = avgSuccessRT.toFixed(2);
    document.getElementById('avgFailureResponseTime').textContent = avgFailureRT.toFixed(2);
}

function calculateStdDev(values, mean) {
    if (values.length < 2) return 0;
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (values.length - 1);
    return Math.sqrt(variance);
}

// Event listeners
document.getElementById('duration').addEventListener('change', loadTransactions);
document.getElementById('clearAllBtn').addEventListener('click', clearAllTransactions);

// Clean up interval when leaving the page
window.addEventListener('beforeunload', function() {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
});
