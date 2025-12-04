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

function loadTransactions() {
    const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    const transactionList = document.getElementById('transactionList');
    transactionList.innerHTML = '';

    transactions.forEach(transaction => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date(transaction.time).toLocaleString()}</td>
            <td>${transaction.name}</td>
            <td>${transaction.email}</td>
            <td class="${transaction.status.toLowerCase()}-status">${transaction.status}</td>
            <td>${transaction.responseTime?.toFixed(2) || 'N/A'}</td>
        `;
        transactionList.appendChild(row);
    });

    updateStats(transactions);
}

function updateStats(transactions) {
    const duration = document.getElementById('duration').value;
    const currentTime = new Date();
    const cutoffTime = new Date(currentTime - duration * 60000);

    const recentTransactions = transactions.filter(t => new Date(t.time) > cutoffTime);
    const successfulTransactions = recentTransactions.filter(t => t.status === 'Success');
    
    // Calculate success rate
    const successRate = recentTransactions.length > 0 
        ? (successfulTransactions.length / recentTransactions.length * 100).toFixed(2)
        : 0;

    // Calculate response time statistics
    const responseTimes = recentTransactions.map(t => t.responseTime).filter(t => t != null);
    const avgResponseTime = responseTimes.length > 0
        ? (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(2)
        : 0;
    const minResponseTime = responseTimes.length > 0
        ? Math.min(...responseTimes).toFixed(2)
        : 0;
    const maxResponseTime = responseTimes.length > 0
        ? Math.max(...responseTimes).toFixed(2)
        : 0;

    // Update display
    document.getElementById('successRate').textContent = successRate;
    document.getElementById('totalTransactions').textContent = recentTransactions.length;
    document.getElementById('avgResponseTime').textContent = avgResponseTime;
    document.getElementById('minResponseTime').textContent = minResponseTime;
    document.getElementById('maxResponseTime').textContent = maxResponseTime;
}

// Update stats when duration changes
document.getElementById('duration').addEventListener('change', function() {
    const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    updateStats(transactions);
});

// Update stats every 30 seconds
setInterval(() => {
    const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    updateStats(transactions);
}, 30000);
