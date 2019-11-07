
import neatCSV from 'neat-csv';
const fs = require('fs').promises;

/*
Reads the CSV async
*/
export const readFile = async (file) => {
    const csv = await fs.readFile(file)
    const data = await neatCSV(csv)
    return data
}