const { chromium } = require('playwright');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');
const path = require('path');
const express = require('express');

// List of websites to monitor (in-memory, not persistent)
let websites = [
  "https://flocard.app/",
  "https://floco.in/",
  "https://floco.in/mukul0412"
];

// CSV file path
const csvPath = path.join(__dirname, '../data/results.csv');

// Threshold in seconds for alert
const LOAD_TIME_THRESHOLD = 3;

// Prepare CSV writer
const csvWriter = createCsvWriter({
  path: csvPath,
  header: [
    { id: 'url', title: 'URL' },
    { id: 'loadTime', title: 'Load Time (s)' },
    { id: 'timestamp', title: 'Timestamp' },
  ],
  append: true, // Store all runs
});

// Helper to format IST timestamp as HH:MM:SS DD-MM-YYYY
function getISTTimestamp() {
  const now = new Date();
  const istNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const pad = n => n.toString().padStart(2, '0');
  return `${pad(istNow.getHours())}:${pad(istNow.getMinutes())}:${pad(istNow.getSeconds())} ${pad(istNow.getDate())}-${pad(istNow.getMonth() + 1)}-${istNow.getFullYear()}`;
}

// Function to run monitoring and return results
async function runMonitor() {
  const browser = await chromium.launch();
  const results = [];
  let totalLoadTime = 0;

  for (const url of websites) {
    const page = await browser.newPage();
    const start = Date.now();
    await page.goto(url, { waitUntil: 'load' });
    const end = Date.now();
    const loadTime = ((end - start) / 1000).toFixed(3);
    totalLoadTime += parseFloat(loadTime);

    const timestamp = getISTTimestamp();
    results.push({ url, loadTime, timestamp });

    await page.close();
  }

  await browser.close();
  await csvWriter.writeRecords(results);

  const avgLoadTime = (totalLoadTime / websites.length).toFixed(3);
  return { results, avgLoadTime };
}

// Function to read latest results from CSV
function readResults() {
  if (!fs.existsSync(csvPath)) return [];
  const data = fs.readFileSync(csvPath, 'utf-8').trim().split('\n');
  if (data.length < 2) return [];
  const rows = data.slice(1).map(line => {
    const values = line.split(',');
    return {
      url: values[0],
      loadTime: values[1],
      timestamp: values[2]
    };
  });
  // Only show the last N results (current run)
  const N = websites.length;
  return rows.slice(-N);
}

// Express app for UI
const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

app.post('/add', (req, res) => {
  const newUrl = req.body.newUrl?.trim();
  if (
    newUrl &&
    /^https?:\/\/.+\..+/.test(newUrl) && // basic URL validation
    !websites.includes(newUrl)
  ) {
    websites.push(newUrl);
  }
  res.redirect('/');
});

app.get('/remove', (req, res) => {
  const urlToRemove = req.query.url;
  if (urlToRemove) {
    websites = websites.filter(site => site !== urlToRemove);
  }
  res.redirect('/');
});

