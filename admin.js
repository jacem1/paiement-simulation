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
