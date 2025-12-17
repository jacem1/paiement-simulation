const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

// Enable CORS
app.use(cors());
app.use(express.json());

// Store transactions in memory and file
let transactions = [];
const TRANSACTIONS_FILE = 'transactions.json';

// Load existing transactions on startup
async function loadTransactions() {
    try {
        console.log('Loading transactions from file...');
        const data = await fs.readFile(TRANSACTIONS_FILE, 'utf8');
        transactions = JSON.parse(data);
        console.log(`Loaded ${transactions.length} transactions`);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log('No transactions file found, creating new one');
            await fs.writeFile(TRANSACTIONS_FILE, '[]');
            transactions = [];
        } else {
            console.error('Error loading transactions:', error);
            transactions = [];
        }
    }
}

// Save transactions to file
async function saveTransactions() {
    try {
        console.log('Saving transactions...');
        const data = JSON.stringify(transactions, null, 2);
        await fs.writeFile(TRANSACTIONS_FILE, data);
        console.log(`Saved ${transactions.length} transactions`);
        
        // Verify the save
        const saved = await fs.readFile(TRANSACTIONS_FILE, 'utf8');
        const parsed = JSON.parse(saved);
        console.log(`Verified save: ${parsed.length} transactions in file`);
    } catch (error) {
        console.error('Error saving transactions:', error);
        throw error; // Propagate the error
    }
}

// Initialize
loadTransactions().catch(console.error);

// Log middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`, req.body);
    next();
});

// Simulate payment endpoint
app.post('/simulate-payment', async (req, res) => {
    console.log('Received payment request:', req.body);
    
    const startTime = process.hrtime();
    const PROCESSING_TIME = 300;

    try {
        const transaction = {
            ...req.body,
            timestamp: new Date().toISOString(),
            id: Date.now().toString(),
            success: true
        };

        console.log('Created transaction:', transaction);

        // Add timing info
        const endTime = process.hrtime(startTime);
        const totalTimeMs = (endTime[0] * 1000 + endTime[1] / 1000000);
        
        transaction.responseTime = totalTimeMs;
        transaction.serverProcessingTime = PROCESSING_TIME;
        transaction.networkTime = totalTimeMs - PROCESSING_TIME;
        transaction.dataSize = JSON.stringify(req.body).length;
        transaction.throughput = (transaction.dataSize / transaction.networkTime) * 1000;

        console.log('Adding transaction to memory array');
        transactions.push(transaction);
        console.log(`Current transactions in memory: ${transactions.length}`);

        console.log('Saving to file...');
        await saveTransactions();

        const response = {
            success: true,
            responseTime: totalTimeMs,
            serverProcessingTime: PROCESSING_TIME,
            networkTime: transaction.networkTime,
            dataSize: transaction.dataSize,
            throughput: transaction.throughput,
            message: 'Transaction successful',
            transactionId: transaction.id
        };

        console.log('Sending response:', response);
        res.json(response);

    } catch (error) {
        console.error('Error processing transaction:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get transactions endpoint
app.get('/transactions.json', (req, res) => {
    console.log('GET /transactions.json');
    console.log(`Sending ${transactions.length} transactions`);
    res.json(transactions);
});

// Clear transactions
app.delete('/transactions.json', async (req, res) => {
    try {
        console.log('Clearing transactions');
        transactions = [];
        await saveTransactions();
        res.json({ success: true, message: 'All transactions cleared' });
    } catch (error) {
        console.error('Error clearing transactions:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        message: 'Server error',
        error: err.message
    });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
