const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('.'));

// Add no-cache middleware for transactions.json
app.use('/transactions.json', (req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Expires', '-1');
    res.set('Pragma', 'no-cache');
    next();
});

// Read transactions
app.get('/transactions.json', async (req, res) => {
    try {
        const data = await fs.readFile('transactions.json', 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        if (error.code === 'ENOENT') {
            // If file doesn't exist, create it with empty array
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
