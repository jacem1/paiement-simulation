const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'Admin@5588';

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
            <td>${transaction.status}</td>
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
    
    const successRate = recentTransactions.length > 0 
        ? (successfulTransactions.length / recentTransactions.length * 100).toFixed(2)
        : 0;

    document.getElementById('successRate').textContent = successRate;
    document.getElementById('totalTransactions').textContent = recentTransactions.length;
}

document.getElementById('duration').addEventListener('change', function() {
    const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    updateStats(transactions);
});

// Update stats every 30 seconds
setInterval(() => {
    const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    updateStats(transactions);
}, 30000);
