console.log('--- Test script started ---');
const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('Hello World'));
app.listen(5000, () => console.log('Test server running'));
setInterval(() => {}, 1000); // Keeps the process alive
process.on('exit', (code) => {
  console.log('Test process exit event with code:', code);
});
