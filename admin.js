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
            avgThroughput: 0,
            avgDataSize: 0,
            transactions: []
        };
    }

    const successful = filteredTransactions.filter(t => t.success);

    // Calculate averages
    const avgResponseTime = filteredTransactions.reduce((sum, t) => sum + (t.responseTime || 0), 0) / filteredTransactions.length;
    const avgNetworkTime = filteredTransactions.reduce((sum, t) => sum + (t.networkTime || 0), 0) / filteredTransactions.length;
    const avgProcessingTime = filteredTransactions.reduce((sum, t) => sum + (t.serverProcessingTime || 0), 0) / filteredTransactions.length;
    const avgThroughput = filteredTransactions.reduce((sum, t) => sum + (t.throughput || 0), 0) / filteredTransactions.length;
    const avgDataSize = filteredTransactions.reduce((sum, t) => sum + (t.dataSize || 0), 0) / filteredTransactions.length;

    return {
        totalCount: filteredTransactions.length,
        successRate: (successful.length / filteredTransactions.length) * 100,
        avgResponseTime,
        avgNetworkTime,
        avgProcessingTime,
        avgThroughput,
        avgDataSize,
        transactions: filteredTransactions
    };
}

function formatDuration(ms) {
    return ms < 1000 ? `${ms.toFixed(1)} ms` : `${(ms/1000).toFixed(2)} s`;
}

function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes.toFixed(0)} B`;
    if (bytes < 1048576) return `${(bytes/1024).toFixed(1)} KB`;
    return `${(bytes/1048576).toFixed(1)} MB`;
}

function formatThroughput(bytesPerSec) {
    if (bytesPerSec < 1024) return `${bytesPerSec.toFixed(0)} B/s`;
    if (bytesPerSec < 1048576) return `${(bytesPerSec/1024).toFixed(1)} KB/s`;
    return `${(bytesPerSec/1048576).toFixed(1)} MB/s`;
}

async function loadTransactions() {
    try {
        const response = await fetch('/transactions');
        const transactions = await response.json();
        
        const metrics = calculateMetrics(transactions);
        
        // Update statistics
        document.getElementById('totalTransactions').textContent = metrics.totalCount;
        document.getElementById('successRate').textContent = `${metrics.successRate.toFixed(1)}%`;
        document.getElementById('avgResponseTime').textContent = formatDuration(metrics.avgResponseTime);
        document.getElementById('avgNetworkTime').textContent = formatDuration(metrics.avgNetworkTime);
        document.getElementById('avgProcessingTime').textContent = formatDuration(metrics.avgProcessingTime);
        document.getElementById('avgThroughput').textContent = formatThroughput(metrics.avgThroughput);
        document.getElementById('avgDataSize').textContent = formatBytes(metrics.avgDataSize);

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
                    <div class="performance-details">
                        <p><strong>Data Size:</strong> ${formatBytes(transaction.dataSize)}</p>
                        <p><strong>Throughput:</strong> ${formatThroughput(transaction.throughput)}</p>
                    </div>
                `;
                transactionList.appendChild(row);
            });

    } catch (error) {
        console.error('Error loading transactions:', error);
        document.getElementById('transactionList').innerHTML = 
            '<div class="error">Error loading transactions. Please refresh the page.</div>';
    }
}
