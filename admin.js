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
    const now = new Date();
    const timeWindow = document.getElementById('timeWindow').value;
    const cutoffTime = timeWindow === 'all' ? 0 : 
        now.getTime() - (parseInt(timeWindow) * 60 * 1000);

    const filteredTransactions = transactions.filter(t => 
        new Date(t.timestamp).getTime() > cutoffTime
    );

    const successful = filteredTransactions.filter(t => t.success);

    // Basic metrics
    const totalCount = filteredTransactions.length;
    const successRate = totalCount > 0 ? (successful.length / totalCount * 100) : 0;

    // Time calculations
    const networkTimes = filteredTransactions.map(t => {
        const responseTime = t.processingTime || 0;
        return responseTime - PROCESSING_TIME; // Network time = Total time - Processing time
    });

    const avgNetworkTime = networkTimes.length > 0 ?
        networkTimes.reduce((a, b) => a + b, 0) / networkTimes.length : 0;

    const avgTotalTime = avgNetworkTime + PROCESSING_TIME;

    return {
        totalCount,
        successRate,
        avgNetworkTime,
        avgTotalTime,
        transactions: filteredTransactions
    };
}

function formatDuration(ms) {
    if (ms < 0) ms = 0;
    if (ms < 1000) return `${ms.toFixed(1)} ms`;
    return `${(ms/1000).toFixed(2)} s`;
}

async function loadTransactions() {
    try {
        const response = await fetch('/transactions');
        const transactions = await response.json();
        
        // Calculate metrics
        const metrics = calculateMetrics(transactions);
        
        // Update statistics
        document.getElementById('totalTransactions').textContent = metrics.totalCount;
        document.getElementById('successRate').textContent = `${metrics.successRate.toFixed(1)}%`;
        document.getElementById('avgNetworkTime').textContent = formatDuration(metrics.avgNetworkTime);
        document.getElementById('avgTotalTime').textContent = formatDuration(metrics.avgTotalTime);
        document.getElementById('avgTotalTimeDetail').textContent = formatDuration(metrics.avgTotalTime);

        // Update transaction list
        const transactionList = document.getElementById('transactionList');
        transactionList.innerHTML = '';

        metrics.transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .forEach(transaction => {
                const networkTime = (transaction.processingTime || 0) - PROCESSING_TIME;
                const totalTime = networkTime + PROCESSING_TIME;

                const row = document.createElement('div');
                row.className = 'transaction';
                row.innerHTML = `
                    <div class="transaction-header">
                        <span class="transaction-id">Transaction ${transaction.id}</span>
                        <span class="transaction-time">${new Date(transaction.timestamp).toLocaleString()}</span>
                    </div>
                    <div>
                        <p><strong>Card Type:</strong> ${transaction.type || 'Unknown'}</p>
                        <p><strong>Card Number:</strong> **** **** **** ${transaction.number.slice(-4)}</p>
                        <p><strong>Amount:</strong> €${transaction.amount?.toFixed(2) || '0.00'}</p>
                    </div>
                    <div class="timing-details">
                        <div class="timing-detail">
                            <div class="timing-detail-label">Network Time</div>
                            <div class="timing-detail-value">${formatDuration(networkTime)}</div>
                        </div>
                        <div class="timing-detail">
                            <div class="timing-detail-label">Processing Time</div>
                            <div class="timing-detail-value">${formatDuration(PROCESSING_TIME)}</div>
                        </div>
                        <div class="timing-detail">
                            <div class="timing-detail-label">Total Time</div>
                            <div class="timing-detail-value">${formatDuration(totalTime)}</div>
                        </div>
                    </div>
                `;
                transactionList.appendChild(row);
            });

    } catch (error) {
        console.error('Error loading transactions:', error);
        document.getElementById('transactionList').innerHTML = 
            '<div style="color: #f44336; padding: 20px; background: white; border-radius: 8px;">' +
            'Error loading transactions. Please refresh the page.</div>';
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

document.addEventListener('DOMContentLoaded', startPolling);

window.addEventListener('beforeunload', () => {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
});
