// Global variable to store the update interval
let updateInterval;

document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('dashboardSection').style.display = 'block';
        loadTransactions();
        startRealTimeUpdates();
    } else {
        alert('Invalid credentials!');
    }
});

function startRealTimeUpdates() {
    // Initial load
    loadTransactions();
    
    // Clear any existing interval
    if (updateInterval) {
        clearInterval(updateInterval);
    }
    
    // Set up new interval for real-time updates (every 1 second)
    updateInterval = setInterval(() => {
        loadTransactions();
    }, 1000);
}

function loadTransactions() {
    const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
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
}

function deleteTransaction(index) {
    const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    transactions.splice(index, 1);
    localStorage.setItem('transactions', JSON.stringify(transactions));
    loadTransactions(); // Reload the transactions immediately
}

function clearAllTransactions() {
    if (confirm('Are you sure you want to delete all transactions?')) {
        localStorage.setItem('transactions', '[]');
        loadTransactions(); // Reload the transactions immediately
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
document.getElementById('duration').addEventListener('change', function() {
    loadTransactions();
});

document.getElementById('clearAllBtn').addEventListener('click', clearAllTransactions);

// Clean up interval when leaving the page
window.addEventListener('beforeunload', function() {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
});
