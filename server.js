const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const app = express();
const port = process.env.PORT || 3000;

// Allow CORS from your frontend URL
const corsOptions = {
    origin: 'https://mrmapllc.github.io',
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(bodyParser.json());

let grids = {};

// Load GeoJSON data
const geojsonFilePath = path.join(__dirname, 'grids.geojson');
fs.readFile(geojsonFilePath, 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading GeoJSON file:', err);
        return;
    }
    const geojson = JSON.parse(data);
    geojson.features.forEach(feature => {
        const gridId = feature.properties.Grid;
        grids[gridId] = feature.properties;
    });
    console.log('GeoJSON data loaded successfully');
});

// Function to save grids object to GeoJSON file
function saveGridsToFile(res, successMessage) {
    fs.readFile(geojsonFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading GeoJSON file:', err);
            return res.status(500).json({ error: 'Error reading GeoJSON file' });
        }

        const geojson = JSON.parse(data);
        geojson.features.forEach(feature => {
            const gridId = feature.properties.Grid;
            feature.properties = grids[gridId];
        });

        fs.writeFile(geojsonFilePath, JSON.stringify(geojson, null, 4), (err) => {
            if (err) {
                console.error('Error writing GeoJSON file:', err);
                return res.status(500).json({ error: 'Error writing GeoJSON file' });
            }

            res.json(successMessage);
        });
    });
}

// Add the rest of the routes as in the previous example

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
