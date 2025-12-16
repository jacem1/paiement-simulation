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
// In server.js, modify the simulate-payment endpoint:

app.post('/simulate-payment', async (req, res) => {
    const startTime = Date.now();
    console.log('Received payment request:', JSON.stringify(req.body, null, 2));
    
    const processingTime = 300; // Fixed processing time: 300ms
    
    setTimeout(async () => {
        try {
            // Get the transaction data from request
            const endTime = Date.now();
            const networkTime = endTime - startTime - processingTime; // Time minus processing time
            
            const transaction = {
                ...req.body,
                timestamp: new Date().toISOString(),
                id: Date.now().toString(),
                processingTime: processingTime,
                networkTime: networkTime,
                totalTime: endTime - startTime
            };
            
            // Simulate server processing
            const success = Math.random() > 0.1; // 90% success rate
            
            if (success) {
                // Store the transaction
                transactions.push(transaction);
                // Save to file
                await saveTransactions();
                
                console.log('Transaction stored successfully');
                console.log('Timing metrics:', {
                    processingTime,
                    networkTime,
                    totalTime: endTime - startTime
                });
            }
            
            res.json({
                success,
                processingTime,
                networkTime,
                totalTime: endTime - startTime,
                message: success ? 'Transaction successful' : 'Transaction failed',
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
    }, processingTime);
});

// Get all transactions
app.get('/transactions', (req, res) => {
    console.log('Sending transactions:', transactions.length);
    res.json(transactions);
});

// Get transaction by ID
app.get('/transactions/:id', (req, res) => {
    const transaction = transactions.find(t => t.id === req.params.id);
    if (transaction) {
        res.json(transaction);
    } else {
        res.status(404).json({ message: 'Transaction not found' });
    }
});

// Clear all transactions (for testing)
app.delete('/transactions', async (req, res) => {
    try {
        transactions = [];
        await saveTransactions();
        res.json({ message: 'All transactions cleared' });
    } catch (error) {
        res.status(500).json({ message: 'Error clearing transactions', error: error.message });
    }
});

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
