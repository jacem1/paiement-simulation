const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('.'));

// Simulate payment processing endpoint
app.post('/simulate-payment', (req, res) => {
    const simulatedProcessingTime = 300; // 300ms processing time
    
    setTimeout(() => {
        // Get the transaction data from request
        const transaction = req.body;
        
        // Simulate server processing
        const success = Math.random() > 0.1; // 90% success rate
        
        res.json({
            success,
            processingTime: simulatedProcessingTime,
            message: success ? 'Transaction successful' : 'Transaction failed'
        });
    }, simulatedProcessingTime);
});

// Read transactions
app.get('/transactions.json', async (req, res) => {
    try {
        const data = await fs.readFile('transactions.json', 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        if (error.code === 'ENOENT') {
            await fs.writeFile('transactions.json', '[]');
            res.json([]);
        } else {
            res.status(500).send('Error reading transactions');
        }
    }
});

// Update transactions
app.put('/transactions.json', async (req, res) => {
    try {
        await fs.writeFile('transactions.json', JSON.stringify(req.body, null, 2));
        res.send('Transactions updated');
    } catch (error) {
        res.status(500).send('Error updating transactions');
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
