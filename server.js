const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
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

// Delete a field from all grid features
app.delete('/api/grids/delete-field-from-all/:fieldName', (req, res) => {
    const fieldName = req.params.fieldName;

    fs.readFile(geojsonFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading GeoJSON file:', err);
            return res.status(500).json({ error: 'Error reading GeoJSON file' });
        }

        const geojson = JSON.parse(data);
        geojson.features.forEach(feature => {
            delete feature.properties[fieldName];
            const gridId = feature.properties.Grid;
            delete grids[gridId][fieldName]; // Update the in-memory grids object
        });

        fs.writeFile(geojsonFilePath, JSON.stringify(geojson, null, 4), (err) => {
            if (err) {
                console.error('Error writing GeoJSON file:', err);
                return res.status(500).json({ error: 'Error writing GeoJSON file' });
            }

            res.json({ message: 'Field deleted from all grid features successfully' });
        });
    });
});

// Export grid information to an Excel file
app.get('/api/grids/export', (req, res) => {
    const workbook = XLSX.utils.book_new();
    const sheetData = [];

    for (const gridId in grids) {
        if (grids.hasOwnProperty(gridId)) {
            sheetData.push(grids[gridId]);
        }
    }

    const worksheet = XLSX.utils.json_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Grids');

    const filePath = path.join(__dirname, 'grids.xlsx');
    XLSX.writeFile(workbook, filePath);

    res.download(filePath, 'grids.xlsx', (err) => {
        if (err) {
            console.error('Error downloading Excel file:', err);
            res.status(500).json({ error: 'Error downloading Excel file' });
        }
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error('Error deleting Excel file:', err);
            }
        });
    });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
