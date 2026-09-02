const express=require("express");
const cors =require("cors");
const app=express();
app.use(express.json());
app.use(cors());
app.get("/",(req,res)=>{
    res.send("Future Bug Simulator Server is running");
});
app.get("/api/test",(req,res)=>{
    res.json({
        message:"Future Bug Simulator is working!"
    })

});
app.post("/api/analyze",(req,res)=>{
    const {
  fileName,
  codeDiff,
  previousBugs,
  testsPassed
} = req.body;

let added = 0;
let deleted = 0;
const reasons = [];
const detectedCategories=[];
   const riskyCategories = {
  security: ["password", "login", "auth"],
  payment: ["payment", "transaction", "checkout"],
  database: ["database", "sql", "query"],
  api: ["api", "fetch", "request"]
};
const fileCategories = {
  security: ["auth", "login", "security"],
  payment: ["payment", "checkout"],
  database: ["database", "db"],
  api: ["api", "service"]
};


const lines = codeDiff.split("\n");
const lowerCaseDiff = codeDiff.toLowerCase();
const lowerCaseFileName = fileName.toLowerCase();
const matchedFileCategories = [];

for (const category in fileCategories) {
  const fileKeywords = fileCategories[category];

  if (fileKeywords.some(keyword =>
    lowerCaseFileName.includes(keyword)
  )) {
    matchedFileCategories.push(category);
  }
}

for (const line of lines) {
  if (line.startsWith("+")) {
    added++;
  }

  if (line.startsWith("-")) {
    deleted++;
  }
}
    console.log("Added:", added);
    console.log("Deleted:", deleted);
    console.log("Code changed received");
    console.log("File:",fileName);
    console.log("Previous Bugs:",previousBugs);
    console.log("Tests passed:",testsPassed);

    const totalLinesChanged = added + deleted;

if (totalLinesChanged <= 30) {
  reasons.push(
    `Change surface: ${totalLinesChanged} lines were modified.`
  );
}

if (totalLinesChanged > 30) {
  reasons.push(
    `Large code change: ${totalLinesChanged} lines were modified.`
  );
}
    let risk="LOW";
    if(totalLinesChanged>50){
        risk="MEDIUM";
    }
    if(totalLinesChanged>100){
        risk="HIGH";
    }

    let score=30;
    if (totalLinesChanged <= 10) {
    score += 10;
} else if (totalLinesChanged <= 30) {
    score += 25;
} else if (totalLinesChanged <= 60) {
    score += 40;
} else {
    score += 55;
}
for (const category in riskyCategories) {
const keywords = riskyCategories[category];

for(const keyword of keywords){
 if (
  matchedFileCategories.includes(category) ||
  (matchedFileCategories.length === 0 && lowerCaseDiff.includes(keyword))
) {
    score += category === "security" ? 15 : 10;
    detectedCategories.push(category);

reasons.push(
  category === "security"
  ? "Security-sensitive change detected. Authentication or credential-related code was modified."
  : category === "payment"
  ? "Payment-related change detected. Financial transaction code should receive additional review."
  : category === "database"
? "Database-related change detected. Data access or query logic should receive additional review."
: category === "api"
? "API-related change detected. Request or service communication logic should receive additional review."
: `Risky area detected: ${category}.`
);
    break;
  }
}
}
if(testsPassed==false){
    score+=10;
    reasons.push(`Tests failed:this change should be reviewed before shipping`);
}
  
    if(previousBugs>=3){
        score+=10;
        reasons.push(`Bug history:this file has ${previousBugs} previous bugs`);
    }
   
    if (score > 100) {
    score = 100;
    }
    

    if (score > 40) {
    risk = "MEDIUM";
    }

    if (score > 70) {
    risk = "HIGH";
    }
    res.json({
        message:"Code change received succesfully",
        fileName:fileName,
        risk:risk,
        score:score,
        reasons:reasons,
        categories:detectedCategories
    })
});
app.listen(5000,()=>{
    console.log("Server running on port 5000");
});
