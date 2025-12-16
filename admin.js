let updateInterval;

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
    const failed = filteredTransactions.filter(t => !t.success);

    // Basic metrics
    const totalCount = filteredTransactions.length;
    const successRate = totalCount > 0 ? (successful.length / totalCount * 100) : 0;

    // Time calculations
    const responseTimes = filteredTransactions.map(t => t.processingTime || 0);
    const avgResponseTime = responseTimes.length > 0 ? 
        responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0;

    // Network metrics
    const networkTimes = filteredTransactions.map(t => {
        const total = t.processingTime || 0;
        const processing = t.serverProcessingTime || 0;
        return total - processing;
    });
    const avgNetworkTime = networkTimes.length > 0 ?
        networkTimes.reduce((a, b) => a + b, 0) / networkTimes.length : 0;

    // Throughput calculation
    const timeSpanMinutes = timeWindow === 'all' ? 
        (now - new Date(Math.min(...filteredTransactions.map(t => new Date(t.timestamp))))) / (1000 * 60) :
        parseInt(timeWindow);
    const throughput = timeSpanMinutes > 0 ? totalCount / timeSpanMinutes : 0;

    return {
        totalCount,
        successRate,
        avgResponseTime,
        throughput,
        avgNetworkTime,
        avgProcessingTime: avgResponseTime - avgNetworkTime,
        lastTransaction: filteredTransactions.length > 0 ? 
            new Date(Math.max(...filteredTransactions.map(t => new Date(t.timestamp)))) : null
    };
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDuration(ms) {
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
        document.getElementById('avgResponseTime').textContent = formatDuration(metrics.avgResponseTime);
        document.getElementById('throughput').textContent = `${metrics.throughput.toFixed(1)}/min`;
        document.getElementById('avgNetworkTime').textContent = formatDuration(metrics.avgNetworkTime);
        document.getElementById('avgProcessingTime').textContent = formatDuration(metrics.avgProcessingTime);
        document.getElementById('lastTransaction').textContent = metrics.lastTransaction ? 
            metrics.lastTransaction.toLocaleTimeString() : '-';

        // Update transaction list
        const transactionList = document.getElementById('transactionList');
        transactionList.innerHTML = '';

        transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .forEach(transaction => {
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
                    <div class="metrics-info">
                        <p><strong>Processing Time:</strong> ${formatDuration(transaction.processingTime || 0)}</p>
                        <p><strong>Device:</strong> ${transaction.deviceInfo || 'N/A'}</p>
                        <p><strong>Read Time:</strong> ${transaction.readTime || 'N/A'}</p>
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
