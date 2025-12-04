const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('.'));

// Read transactions
app.get('/transactions.json', async (req, res) => {
    try {
        const data = await fs.readFile('transactions.json', 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        res.status(500).send('Error reading transactions');
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
    console.log(`Server running at http://localhost:${port}`);
});
