function PredictionCard({ risk, score, reasons }) {

  const numericScore = Number(score) || 0;

  const needleAngle = -90 + numericScore * 1.8;

  return (
    <section className="scan-result">

      <div className="result-score">

        <p className="section-label">
          SCAN RESULT
        </p>

        <h2>{risk}</h2>

        <p className="risk-description">
          {risk === "HIGH" &&
            "High likelihood of issues based on this change."}

          {risk === "MEDIUM" &&
            "Moderate risk of issues based on this change."}

          {risk === "LOW" &&
            "Low likelihood of issues based on this change."}
        </p>

        <div className="dial">

          <svg
            viewBox="0 0 300 180"
            className="risk-dial"
          >

            {/* GREEN */}
            <path
              d="M 30 150 A 120 120 0 0 1 270 150"
              pathLength="100"
              className="dial-track dial-green"
            />

            {/* AMBER */}
            <path
              d="M 30 150 A 120 120 0 0 1 270 150"
              pathLength="100"
              className="dial-track dial-amber"
              strokeDasharray="33 67"
              strokeDashoffset="-33"
            />

            {/* RED */}
            <path
              d="M 30 150 A 120 120 0 0 1 270 150"
              pathLength="100"
              className="dial-track dial-red"
              strokeDasharray="34 66"
              strokeDashoffset="-66"
            />

            {/* NEEDLE */}
            <line
              x1="150"
              y1="150"
              x2="150"
              y2="48"
              className="dial-needle"
              transform={`rotate(${needleAngle} 150 150)`}
            />

            <circle
              cx="150"
              cy="150"
              r="9"
              className="dial-center"
            />

          </svg>

          <div className="score">
            <strong>{numericScore}</strong>
            <span>/ 100</span>
          </div>

          <p className="score-label">
            RISK SCORE
          </p>

        </div>

      </div>

      <div className="result-reasons">

        <p className="section-label">
          WHY THIS MATTERS
        </p>

        {reasons && reasons.length > 0 ? (
          reasons.map((reason, index) => (
            <div className="reason" key={index}>
              <span className="reason-mark"></span>

              <div>
                <h3>{reason}</h3>

                <p>
                  {index === 0 &&
                    "History is one of the strongest signals we have."}

                  {index === 1 &&
                    "More surface area means more places for things to break."}

                  {index === 2 &&
                    "Removing code can introduce unexpected side effects."}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="reason">
            <span className="reason-mark"></span>

            <div>
              <h3>No major signals detected</h3>
              <p>
                The current change looks relatively safe.
              </p>
            </div>
          </div>
        )}

        <button className="report-link">
          VIEW FULL SCAN REPORT →
        </button>

      </div>

    </section>
  );
}

export default PredictionCard;