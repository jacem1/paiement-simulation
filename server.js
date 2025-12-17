const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

// Enable CORS
app.use(cors());
app.use(express.json());

// Store transactions in memory
let transactions = [];

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

        // Add timing info
        const endTime = process.hrtime(startTime);
        const totalTimeMs = (endTime[0] * 1000 + endTime[1] / 1000000);
        
        transaction.responseTime = totalTimeMs;
        transaction.serverProcessingTime = PROCESSING_TIME;
        transaction.networkTime = totalTimeMs - PROCESSING_TIME;
        transaction.dataSize = JSON.stringify(req.body).length;
        transaction.throughput = (transaction.dataSize / transaction.networkTime) * 1000;

        // Store in memory
        transactions.push(transaction);
        console.log(`Stored transaction. Total transactions: ${transactions.length}`);

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
    console.log(`Sending ${transactions.length} transactions`);
    res.json(transactions);
});

// Clear transactions
app.delete('/transactions.json', async (req, res) => {
    console.log('Clearing transactions');
    transactions = [];
    res.json({ success: true, message: 'All transactions cleared' });
});

// Serve static files
app.use(express.static('.'));

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
