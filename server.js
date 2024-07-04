const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

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

app.use(cors());
app.use(bodyParser.json());

// Get grid information by Grid name
app.get('/api/grids/name/:gridName', (req, res) => {
    const gridName = req.params.gridName;
    const grid = grids[gridName];
    if (grid) {
        res.json({ attributes: grid });
    } else {
        res.status(404).json({ error: 'Grid not found' });
    }
});

// Update grid information
app.put('/api/grids/name/:gridName', (req, res) => {
    const gridName = req.params.gridName;
    const newInfo = req.body;
    if (grids[gridName]) {
        grids[gridName] = { ...grids[gridName], ...newInfo };
        res.json({ attributes: grids[gridName] });
    } else {
        res.status(404).json({ error: 'Grid not found' });
    }
});

// Delete a specific field from the grid
app.delete('/api/grids/name/:gridName/:field', (req, res) => {
    const gridName = req.params.gridName;
    const fieldName = req.params.field;
    if (grids[gridName]) {
        delete grids[gridName][fieldName];
        res.json({ attributes: grids[gridName] });
    } else {
        res.status(404).json({ error: 'Grid not found' });
    }
});

// Add a new field to all grid features
app.post('/api/grids/add-field-to-all', (req, res) => {
    const { fieldName, fieldValue } = req.body;
    if (!fieldName) {
        return res.status(400).json({ error: 'Field name is required' });
    }

    fs.readFile(geojsonFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading GeoJSON file:', err);
            return res.status(500).json({ error: 'Error reading GeoJSON file' });
        }

        const geojson = JSON.parse(data);
        geojson.features.forEach(feature => {
            feature.properties[fieldName] = fieldValue;
            const gridId = feature.properties.Grid;
            grids[gridId] = feature.properties; // Update the in-memory grids object
        });

        fs.writeFile(geojsonFilePath, JSON.stringify(geojson, null, 4), (err) => {
            if (err) {
                console.error('Error writing GeoJSON file:', err);
                return res.status(500).json({ error: 'Error writing GeoJSON file' });
            }

            res.json({ message: 'Field added to all grid features successfully' });
        });
    });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
