
import { useState, useEffect } from "react";
import PredictionCard from "./PredictionCard";
import "./App.css";

function App() {
  const [fileName, setFileName] = useState("");
  const [codeDiff,setCodeDiff]=useState("");
  const [previousBugs, setPreviousBugs] = useState("");
  const [testsPassed, setTestsPassed] = useState(true);
  
  
  const [risk, setRisk] = useState("");
  const [score, setScore] = useState("");
  const [reasons, setReasons] = useState([]);
  const [history, setHistory] = useState(() => {
  const savedHistory = localStorage.getItem("history");

  return savedHistory ? JSON.parse(savedHistory) : [];
});
useEffect(() => {
  localStorage.setItem("history", JSON.stringify(history));
}, [history]);
  const [activePage, setActivePage] = useState("analyze");
  

  const handleAnalyze = async () => {
    const gitResponse = await fetch("http://localhost:5000/api/git-diff");
const gitData = await gitResponse.json();
setFileName(gitData.fileNames.join(","));
    const response = await fetch("http://localhost:5000/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName: gitData.fileNames.join(","),
        codeDiff: gitData.diff,
        previousBugs,
        testsPassed,
      }),
    });
console.log("Tests passed:", testsPassed);
    const data = await response.json();

    setRisk(data.risk);
    setScore(data.score);
    setReasons(data.reasons);
    setHistory((previousHistory)=>[
      {
      fileName:gitData.fileNames,
      risk:data.risk,
      score:data.score,
      time: new Date().toLocaleString(),
      categories:data.categories,
    },
      ...previousHistory,
    ]);
  };

  return (
    <div className="app">

      {/* SIDEBAR */}
      <aside className="sidebar">

        <div>
          <div className="brand">
            FUTURE
            <br />
            BUG
            <br />
            SIMULATOR
          </div>

          <div className="brand-line"></div>

          <nav>
            <p
  className={activePage === "analyze" ? "active-nav" : ""}
  onClick={() => setActivePage("analyze")}>
  ANALYZE
    </p>

<p
  className={activePage === "history" ? "active-nav" : ""}
  onClick={() => setActivePage("history")}
  >
  HISTORY
</p>
           
            <p>PROJECTS</p>
            <p>SETTINGS</p>
          </nav>
        </div>

        <div className="sidebar-footer">
          <p>Ship code with<br />fewer surprises.</p>
          <span>—</span>
          
        </div>

      </aside>

      {/* MAIN */}
<main className="main-content">

  {activePage === "analyze" ? (

    <>
      <header className="hero">
        <h1>ANALYZE CODE CHANGE_</h1>

        <div className="hero-line"></div>

        <p className="hero-copy">
          The scan reads the shape of the diff.
          <br />
          We'll flag where bugs are most likely to surface.
        </p>
      </header>

      <section className="scan-form">
      <div className="field diff-field">
  <label>CODE DIFF</label>

  <textarea
    value={codeDiff}
    placeholder="Paste code changes here..."
    onChange={(event) => setCodeDiff(event.target.value)}
  />
</div>

        <div className="field">
          <label>FILE</label>
          <input
            type="text"
            value={fileName}
            placeholder="payment.js"
            onChange={(event) => setFileName(event.target.value)}
          />
        </div>


        
        <div className="field">
          <label>PREVIOUS BUGS (THIS FILE)</label>
          <input
            type="number"
            value={previousBugs}
            placeholder="4"
            onChange={(event) => setPreviousBugs(event.target.value)}
          />
        </div>

        <div className="form-actions">

          <label className="test-check">
            <input
              type="checkbox"
              checked={testsPassed}
              onChange={(event) =>
                setTestsPassed(event.target.checked)
              }
            />
            TESTS PASSED
          </label>

          <button onClick={handleAnalyze}>
            ANALYZE RISK
            <span>→</span>
          </button>

        </div>

      </section>

      <div className="tear-divider">
        <span>SCAN READOUT</span>
      </div>

      {risk && (
        <PredictionCard
          risk={risk}
          score={score}
          reasons={reasons}
        />
      )}

      <section className="history-section">

        <div className="history-heading">
          <p className="section-label">RECENT SCANS</p>
          <span>{history.length} scans</span>
        </div>

        {history.length === 0 ? (

          <p className="empty-history">
            No scans yet. Run your first diagnostic.
          </p>

        ) : (

          <div className="history-list">

            {history.map((scan, index) => (

              <div className="history-row" key={index}>

                <div className="history-file">
                  <span className="file-marker"></span>
                  <strong>{scan.fileName}</strong>
                  <small>{scan.categories?.join(", ")}</small>
                </div>

                <span className="history-risk">
                  {scan.risk}
                </span>

                <span className="history-score">
                  {scan.score}/100
                </span>

              </div>

            ))}

          </div>

        )}

      </section>

    </>

  ) : (

    <section className="history-page">

      <p className="eyebrow">
        CODE DIAGNOSTICS / 02
      </p>
       
      <h1>SCAN HISTORY_</h1>

      <div className="hero-line"></div>

      <p className="hero-copy">
        A record of the changes we've already scanned.
      </p>

      <div className="history-list">

        {history.length === 0 ? (

          <p className="empty-history">
            No scans yet. Run your first diagnostic.
          </p>

        ) : (

          history.map((scan, index) => (

            <div className="history-row" key={index}>

  <div className="history-file">
    <span className="file-marker"></span>

    <div>
      <strong>{scan.fileName}</strong>
      <small>CODE CHANGE SCAN</small>
    </div>
  </div>

  <div className="history-risk">
    <small>RISK</small>
    <strong>{scan.risk}</strong>
  </div>


  <div className="history-score">
    <small>SCORE</small>
    <strong>{scan.score}/100</strong>
  </div>
  <div className="history-time">
    <small>{scan.time}</small>
    </div>
</div>

              

          ))

        )}

      </div>

    </section>

  )}

</main>
    </div>
  );
}

export default App;