let updateInterval;
const PROCESSING_TIME = 300; // Fixed processing time in ms

function startPolling() {
    loadTransactions();
    if (updateInterval) {
        clearInterval(updateInterval);
    }
    updateInterval = setInterval(loadTransactions, 3000);
}

function calculateMetrics(transactions) {
    console.log('Raw transactions received:', JSON.stringify(transactions, null, 2)); // Debug log

    if (!Array.isArray(transactions)) {
        console.error('Transactions is not an array:', transactions);
        return {
            totalCount: 0,
            successRate: 0,
            avgResponseTime: 0,
            avgNetworkTime: 0,
            avgProcessingTime: 0,
            transactions: []
        };
    }

    const timeWindow = document.getElementById('timeWindow').value;
    const now = Date.now();
    const cutoffTime = timeWindow === 'all' ? 0 : 
        now - (parseInt(timeWindow) * 60 * 1000);

    console.log('Filtering transactions after:', new Date(cutoffTime).toISOString());

    const filteredTransactions = transactions.filter(t => {
        const timestamp = new Date(t.timestamp).getTime();
        const include = timestamp > cutoffTime;
        console.log('Transaction:', {
            id: t.id,
            timestamp: t.timestamp,
            included: include
        });
        return include;
    });

    console.log('Filtered transactions:', filteredTransactions.length);

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

    const metrics = {
        totalCount: filteredTransactions.length,
        successRate: (successful.length / filteredTransactions.length) * 100,
        avgResponseTime,
        avgNetworkTime,
        avgProcessingTime,
        transactions: filteredTransactions
    };

    console.log('Calculated metrics:', metrics);
    return metrics;
}

function formatDuration(ms) {
    return ms < 1000 ? `${ms.toFixed(1)} ms` : `${(ms/1000).toFixed(2)} s`;
}

async function loadTransactions() {
    try {
        console.log('Fetching transactions...');
        const timestamp = new Date().getTime();
        const url = `https://paiement-simulation.onrender.com/transactions.json?t=${timestamp}`;
        console.log('Fetch URL:', url);

        const response = await fetch(url, {
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const text = await response.text();
        console.log('Raw response text:', text);

        let transactions;
        try {
            transactions = JSON.parse(text);
        } catch (e) {
            console.error('Failed to parse JSON:', e);
            throw new Error('Invalid JSON response');
        }

        console.log('Parsed transactions:', transactions);
        
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

        if (metrics.transactions.length === 0) {
            transactionList.innerHTML = '<div class="error">No transactions found</div>';
            return;
        }

        metrics.transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .forEach(transaction => {
                console.log('Rendering transaction:', transaction);
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

    } catch (error) {
        console.error('Error loading transactions:', error);
        document.getElementById('transactionList').innerHTML = 
            `<div class="error">Error loading transactions: ${error.message}</div>`;
    }
}

async function clearAllTransactions() {
    if (!confirm('Are you sure you want to delete all transactions?')) return;
    
    try {
        const response = await fetch('https://paiement-simulation.onrender.com/transactions.json', {
            method: 'DELETE',
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
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

document.addEventListener('DOMContentLoaded', startPolling);

window.addEventListener('beforeunload', () => {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
});
