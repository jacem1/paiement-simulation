const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('.'));

// Store transactions in memory and file
let transactions = [];
const TRANSACTIONS_FILE = 'transactions.json';

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
    } catch (error) {
        console.error('Error saving transactions:', error);
    }
}

// Load transactions on startup
loadTransactions();

// Simulate payment processing endpoint
app.post('/simulate-payment', async (req, res) => {
    console.log('Received payment request:', req.body);
    
    const simulatedProcessingTime = 300; // 300ms processing time
    
    setTimeout(async () => {
        // Get the transaction data from request
        const transaction = {
            ...req.body,
            timestamp: new Date().toISOString(),
            id: Date.now().toString()
        };
        
        // Simulate server processing
        const success = Math.random() > 0.1; // 90% success rate
        
        if (success) {
            // Store the transaction
            transactions.push(transaction);
            // Save to file
            await saveTransactions();
            
            console.log('Transaction stored:', transaction);
        }
        
        res.json({
            success,
            processingTime: simulatedProcessingTime,
            message: success ? 'Transaction successful' : 'Transaction failed',
            transactionId: transaction.id
        });
    }, simulatedProcessingTime);
});

// Get transactions
app.get('/transactions', (req, res) => {
    res.json(transactions);
});

// Clear transactions (for testing)
app.delete('/transactions', async (req, res) => {
    transactions = [];
    await saveTransactions();
    res.json({ message: 'All transactions cleared' });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Transactions file: ${path.resolve(TRANSACTIONS_FILE)}`);
});
