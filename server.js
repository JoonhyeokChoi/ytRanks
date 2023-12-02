const express = require('express');
const app = express();
const path = require(`path`);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/frontend/index.html'));
});

app.use(express.static(__dirname + '/frontend'));

// app.get('/ga4/ee/ge', (req, res) => {
//     res.sendFile(path.join(__dirname, '/src/ga4/ee/ge/index.html'));
// });
// app.use(express.static(__dirname + '/src/ga4/ee/ge/css'));
// app.use(express.static(__dirname + '/src/ga4/ee/ge/js'));


// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}...`);
});
