const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");

const app = express();

app.use(express.json());
app.use(cors());



// RISK CATEGORIES


const riskyCategories = {
  security: ["password", "login", "auth"],
  payment: [
    "paymentgateway",
    "processpayment(",
    "createpayment(",
    "charge(",
    "transaction.",
    "checkout("
  ],
  database: ["database", "sql", "query"],
  api: ["fetch(", "axios", "http://", "https://"]
};


// FILE NAME CATEGORIES


const fileCategories = {
  security: ["auth", "login", "security"],
  payment: ["payment", "checkout"],
  database: ["database", "db"],
  api: ["api", "service"]
};



// CATEGORY WEIGHTS
const categoryWeights = {
  security: 20,
  payment: 15,
  database: 12,
  api: 10
};



// ANALYZE CODE CHANGE


app.post("/api/analyze", (req, res) => {
  console.log("ANALYZE endpoint hit");

  const {
    fileName,
    codeDiff,
    previousBugs,
    testsPassed
  } = req.body;


  

  const diff = codeDiff || "";

  const lines = diff.split("\n");


  

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


  
  // Prepare filenames
 

  const fileNameList = Array.isArray(fileName)
    ? fileName
    : [fileName || ""];


  const lowerCaseFileNames = fileNameList.map(name =>
    String(name).toLowerCase()
  );


 
  // DETECT CATEGORIES FROM FILE NAMES


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


 
  // GET ONLY ADDED CODE
  

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
  


  
  // CHECK IF ANALYZER ITSELF WAS MODIFIED
 
  const analyzerFileChanged = lowerCaseFileNames.some(name =>
    name.endsWith("server.js")
  );


  
  // RISK REASONS


  const reasons = [];

  const detectedCategories = [];
  if (
  lowerCaseAddedCode.includes("todo") ||
  lowerCaseAddedCode.includes("fixme")
) {
  reasons.push(
    "TODO/FIXME detected in new code. This change may contain unfinished work."
  );
}


  
  // BASE SCORE
  

  let score = 30;


 
  // CHANGE SIZE RISK
  
  if (totalLinesChanged <= 10) {

    score += 10;

  } else if (totalLinesChanged <= 30) {

    score += 25;

  } else if (totalLinesChanged <= 60) {

    score += 40;

  } else {

    score += 55;

  }


  
  // CODE DELETION RISK


  if (deleted > 5) {

    score += 5;

    reasons.push(
      `Code deletion detected: ${deleted} lines were removed and should be reviewed.`
    );

  }


 
  // LARGE CODE ADDITION RISK
  

  if (added > 30) {

    score += 5;

    reasons.push(
      `Large amount of new code added: ${added} lines were introduced.`
    );

  }


  
  // RISK CATEGORY DETECTION

  for (const category in riskyCategories) {

    const keywords = riskyCategories[category];


   
    // Filename detection
  

    const detectedByFileName =
      matchedFileCategories.includes(category);




    let detectedByCode = false;

   

      detectedByCode = keywords.some(keyword =>
  lowerCaseAddedCode.includes(keyword.toLowerCase())
);
  


    const categoryDetected =
      detectedByFileName ||
      detectedByCode;


    
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



  if (testsPassed === false) {

    score += 10;

    reasons.push(
      "Tests failed: this change should be reviewed before shipping."
    );

  }


 

  const bugCount = Number(previousBugs) || 0;

  if (bugCount >= 3) {

    score += 10;

    reasons.push(
      `Bug history: this file has ${bugCount} previous bugs.`
    );

  }


 

  if (score > 100) {
    score = 100;
  }


 

  let risk = "LOW";

  if (score > 70) {

    risk = "HIGH";

  } else if (score > 40) {

    risk = "MEDIUM";

  }


  

  if (reasons.length === 0) {

    reasons.push(
      "No major risk signals were detected in this change."
    );

  }


 

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




app.get("/api/git-diff", (req, res) => {

  exec("git -C .. diff", (error, stdout, stderr) => {

    if (error) {

      return res.status(500).json({
        error: "Failed to get Git diff"
      });

    }


    
    
    const fileNameMatches = [
      ...stdout.matchAll(
        /^diff --git a\/(.+?) b\/.+$/gm
      )
    ];


    const fileNames = fileNameMatches.map(
      match => match[1]
    );


    
    const fileDiffs = stdout
  .split(/^diff --git /gm)
  .filter(section => section.trim() !== "")
  .map(section => {

    const firstLine = section.split("\n")[0];

    const match = firstLine.match(
      /a\/(.+?) b\/(.+)$/
    );

    return {
      fileName: match ? match[2] : "unknown",
      diff: "diff --git " + section
    };

  });


res.json({

  fileNames,

  diff: stdout,

  files: fileDiffs

});
  });

});



// START SERVER

app.listen(5000, () => {

  console.log(
    "Server running on http://localhost:5000"
  );

});