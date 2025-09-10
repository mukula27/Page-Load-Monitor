# Playwright Monitor

## Overview
Playwright Monitor is a Node.js project that automates the monitoring of web page load times using Playwright. It captures performance metrics for a list of websites, stores the results in a CSV file, and generates daily and weekly reports summarizing the load times.

## Features
- Measure load times for multiple websites.
- Store results in a structured CSV format.
- Generate summary reports with average load times.

## Project Structure
```
playwright-monitor
├── src
│   ├── monitor.js        # Main automation script for monitoring load times
│   ├── report.js         # Generates reports from collected data
│   └── utils
│       └── fileHandler.js # Utility functions for file operations
├── tests
│   └── example.spec.js   # Example tests for verifying functionality
├── data
│   └── results.csv       # Stores monitoring results
├── package.json          # npm configuration file
├── .gitignore            # Files and directories to ignore by Git
└── README.md             # Project documentation
```

## Setup Instructions
1. Clone the repository:
   ```
   git clone <repository-url>
   cd playwright-monitor
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure the list of websites to monitor in `src/monitor.js`.

## Usage
To run the monitoring script, execute:
```
node src/monitor.js
```

To generate reports, run:
```
node src/report.js
```

## Reporting
The results are stored in `data/results.csv`, which includes:
- Website URL
- Load time in seconds
- Timestamp

You can analyze the data to understand performance trends over time.

## Contributing
Feel free to submit issues or pull requests to improve the project.