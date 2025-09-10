const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Path to the results CSV file
const resultsFilePath = path.join(__dirname, '../data/results.csv');
// Path to the summary report CSV file
const summaryReportPath = path.join(__dirname, '../data/summary_report.csv');

/**
 * Generates a summary report from the results CSV.
 * Calculates average load time and saves the summary to a new CSV file.
 */
function generateReport() {
  const loadTimes = [];

  fs.createReadStream(resultsFilePath)
    .pipe(csv())
    .on('data', (row) => {
      // Parse load time as float (handles both 'loadTime' and 'Load Time (s)' headers)
      const time = parseFloat(row.loadTime || row['Load Time (s)']);
      if (!isNaN(time)) loadTimes.push(time);
    })
    .on('end', () => {
      const averageLoadTime = loadTimes.reduce((acc, time) => acc + time, 0) / loadTimes.length;
      // Format timestamp in IST as HH:MM:SS DD-MM-YYYY
      const now = new Date();
      const istNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const pad = n => n.toString().padStart(2, '0');
      const formattedTimestamp = 
        `${pad(istNow.getHours())}:${pad(istNow.getMinutes())}:${pad(istNow.getSeconds())} ` +
        `${pad(istNow.getDate())}-${pad(istNow.getMonth() + 1)}-${istNow.getFullYear()}`;

      const report = {
        totalEntries: loadTimes.length,
        averageLoadTime: averageLoadTime.toFixed(2),
        timestamp: formattedTimestamp,
      };
      console.log('Report:', report);

      // Save the summary report to a CSV file
      const header = 'Total Entries,Average Load Time (s),Timestamp\n';
      const row = `${report.totalEntries},${report.averageLoadTime},${report.timestamp}\n`;

      // Write header if file doesn't exist
      if (!fs.existsSync(summaryReportPath)) {
        fs.writeFileSync(summaryReportPath, header);
      }
      fs.appendFileSync(summaryReportPath, row);

      console.log(`Summary report saved to ${summaryReportPath}`);
    });
}

module.exports = {
  generateReport,
};