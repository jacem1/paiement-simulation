document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('dashboardSection').style.display = 'block';
        loadTransactions();
    } else {
        alert('Invalid credentials!');
    }
});

// ... existing login code remains the same ...

function loadTransactions() {
    const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    const transactionList = document.getElementById('transactionList');
    transactionList.innerHTML = '';

    transactions.forEach((transaction, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date(transaction.time).toLocaleString()}</td>
            <td>${transaction.name}</td>
            <td>${transaction.email}</td>
            <td class="${transaction.status.toLowerCase()}-status">${transaction.status}</td>
            <td>${transaction.responseTime?.toFixed(2) || 'N/A'}</td>
            <td>
                <button class="delete-btn" onclick="deleteTransaction(${index})">Delete</button>
            </td>
        `;
        transactionList.appendChild(row);
    });

    updateStats(transactions);
}

function deleteTransaction(index) {
    const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    transactions.splice(index, 1);
    localStorage.setItem('transactions', JSON.stringify(transactions));
    loadTransactions();
}

function clearAllTransactions() {
    if (confirm('Are you sure you want to delete all transactions?')) {
        localStorage.setItem('transactions', '[]');
        loadTransactions();
    }
}

function calculateStdDev(values, mean) {
    if (values.length < 2) return 0;
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (values.length - 1);
    return Math.sqrt(variance);
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

    // Calculate additional metrics
    const stdDev = calculateStdDev(responseTimes, avgResponseTime);
    const avgSuccessRT = successResponseTimes.length > 0
        ? (successResponseTimes.reduce((a, b) => a + b, 0) / successResponseTimes.length)
        : 0;
    const avgFailureRT = failureResponseTimes.length > 0
        ? (failureResponseTimes.reduce((a, b) => a + b, 0) / failureResponseTimes.length)
        : 0;
    
    const transactionsPerMinute = recentTransactions.length / duration;
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
    document.getElementById('transactionsPerMinute').textContent = transactionsPerMinute.toFixed(2);
    document.getElementById('lastTransactionTime').textContent = lastTransaction ? lastTransaction.toLocaleString() : '-';
    document.getElementById('avgSuccessResponseTime').textContent = avgSuccessRT.toFixed(2);
    document.getElementById('avgFailureResponseTime').textContent = avgFailureRT.toFixed(2);
}

// Event Listeners
document.getElementById('duration').addEventListener('change', function() {
    const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    updateStats(transactions);
});

document.getElementById('clearAllBtn').addEventListener('click', clearAllTransactions);

// Auto-update every 30 seconds
setInterval(() => {
    const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    updateStats(transactions);
}, 30000);
