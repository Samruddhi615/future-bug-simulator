import { useState, useEffect } from "react";
import PredictionCard from "./PredictionCard";
import "./App.css";

function App() {
  const [fileName, setFileName] = useState("");
  const [codeDiff, setCodeDiff] = useState("");
  const [previousBugs, setPreviousBugs] = useState("");
  const [testsPassed, setTestsPassed] = useState(true);

  const [risk, setRisk] = useState("");
  const [score, setScore] = useState("");
  const [reasons, setReasons] = useState([]);
  const [fileResults, setFileResults] = useState([]);

  const [history, setHistory] = useState(() => {
    const savedHistory = localStorage.getItem("history");

    return savedHistory ? JSON.parse(savedHistory) : [];
  });

  const [activePage, setActivePage] = useState("analyze");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    localStorage.setItem("history", JSON.stringify(history));
  }, [history]);


  // ==========================================
  // ANALYZE CODE
  // ==========================================

  const handleAnalyze = async () => {
    try {
      setLoading(true);
      setError("");

      // ----------------------------------------
      // Get Git diff
      // ----------------------------------------

      const gitResponse = await fetch(
        "http://localhost:5000/api/git-diff"
      );

      if (!gitResponse.ok) {
        throw new Error("Unable to get Git diff.");
      }

      const gitData = await gitResponse.json();


      // ----------------------------------------
      // Get changed files
      // ----------------------------------------

      const changedFiles = gitData.fileNames || [];

      const fileDiffs = gitData.files || [];

      console.log("Changed files:", changedFiles);
      console.log("File diffs:", fileDiffs);


      // ----------------------------------------
      // Update file name in UI
      // ----------------------------------------

      setFileName(changedFiles.join(","));


      // ----------------------------------------
      // Analyze the Git diff
      // ----------------------------------------

      const response = await fetch(
        "http://localhost:5000/api/analyze",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            fileName: changedFiles,
            codeDiff: gitData.diff || codeDiff,
            previousBugs,
            testsPassed,
          }),
        }
      );


      if (!response.ok) {
        throw new Error("Unable to analyze the code change.");
      }


      const data = await response.json();
      const individualResults = await Promise.all(
  fileDiffs.map(async (file) => {
    const fileResponse = await fetch(
      "http://localhost:5000/api/analyze",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: file.fileName,
          codeDiff: file.diff,
          previousBugs,
          testsPassed,
        }),
      }
    );

    return {
      fileName: file.fileName,
      ...(await fileResponse.json()),
    };
  })
);