app.get('/', (req, res) => {
  const results = readResults();
  let tableRows = results.map(r => `
    <tr>
      <td>${r.url}</td>
      <td>${r.loadTime}</td>
      <td>${r.timestamp}</td>
    </tr>
  `).join('');
  if (!tableRows) tableRows = '<tr><td colspan="3">No data yet</td></tr>';

  // Calculate average load time
  let avgLoadTime = '';
  if (results.length) {
    avgLoadTime = (
      results.reduce((sum, r) => sum + parseFloat(r.loadTime), 0) / results.length
    ).toFixed(3);
  }

  // Website list with remove buttons
  let websiteList = websites.map(site => `
    <li>
      ${site}
      <a href="/remove?url=${encodeURIComponent(site)}" style="color:#d8000c; margin-left:10px; text-decoration:none;" onclick="return confirm('Remove this website?');">🗑️ Remove</a>
    </li>
  `).join('');

  res.send(`
    <html>
      <head>
        <title>Web Page Load Monitor</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link href="https://fonts.googleapis.com/css?family=Roboto:400,700&display=swap" rel="stylesheet">
        <style>
          body {
            margin: 0;
            padding: 0;
            min-height: 100vh;
            background: linear-gradient(135deg, #74ebd5 0%, #ACB6E5 100%);
            font-family: 'Roboto', Arial, sans-serif;
          }
          .container {
            max-width: 950px;
            margin: 40px auto;
            background: #fff;
            border-radius: 18px;
            box-shadow: 0 8px 32px rgba(44, 62, 80, 0.18);
            padding: 36px 28px 28px 28px;
            animation: fadeIn 1s;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(40px);}
            to { opacity: 1; transform: none;}
          }
          h1 {
            text-align: center;
            color: #2d3a4b;
            margin-bottom: 8px;
            letter-spacing: 1px;
            font-size: 2.5rem;
            font-weight: 700;
          }
          .websites-section {
            margin-bottom: 18px;
          }
          ul.websites { list-style: none; padding: 0; margin: 0 0 0 0; }
          ul.websites li { margin: 6px 0; font-size: 16px; }
          .add-form {
            display: flex;
            gap: 10px;
            margin-bottom: 18px;
          }
          .add-form input[type="text"] {
            flex: 1;
            padding: 10px;
            font-size: 16px;
            border: 1px solid #b0b0b0;
            border-radius: 5px;
          }
          .add-form button {
            padding: 10px 18px;
            font-size: 16px;
            border: none;
            border-radius: 5px;
            background: linear-gradient(90deg, #28a745 0%, #6ddf6d 100%);
            color: #fff;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s;
          }
          .add-form button:hover {
            background: linear-gradient(90deg, #1e7e34 0%, #4ecb4e 100%);
          }
          form {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 12px;
            margin-bottom: 22px;
          }
          button, .download-btn {
            padding: 13px 32px;
            font-size: 17px;
            margin: 0 5px;
            border: none;
            border-radius: 7px;
            cursor: pointer;
            transition: background 0.2s, box-shadow 0.2s, transform 0.1s;
            box-shadow: 0 2px 8px rgba(44, 62, 80, 0.08);
            font-weight: 600;
          }
          button {
            background: linear-gradient(90deg, #0078d4 0%, #00c6fb 100%);
            color: #fff;
          }
          button:hover {
            background: linear-gradient(90deg, #005fa3 0%, #00a6c9 100%);
            transform: translateY(-2px) scale(1.03);
          }
          .download-btn {
            background: linear-gradient(90deg, #28a745 0%, #6ddf6d 100%);
            color: #fff;
            text-decoration: none;
          }
          .download-btn:hover {
            background: linear-gradient(90deg, #1e7e34 0%, #4ecb4e 100%);
            transform: translateY(-2px) scale(1.03);
          }
          .summary {
            margin: 18px 0 10px 0;
            font-size: 22px;
            text-align: center;
            color: #2d3a4b;
            font-weight: 500;
          }
          h2 {
            text-align: center;
            color: #444;
            margin-top: 28px;
            font-size: 1.5rem;
            letter-spacing: 0.5px;
          }
          table {
            border-collapse: collapse;
            width: 100%;
            margin-top: 18px;
            background: #fafbfc;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(44,62,80,0.04);
          }
          th, td {
            border: 1px solid #e3e6ea;
            padding: 14px 10px;
            text-align: center;
            font-size: 17px;
          }
          th {
            background: #f3f6fa;
            color: #0078d4;
            font-weight: 700;
            letter-spacing: 0.5px;
          }
          tr:nth-child(even) td {
            background: #f7fafd;
          }
          tr:hover td {
            background: #e6f0fa;
            transition: background 0.2s;
          }
          @media (max-width: 700px) {
            .container { padding: 10px 2vw; }
            table, th, td { font-size: 13px; }
            button, .download-btn { font-size: 13px; padding: 10px 10px; }
            h1 { font-size: 1.5rem; }
          }
        </style>
        <script>
          function confirmRun() {
            return confirm('Are you sure you want to run monitoring now?');
          }
        </script>
      </head>
      <body>
        <div class="container">
          <h1>🚦 Web Page Load Monitor</h1>
          <div class="websites-section">
            <b>Websites to Monitor:</b>
            <ul class="websites">
              ${websiteList}
            </ul>
            <form class="add-form" method="POST" action="/add">
              <input type="text" name="newUrl" placeholder="Add new website URL (https://...)" required>
              <button type="submit">Add Website</button>
            </form>
          </div>
          <form method="POST" action="/run" onsubmit="return confirmRun();">
            <button type="submit">Run Monitoring Now</button>
            <a href="/download" class="download-btn">Download Latest Report (CSV)</a>
          </form>
          <div class="summary">
            ${avgLoadTime ? `Average Load Time: <b>${avgLoadTime} s</b>` : ''}
          </div>
          <h2>Latest Results</h2>
          <table>
            <tr>
              <th>URL</th>
              <th>Load Time (s)</th>
              <th>Timestamp (IST)</th>
            </tr>
            ${tableRows}
          </table>
        </div>
      </body>
    </html>
  `);
});

app.post('/run', async (req, res) => {
  await runMonitor();
  res.redirect('/');
});

// Download CSV endpoint
app.get('/download', (req, res) => {
  if (!fs.existsSync(csvPath)) {
    return res.status(404).send('No report available.');
  }
  res.download(csvPath, 'results.csv');
});

app.listen(3000, () => {
  console.log('UI available at http://localhost:3000');
});