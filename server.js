const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

// Load log file
const logFilePath = path.join(__dirname, "access.log");

// Function to process logs
function processLogs() {
  const logData = fs
    .readFileSync(logFilePath, "utf-8")
    .split("\n")
    .filter((line) => line.trim() !== "");

  const ipCounts = {};
  const hourlyCounts = new Array(24).fill(0);
  let totalRequests = 0;

  logData.forEach((line) => {
    const parts = line.match(/^(\d+\.\d+\.\d+\.\d+).*?(\d{2}):/);
    if (!parts) return;

    const ip = parts[1];
    const hour = parseInt(parts[2]);

    ipCounts[ip] = (ipCounts[ip] || 0) + 1;
    hourlyCounts[hour]++;
    totalRequests++;
  });

  // Convert IP counts to sorted array
  const ipSorted = Object.entries(ipCounts).sort((a, b) => b[1] - a[1]);

  // Compute IPs contributing to 85% of traffic
  let cumulative = 0,
    ipThreshold = 0.85 * totalRequests;
  let topIPs = [];
  for (let [ip, count] of ipSorted) {
    cumulative += count;
    topIPs.push({ ip, count });
    if (cumulative >= ipThreshold) break;
  }

  // Compute hours contributing to 70% of traffic
  let hourCumulative = 0,
    hourThreshold = 0.7 * totalRequests;
  let topHours = [];
  hourlyCounts.forEach((count, hour) => {
    if (hourCumulative >= hourThreshold) return;
    hourCumulative += count;
    topHours.push({ hour, count });
  });

  return { ipSorted, hourlyCounts, topIPs, topHours };
}

// API endpoint to get log analysis
app.get("/logs", (req, res) => {
  res.json(processLogs());
});

// Serve frontend
app.use(express.static(__dirname));

app.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`)
);