setFileResults(individualResults);


      console.log(
        "Tests passed:",
        testsPassed
      );


      console.log(
        "Analysis result:",
        data
      );


      // ----------------------------------------
      // Update prediction
      // ----------------------------------------

      setRisk(data.risk);
      setScore(data.score);
      setReasons(data.reasons || []);


      // ----------------------------------------
      // Save scan to history
      // ----------------------------------------

      setHistory((previousHistory) => [
        {
          fileName: changedFiles.join(", "),
          risk: data.risk,
          score: data.score,
          time: new Date().toLocaleString(),
          categories: data.categories || [],
        },

        ...previousHistory,
      ]);


    } catch (error) {

      console.error(error);

      setError(
        error.message ||
        "Something went wrong while analyzing the code."
      );

    } finally {

      setLoading(false);

    }
  };


  return (
    <div className="app">


      {/* ======================================
          SIDEBAR
      ====================================== */}

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
              className={
                activePage === "analyze"
                  ? "active-nav"
                  : ""
              }
              onClick={() =>
                setActivePage("analyze")
              }
            >
              ANALYZE
            </p>


            <p
              className={
                activePage === "history"
                  ? "active-nav"
                  : ""
              }
              onClick={() =>
                setActivePage("history")
              }
            >
              HISTORY
            </p>



<p
  className={
    activePage === "projects"
      ? "active-nav"
      : ""
  }
  onClick={() => setActivePage("projects")}
>
  PROJECTS
</p>


            <p
  className={
    activePage === "settings"
      ? "active-nav"
      : ""
  }
  onClick={() => setActivePage("settings")}
>
  SETTINGS
</p>

          </nav>

        </div>


        <div className="sidebar-footer">

          <p>
            Ship code with
            <br />
            fewer surprises.
          </p>

          <span>
            —
          </span>

        </div>

      </aside>


      {/* ======================================
          MAIN CONTENT
      ====================================== */}

      <main className="main-content">


       {activePage === "analyze" ? (

          <>


            {/* =================================
                HERO
            ================================= */}

            <header className="hero">

              <h1>
                ANALYZE CODE CHANGE_
              </h1>

              <div className="hero-line"></div>

              <p className="hero-copy">
                The scan reads the shape of the diff.
                <br />
                We'll flag where bugs are most likely
                to surface.
              </p>

            </header>


            {/* =================================
                SCAN FORM
            ================================= */}

            <section className="scan-form">


              <div className="field diff-field">

                <label>
                  CODE DIFF
                </label>

                <textarea
                  value={codeDiff}
                  placeholder="Paste code changes here..."
                  onChange={(event) =>
                    setCodeDiff(event.target.value)
                  }
                />

              </div>


              <div className="field">

                <label>
                  FILE
                </label>

                <input
                  type="text"
                  value={fileName}
                  placeholder="payment.js"
                  onChange={(event) =>
                    setFileName(event.target.value)
                  }
                />

              </div>


              <div className="field">

                <label>
                  PREVIOUS BUGS (THIS FILE)
                </label>

                <input
                  type="number"
                  value={previousBugs}
                  placeholder="4"
                  onChange={(event) =>
                    setPreviousBugs(event.target.value)
                  }
                />

              </div>


              <div className="form-actions">


                <label className="test-check">

                  <input
                    type="checkbox"
                    checked={testsPassed}
                    onChange={(event) =>
                      setTestsPassed(
                        event.target.checked
                      )
                    }
                  />

                  TESTS PASSED

                </label>


                <button
                  onClick={handleAnalyze}
                  disabled={loading}
                >

                  {loading
                    ? "ANALYZING..."
                    : "ANALYZE RISK"
                  }

                  {!loading && (
                    <span>
                      →
                    </span>
                  )}

                </button>

              </div>

            </section>


            {/* =================================
                ERROR
            ================================= */}

            {error && (

              <div className="error-message">

                {error}

              </div>

            )}


            {/* =================================
                SCAN READOUT
            ================================= */}

            <div className="tear-divider">

              <span>
                SCAN READOUT
              </span>

            </div>


            {risk && (

              <PredictionCard
                risk={risk}
                score={score}
                reasons={reasons}
              />

            )}
            {fileResults.length > 0 && (
  <section className="file-results">

    <div className="history-heading">
      <p className="section-label">FILE-BY-FILE RISK</p>
      <span>{fileResults.length} files</span>
    </div>

    <div className="history-list">

      {fileResults.map((file, index) => (
        <div className="history-row" key={index}>

          <div className="history-file">
            <span className="file-marker"></span>

            <div>
              <strong>{file.fileName}</strong>

              <small>
                {file.categories?.length > 0
                  ? file.categories.join(", ")
                  : "NO RISK CATEGORY"}
              </small>
            </div>
          </div>

          <div className="history-risk">
            <small>RISK</small>
            <strong>{file.risk}</strong>
          </div>

          <div className="history-score">
            <small>SCORE</small>
            <strong>{file.score}/100</strong>
          </div>

        </div>
      ))}

    </div>

  </section>
)}


            {/* =================================
                RECENT SCANS
            ================================= */}

            <section className="history-section">


              <div className="history-heading">

                <p className="section-label">
                  RECENT SCANS
                </p>

                <span>
                  {history.length} scans
                </span>

              </div>


              {history.length === 0 ? (

                <p className="empty-history">
                  No scans yet. Run your first
                  diagnostic.
                </p>

              ) : (

                <div className="history-list">

                  {history.map(
                    (scan, index) => (

                      <div
                        className="history-row"
                        key={index}
                      >


                        <div className="history-file">

                          <span className="file-marker"></span>

                          <strong>
                            {Array.isArray(scan.fileName)
                              ? scan.fileName.join(", ")
                              : scan.fileName}
                          </strong>

                          <small>
                            {scan.categories?.join(", ")}
                          </small>

                        </div>


                        <span className="history-risk">
                          {scan.risk}
                        </span>


                        <span className="history-score">
                          {scan.score}/100
                        </span>


                      </div>

                    )
                  )}

                </div>

              )}

            </section>

          </>

       ) : activePage === "projects" ? (

  <section className="projects-page">

    <p className="eyebrow">
      CODE DIAGNOSTICS / 03
    </p>

    <h1>
      PROJECTS_
    </h1>

    <div className="hero-line"></div>

    <p className="hero-copy">
      Manage the projects connected to
      <br />
      your code diagnostics.
    </p>

    <div className="projects-list">

      <div className="project-card">

        <div className="history-file">
          <span className="file-marker"></span>

          <div>
            <strong>Future Bug Simulator</strong>

            <small>
              CODE CHANGE RISK ANALYSIS
            </small>
          </div>
        </div>

        <div className="history-risk">
          <small>STATUS</small>
          <strong>ACTIVE</strong>
        </div>

        <div className="history-score">
          <small>TYPE</small>
          <strong>WEB APP</strong>
        </div>

      </div>

    </div>

 </section>



) : activePage === "settings" ? (

  <section className="settings-page">

    <p className="eyebrow">
      CODE DIAGNOSTICS / 04
    </p>

    <h1>
      SETTINGS_
    </h1>

    <div className="hero-line"></div>

    <p className="hero-copy">
      Configure how Future Bug Simulator
      <br />
      analyzes your code changes.
    </p>

    <div className="settings-list">

      <div className="setting-row">
        <div>
          <strong>RISK ANALYSIS</strong>
          <small>Rule-based code change analysis</small>
        </div>

        <strong>ACTIVE</strong>
      </div>

      <div className="setting-row">
        <div>
          <strong>GIT INTEGRATION</strong>
          <small>Analyze changes from the Git repository</small>
        </div>

        <strong>ACTIVE</strong>
      </div>

      <div className="setting-row">
        <div>
          <strong>SCAN HISTORY</strong>
          <small>Store previous scans in browser storage</small>
        </div>

        <strong>ACTIVE</strong>
      </div>

    </div>

  </section>

) : (

  // History page

  <section className="history-page">

    <p className="eyebrow">
      CODE DIAGNOSTICS / 02
    </p>

    <h1>
      SCAN HISTORY_
    </h1>

    <div className="hero-line"></div>

    <p className="hero-copy">
      A record of the changes we've already
      <br />
      scanned.
    </p>

    <div className="history-list">

      {history.length === 0 ? (

        <p className="empty-history">
          No scans yet. Run your first
          <br />
          diagnostic.
        </p>

      ) : (

        history.map((scan, index) => (

          <div
            className="history-row"
            key={index}
          >

            <div className="history-file">

              <span className="file-marker"></span>

              <div>

                <strong>
                  {Array.isArray(scan.fileName)
                    ? scan.fileName.join(", ")
                    : scan.fileName}
                </strong>

                <small>
                  CODE CHANGE SCAN
                </small>

              </div>

            </div>

            <div className="history-risk">

              <small>
                RISK
              </small>

              <strong>
                {scan.risk}
              </strong>

            </div>

            <div className="history-score">

              <small>
                SCORE
              </small>

              <strong>
                {scan.score}/100
              </strong>

            </div>

            <div className="history-time">

              <small>
                {scan.time}
              </small>

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