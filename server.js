const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3000;

let grids = {
    "1": { "Grid": "A1", "Info": "Sample info" },
    "2": { "Grid": "A2", "Info": "Sample info" },
    "A44": { "Grid": "A44", "Info": "Sample info for A44" },
    // Add other grids here
};

app.use(cors());
app.use(bodyParser.json());

// Get grid information by OBJECTID
app.get('/api/grids/:id', (req, res) => {
    const gridId = req.params.id;
    const grid = grids[gridId];
    if (grid) {
        res.json({ attributes: grid });
    } else {
        res.status(404).json({ error: 'Grid not found' });
    }
});

// Get grid information by Grid name
app.get('/api/grids/name/:gridName', (req, res) => {
    const gridName = req.params.gridName;
    const grid = Object.values(grids).find(grid => grid.Grid === gridName);
    if (grid) {
        res.json({ attributes: grid });
    } else {
        res.status(404).json({ error: 'Grid not found' });
    }
});

// Update grid information
app.put('/api/grids/:id', (req, res) => {
    const gridId = req.params.id;
    const newInfo = req.body;
    grids[gridId] = { ...grids[gridId], ...newInfo };
    res.json({ attributes: grids[gridId] });
});

// Delete a specific field from the grid
app.delete('/api/grids/:id/:field', (req, res) => {
    const gridId = req.params.id;
    const fieldName = req.params.field;
    if (grids[gridId]) {
        delete grids[gridId][fieldName];
        res.json({ attributes: grids[gridId] });
    } else {
        res.status(404).json({ error: 'Grid not found' });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
