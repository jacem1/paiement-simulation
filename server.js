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
const TRANSACTIONS_FILE = 'transactions.json'; // Simplified path

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

// Serve static files including transactions.json
app.use(express.static('.'));

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
                success: true,
                responseTime: totalTimeMs,
                serverProcessingTime: PROCESSING_TIME,
                networkTime: networkTimeMs,
                dataSize: JSON.stringify(req.body).length,
                throughput: (JSON.stringify(req.body).length / networkTimeMs) * 1000
            };
            
            transactions.push(transaction);
            await saveTransactions(); // Save immediately after adding
            
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

// Serve admin dashboard
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Clear all transactions
app.delete('/transactions.json', async (req, res) => {
    try {
        transactions = [];
        await saveTransactions();
        res.json({ message: 'All transactions cleared' });
    } catch (error) {
        res.status(500).json({ message: 'Error clearing transactions', error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Admin dashboard: http://localhost:${port}/admin`);
});
