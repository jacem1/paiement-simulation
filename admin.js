let updateInterval;
const PROCESSING_TIME = 300; // Fixed processing time in ms
const API_BASE_URL = 'https://paiement-simulation.onrender.com/api'; // Update this to match your server

function startPolling() {
    loadTransactions();
    if (updateInterval) {
        clearInterval(updateInterval);
    }
    updateInterval = setInterval(loadTransactions, 3000);
}

// Rest of the calculateMetrics and format functions remain the same...

async function loadTransactions() {
    try {
        // Try the API endpoint instead
        const response = await fetch(`${API_BASE_URL}/transactions`);
        if (!response.ok) {
            // If API endpoint fails, try the root endpoint
            const rootResponse = await fetch('https://paiement-simulation.onrender.com/transactions.json');
            if (!rootResponse.ok) {
                throw new Error(`HTTP error! status: ${rootResponse.status}`);
            }
            return await handleTransactionsResponse(rootResponse);
        }
        return await handleTransactionsResponse(response);
    } catch (error) {
        console.error('Error loading transactions:', error);
        document.getElementById('transactionList').innerHTML = 
            '<div class="error">Error loading transactions. Please refresh the page.</div>';
    }
}

async function handleTransactionsResponse(response) {
    const transactions = await response.json();
    
    const metrics = calculateMetrics(transactions);
    
    // Update statistics
    document.getElementById('totalTransactions').textContent = metrics.totalCount;
    document.getElementById('successRate').textContent = `${metrics.successRate.toFixed(1)}%`;
    document.getElementById('avgTotalTime').textContent = formatDuration(metrics.avgResponseTime);
    document.getElementById('avgNetworkTime').textContent = formatDuration(metrics.avgNetworkTime);
    document.getElementById('avgTotalTimeDetail').textContent = formatDuration(metrics.avgResponseTime);

    // Update transaction list
    const transactionList = document.getElementById('transactionList');
    transactionList.innerHTML = '';

    metrics.transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .forEach(transaction => {
            const row = document.createElement('div');
            row.className = 'transaction';
            row.innerHTML = `
                <div class="transaction-header">
                    <span class="transaction-id">Transaction ${transaction.id}</span>
                    <span class="transaction-time">${new Date(transaction.timestamp).toLocaleString()}</span>
                </div>
                <div class="transaction-details">
                    <p><strong>Card Type:</strong> ${transaction.type}</p>
                    <p><strong>Card Number:</strong> **** **** **** ${transaction.number.slice(-4)}</p>
                    <p><strong>Amount:</strong> €${transaction.amount.toFixed(2)}</p>
                </div>
                <div class="timing-details">
                    <div class="timing-detail">
                        <div class="timing-detail-label">Network Time</div>
                        <div class="timing-detail-value">${formatDuration(transaction.networkTime)}</div>
                    </div>
                    <div class="timing-detail">
                        <div class="timing-detail-label">Processing Time</div>
                        <div class="timing-detail-value">${formatDuration(transaction.serverProcessingTime)}</div>
                    </div>
                    <div class="timing-detail">
                        <div class="timing-detail-label">Total Time</div>
                        <div class="timing-detail-value">${formatDuration(transaction.responseTime)}</div>
                    </div>
                </div>
            `;
            transactionList.appendChild(row);
        });
}

async function clearAllTransactions() {
    if (!confirm('Are you sure you want to delete all transactions?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/transactions`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Failed to clear transactions');
        }
        
        loadTransactions();
    } catch (error) {
        console.error('Error clearing transactions:', error);
        alert('Error clearing transactions. Please try again.');
    }
}

// Helper functions
function formatDuration(ms) {
    return ms < 1000 ? `${ms.toFixed(1)} ms` : `${(ms/1000).toFixed(2)} s`;
}

function calculateMetrics(transactions) {
    const timeWindow = document.getElementById('timeWindow').value;
    const now = Date.now();
    const cutoffTime = timeWindow === 'all' ? 0 : 
        now - (parseInt(timeWindow) * 60 * 1000);

    const filteredTransactions = transactions.filter(t => 
        new Date(t.timestamp).getTime() > cutoffTime
    );

    if (filteredTransactions.length === 0) {
        return {
            totalCount: 0,
            successRate: 0,
            avgResponseTime: 0,
            avgNetworkTime: 0,
            avgProcessingTime: 0,
            transactions: []
        };
    }

    const successful = filteredTransactions.filter(t => t.success);

    // Calculate averages
    const avgResponseTime = filteredTransactions.reduce((sum, t) => sum + (t.responseTime || 0), 0) / filteredTransactions.length;
    const avgNetworkTime = filteredTransactions.reduce((sum, t) => sum + (t.networkTime || 0), 0) / filteredTransactions.length;
    const avgProcessingTime = filteredTransactions.reduce((sum, t) => sum + (t.serverProcessingTime || 0), 0) / filteredTransactions.length;

    return {
        totalCount: filteredTransactions.length,
        successRate: (successful.length / filteredTransactions.length) * 100,
        avgResponseTime,
        avgNetworkTime,
        avgProcessingTime,
        transactions: filteredTransactions
    };
}

document.addEventListener('DOMContentLoaded', startPolling);

window.addEventListener('beforeunload', () => {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
});
