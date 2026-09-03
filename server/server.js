const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");

const app = express();

app.use(express.json());
app.use(cors());


// ==========================================
// RISK CATEGORIES
// ==========================================

const riskyCategories = {
  security: ["password", "login", "auth"],
  payment: ["payment", "transaction", "checkout"],
  database: ["database", "sql", "query"],
  api: ["api", "fetch", "request"]
};


// ==========================================
// FILE NAME CATEGORIES
// ==========================================

const fileCategories = {
  security: ["auth", "login", "security"],
  payment: ["payment", "checkout"],
  database: ["database", "db"],
  api: ["api", "service"]
};


// ==========================================
// CATEGORY WEIGHTS
// ==========================================

const categoryWeights = {
  security: 20,
  payment: 15,
  database: 12,
  api: 10
};


// ==========================================
// ANALYZE CODE CHANGE
// ==========================================

app.post("/api/analyze", (req, res) => {

  const {
    fileName,
    codeDiff,
    previousBugs,
    testsPassed
  } = req.body;


  // ------------------------------------------
  // Prepare diff
  // ------------------------------------------

  const diff = codeDiff || "";

  const lines = diff.split("\n");


  // ------------------------------------------
  // Count added and deleted lines
  // ------------------------------------------

  let added = 0;
  let deleted = 0;

  lines.forEach(line => {

    if (
      line.startsWith("+") &&
      !line.startsWith("+++")
    ) {
      added++;
    }

    if (
      line.startsWith("-") &&
      !line.startsWith("---")
    ) {
      deleted++;
    }

  });


  const totalLinesChanged = added + deleted;


  // ------------------------------------------
  // Prepare filenames
  // ------------------------------------------

  const fileNameList = Array.isArray(fileName)
    ? fileName
    : [fileName || ""];


  const lowerCaseFileNames = fileNameList.map(name =>
    String(name).toLowerCase()
  );


  // ==========================================
  // DETECT CATEGORIES FROM FILE NAMES
  // ==========================================

  const matchedFileCategories = [];

  for (const category in fileCategories) {

    const keywords = fileCategories[category];

    const matched = keywords.some(keyword =>
      lowerCaseFileNames.some(name =>
        name.includes(keyword)
      )
    );

    if (matched) {
      matchedFileCategories.push(category);
    }

  }


  // ==========================================
  // GET ONLY ADDED CODE
  // ==========================================

  const addedLines = lines
    .filter(line =>
      line.startsWith("+") &&
      !line.startsWith("+++")
    )
    .map(line =>
      line.substring(1)
    )
    .join("\n");


  const lowerCaseAddedCode = addedLines.toLowerCase();


  // ==========================================
  // CHECK IF ANALYZER ITSELF WAS MODIFIED
  // ==========================================

  const analyzerFileChanged = lowerCaseFileNames.some(name =>
    name.endsWith("server.js")
  );


  // ==========================================
  // RISK REASONS
  // ==========================================

  const reasons = [];

  const detectedCategories = [];


  // ==========================================
  // BASE SCORE
  // ==========================================

  let score = 30;


  // ==========================================
  // CHANGE SIZE RISK
  // ==========================================

  if (totalLinesChanged <= 10) {

    score += 10;

  } else if (totalLinesChanged <= 30) {

    score += 25;

  } else if (totalLinesChanged <= 60) {

    score += 40;

  } else {

    score += 55;

  }


  // ==========================================
  // CODE DELETION RISK
  // ==========================================

  if (deleted > 5) {

    score += 5;

    reasons.push(
      `Code deletion detected: ${deleted} lines were removed and should be reviewed.`
    );

  }


  // ==========================================
  // LARGE CODE ADDITION RISK
  // ==========================================

  if (added > 30) {

    score += 5;

    reasons.push(
      `Large amount of new code added: ${added} lines were introduced.`
    );

  }


  // ==========================================
  // RISK CATEGORY DETECTION
  // ==========================================

  for (const category in riskyCategories) {

    const keywords = riskyCategories[category];


    // ----------------------------------------
    // Filename detection
    // ----------------------------------------

    const detectedByFileName =
      matchedFileCategories.includes(category);


    // ----------------------------------------
    // Keyword detection
    //
    // Do not scan server.js for keywords
    // because server.js contains the risk
    // analyzer's own category definitions.
    // ----------------------------------------

    let detectedByCode = false;

    if (
      matchedFileCategories.length === 0 &&
      !analyzerFileChanged
    ) {

      detectedByCode = keywords.some(keyword => {

        const keywordPattern = new RegExp(
          `\\b${keyword}\\b`,
          "i"
        );

        return keywordPattern.test(lowerCaseAddedCode);

      });

    }


    const categoryDetected =
      detectedByFileName ||
      detectedByCode;


    // ----------------------------------------
    // Add category risk
    // ----------------------------------------

    if (categoryDetected) {

      score += categoryWeights[category] || 0;

      detectedCategories.push(category);


      if (category === "security") {

        reasons.push(
          "Security-sensitive change detected. Authentication or credential-related code was modified."
        );

      } else if (category === "payment") {

        reasons.push(
          "Payment-related change detected. Financial transaction code should receive additional review."
        );

      } else if (category === "database") {

        reasons.push(
          "Database-related change detected. Data access or query logic should receive additional review."
        );

      } else if (category === "api") {

        reasons.push(
          "API-related change detected. Request or service communication logic should receive additional review."
        );

      }

    }

  }


  // ==========================================
  // TEST STATUS
  // ==========================================

  if (testsPassed === false) {

    score += 10;

    reasons.push(
      "Tests failed: this change should be reviewed before shipping."
    );

  }


  // ==========================================
  // PREVIOUS BUG HISTORY
  // ==========================================

  const bugCount = Number(previousBugs) || 0;

  if (bugCount >= 3) {

    score += 10;

    reasons.push(
      `Bug history: this file has ${bugCount} previous bugs.`
    );

  }


  // ==========================================
  // LIMIT SCORE TO 100
  // ==========================================

  if (score > 100) {
    score = 100;
  }


  // ==========================================
  // DETERMINE RISK LEVEL
  // ==========================================

  let risk = "LOW";

  if (score > 70) {

    risk = "HIGH";

  } else if (score > 40) {

    risk = "MEDIUM";

  }


  // ==========================================
  // DEFAULT REASON
  // ==========================================

  if (reasons.length === 0) {

    reasons.push(
      "No major risk signals were detected in this change."
    );

  }


  // ==========================================
  // SEND RESULT
  // ==========================================

  res.json({

    score,

    risk,

    added,

    deleted,

    totalLinesChanged,

    categories: detectedCategories,

    reasons

  });

});


// ==========================================
// GIT DIFF ENDPOINT
// ==========================================

app.get("/api/git-diff", (req, res) => {

  exec("git diff", (error, stdout, stderr) => {

    if (error) {

      return res.status(500).json({
        error: "Failed to get Git diff"
      });

    }


    // ----------------------------------------
    // Extract changed filenames
    // ----------------------------------------

    const fileNameMatches = [
      ...stdout.matchAll(
        /^diff --git a\/(.+?) b\/.+$/gm
      )
    ];


    const fileNames = fileNameMatches.map(
      match => match[1]
    );


    // ----------------------------------------
    // Return diff + filenames
    // ----------------------------------------

    res.json({

      fileNames,

      diff: stdout

    });

  });

});


// ==========================================
// START SERVER
// ==========================================

app.listen(5000, () => {

  console.log(
    "Server running on http://localhost:5000"
  );

});