const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const resultsFilePath = path.join(__dirname, '../../data/results.csv');

const writeResultsToCSV = (data) => {
  const csvData = data.map(row => `${row.url},${row.loadTime},${row.timestamp}`).join('\n');
  fs.appendFileSync(resultsFilePath, csvData + '\n', 'utf8');
};

const readResultsFromCSV = () => {
  const fileContent = fs.readFileSync(resultsFilePath, 'utf8');
  return parse(fileContent, {
    columns: true,
    skip_empty_lines: true
  });
};

module.exports = {
  writeResultsToCSV,
  readResultsFromCSV
};