const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Store transactions in memory and file
let transactions = [];
const TRANSACTIONS_FILE = 'transactions.json';

// Load existing transactions on startup
async function loadTransactions() {
    try {
        if (await fs.access(TRANSACTIONS_FILE).catch(() => false)) {
            const data = await fs.readFile(TRANSACTIONS_FILE, 'utf8');
            transactions = JSON.parse(data);
        } else {
            await fs.writeFile(TRANSACTIONS_FILE, '[]');
        }
        console.log(`Loaded ${transactions.length} transactions`);
    } catch (error) {
        console.error('Error loading transactions:', error);
        transactions = [];
        await fs.writeFile(TRANSACTIONS_FILE, '[]').catch(console.error);
    }
}

// Save transactions to file
async function saveTransactions() {
    try {
        const data = JSON.stringify(transactions, null, 2);
        await fs.writeFile(TRANSACTIONS_FILE, data);
        console.log(`Saved ${transactions.length} transactions`);
        return true;
    } catch (error) {
        console.error('Error saving transactions:', error);
        return false;
    }
}

// Initialize
loadTransactions().catch(console.error);

// Serve static files
app.use(express.static('.'));

// Get transactions
app.get('/transactions.json', (req, res) => {
    res.json(transactions);
});

// Simulate payment endpoint
app.post('/simulate-payment', async (req, res) => {
    console.log('Received payment:', req.body);
    
    const startTime = process.hrtime();
    const PROCESSING_TIME = 300;

    try {
        const transaction = {
            ...req.body,
            timestamp: new Date().toISOString(),
            id: Date.now().toString(),
            success: true
        };

        // Add timing info after processing
        const endTime = process.hrtime(startTime);
        const totalTimeMs = (endTime[0] * 1000 + endTime[1] / 1000000);
        
        transaction.responseTime = totalTimeMs;
        transaction.serverProcessingTime = PROCESSING_TIME;
        transaction.networkTime = totalTimeMs - PROCESSING_TIME;
        transaction.dataSize = JSON.stringify(req.body).length;
        transaction.throughput = (transaction.dataSize / transaction.networkTime) * 1000;

        // Save transaction
        transactions.push(transaction);
        const saved = await saveTransactions();

        if (!saved) {
            throw new Error('Failed to save transaction');
        }

        // Send response
        res.json({
            success: true,
            responseTime: totalTimeMs,
            serverProcessingTime: PROCESSING_TIME,
            networkTime: transaction.networkTime,
            dataSize: transaction.dataSize,
            throughput: transaction.throughput,
            message: 'Transaction successful',
            transactionId: transaction.id
        });

        console.log('Transaction processed:', transaction.id);

    } catch (error) {
        console.error('Transaction error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Clear transactions
app.delete('/transactions.json', async (req, res) => {
    try {
        transactions = [];
        await saveTransactions();
        res.json({ success: true, message: 'All transactions cleared' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
});

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
