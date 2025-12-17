const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');  // Add CORS support
const app = express();
const port = process.env.PORT || 3000;

// Enable CORS
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Store transactions in memory and file
let transactions = [];
const TRANSACTIONS_FILE = path.join(__dirname, 'transactions.json');

// Load existing transactions on startup
async function loadTransactions() {
    try {
        const data = await fs.readFile(TRANSACTIONS_FILE, 'utf8');
        transactions = JSON.parse(data);
        console.log('Loaded transactions:', transactions.length);
    } catch (error) {
        if (error.code === 'ENOENT') {
            // File doesn't exist, create it
            await fs.writeFile(TRANSACTIONS_FILE, '[]');
            console.log('Created new transactions file');
        } else {
            console.error('Error loading transactions:', error);
        }
    }
}

// Save transactions to file
async function saveTransactions() {
    try {
        await fs.writeFile(TRANSACTIONS_FILE, JSON.stringify(transactions, null, 2));
        console.log('Saved transactions:', transactions.length);
        console.log('Latest transaction:', transactions[transactions.length - 1]);
    } catch (error) {
        console.error('Error saving transactions:', error);
    }
}

// Load transactions on startup
loadTransactions();

// Simulate payment processing endpoint
app.post('/simulate-payment', async (req, res) => {
    const startTime = process.hrtime();
    console.log('Received payment request:', JSON.stringify(req.body, null, 2));
    
    const PROCESSING_TIME = 300; // Fixed processing time in ms
    
    setTimeout(async () => {
        try {
            const endTime = process.hrtime(startTime);
            const totalTimeMs = (endTime[0] * 1000 + endTime[1] / 1000000);
            const networkTimeMs = totalTimeMs - PROCESSING_TIME;

            const transaction = {
                ...req.body,
                timestamp: new Date().toISOString(),
                id: Date.now().toString(),
                success: true,  // Set success to true for all transactions
                responseTime: totalTimeMs,           // Total round trip time
                serverProcessingTime: PROCESSING_TIME, // Fixed processing time
                networkTime: networkTimeMs,          // Network latency
                dataSize: JSON.stringify(req.body).length, // Request size in bytes
                throughput: (JSON.stringify(req.body).length / networkTimeMs) * 1000 // Bytes per second
            };
            
            transactions.push(transaction);
            await saveTransactions();
            
            console.log('Transaction metrics:', {
                totalTime: totalTimeMs.toFixed(2) + 'ms',
                processingTime: PROCESSING_TIME + 'ms',
                networkTime: networkTimeMs.toFixed(2) + 'ms',
                dataSize: transaction.dataSize + ' bytes',
                throughput: transaction.throughput.toFixed(2) + ' B/s'
            });
            
            res.json({
                success: true,
                responseTime: totalTimeMs,
                serverProcessingTime: PROCESSING_TIME,
                networkTime: networkTimeMs,
                dataSize: transaction.dataSize,
                throughput: transaction.throughput,
                message: 'Transaction successful',
                transactionId: transaction.id
            });
        } catch (error) {
            console.error('Error processing transaction:', error);
            res.status(500).json({
                success: false,
                message: 'Server error processing transaction',
                error: error.message
            });
        }
    }, PROCESSING_TIME);
});

// Get all transactions - Make sure CORS is enabled for this endpoint
app.get('/transactions', (req, res) => {
    console.log('GET /transactions - Sending transactions:', transactions.length);
    res.header('Access-Control-Allow-Origin', '*');  // Enable CORS specifically for this endpoint
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.json(transactions);
});

// Clear all transactions
app.delete('/transactions', async (req, res) => {
    try {
        transactions = [];
        await saveTransactions();
        res.json({ message: 'All transactions cleared' });
    } catch (error) {
        res.status(500).json({ message: 'Error clearing transactions', error: error.message });
    }
});

// Serve static files
app.use(express.static(path.join(__dirname)));

// Serve admin dashboard
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Transactions file: ${TRANSACTIONS_FILE}`);
    console.log(`Admin dashboard: http://localhost:${port}/admin`);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: err.message
    });
});
