interface ChartTableProps {
  headers: string[];
  /** Cells in the same order as `headers`. Numbers are right-aligned and tabular. */
  rows: (string | number)[][];
  caption: string;
}

// The table twin every chart ships: the same values as the marks, reachable without a
// pointer, so a tooltip never gates a number.
export default function ChartTable({ headers, rows, caption }: ChartTableProps) {
  return (
    <div className="chart-table-wrap">
      <table className="chart-table">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={h} scope="col" data-num={rows.some((r) => typeof r[i] === "number")}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci} data-num={typeof cell === "number"}>
                  {typeof cell === "number" ? cell.toLocaleString("en-IN") : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
