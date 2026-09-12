const vscode = require("vscode");
const outputChannel = vscode.window.createOutputChannel(
  "Future Bug Simulator"
);

function activate(context) {
  console.log("Future Bug Simulator extension is active!");

  const disposable = vscode.commands.registerCommand(
    "futureBugSimulator.analyze",
    async () => {
      try {
//         await vscode.env.openExternal(
//   vscode.Uri.parse("http://localhost:5173")
// );
        const response = await fetch(
          "http://localhost:5000/api/git-diff"
        );

        if (!response.ok) {
          throw new Error("Backend request failed");
        }

        const data = await response.json();
        

      vscode.window.showInformationMessage(
  `Future Bug Simulator: ${data.fileNames.length} file(s) changed`
);
console.log("Starting risk analysis...");
const analysisResponse = await fetch(
  "http://localhost:5000/api/analyze",
  
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      fileName: data.fileNames,
      codeDiff: data.diff,
      previousBugs: 0,
      testsPassed: true
    })
  }
);

if (!analysisResponse.ok) {
  throw new Error("Analysis request failed");
}

const analysis = await analysisResponse.json();
console.log("Analysis result:", analysis);
vscode.window.showWarningMessage(
  `Risk: ${analysis.risk} | Score: ${analysis.score}/100 | ${analysis.totalLinesChanged} lines changed | Categories: ${analysis.categories.join(", ") || "none"}`

);

const realReasons = (analysis.reasons || []).filter(
  (reason) =>
    !reason.includes("No major risk signals were detected")
);

if (realReasons.length > 0) {
 const reasonsText = realReasons
    .map((reason) => `• ${reason}`)
    .join("\n");

  vscode.window.showWarningMessage(
    `Risk Signals:\n${reasonsText}`
  );
}



      }  catch (error) {
  console.error("Future Bug Simulator error:", error);

  vscode.window.showErrorMessage(
    `Future Bug Simulator error: ${error.message}`
  );
}
    }
  );
  

  context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};