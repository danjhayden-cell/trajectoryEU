export default function Methodology() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-4">Methodology & Sources</h1>
          <p className="text-lg text-text-secondary">
            Understanding the data and calculations behind trajectory projections
          </p>
        </div>

        <div className="grid gap-8">
          <section className="bg-background-primary rounded-xl border border-border-light p-6">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Data Sources</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-text-primary mb-2">Primary Sources</h3>
                <ul className="space-y-2 text-text-secondary">
                  <li>• <strong>World Bank:</strong> GDP per capita (PPP), Real GDP growth, Capital formation</li>
                  <li>• <strong>OECD:</strong> R&D expenditure, Labor productivity indices</li>
                  <li>• <strong>Eurostat:</strong> EU-specific economic indicators</li>
                </ul>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> This prototype uses realistic sample data for demonstration purposes. 
                  Production version would connect to live APIs.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-background-primary rounded-xl border border-border-light p-6">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Projection Methodology</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-text-primary mb-2">Compound Annual Growth Rate (CAGR)</h3>
                <p className="text-text-secondary mb-2">
                  Projections are based on the compound annual growth rate calculated from recent historical data:
                </p>
                <div className="bg-background-secondary p-4 rounded-lg font-mono text-sm">
                  CAGR = (Ending Value / Beginning Value)^(1/years) - 1
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-text-primary mb-2">Future Value Calculation</h3>
                <p className="text-text-secondary mb-2">
                  Future projections apply the growth rate with optional scenario adjustments:
                </p>
                <div className="bg-background-secondary p-4 rounded-lg font-mono text-sm">
                  Future Value = Current Value × (1 + growth_rate + scenario_adjustment)^years
                </div>
              </div>

              <div>
                <h3 className="font-medium text-text-primary mb-2">Scenario Adjustments</h3>
                <ul className="space-y-1 text-text-secondary">
                  <li>• <strong>Baseline:</strong> Uses historical CAGR without adjustment</li>
                  <li>• <strong>Optimistic (+0.5pp):</strong> Adds 0.5 percentage points to annual growth</li>
                  <li>• <strong>Pessimistic (-0.5pp):</strong> Subtracts 0.5 percentage points from annual growth</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="bg-background-primary rounded-xl border border-border-light p-6">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Important Limitations</h2>
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-text-secondary">
                  <strong>Constant Rate Assumption:</strong> Projections assume growth rates remain constant, 
                  which rarely occurs in reality due to economic cycles, policy changes, and external shocks.
                </p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-text-secondary">
                  <strong>No Structural Changes:</strong> Does not account for demographic transitions, 
                  technological disruptions, or changes in economic structure.
                </p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-text-secondary">
                  <strong>Data Comparability:</strong> Cross-country comparisons may be affected by 
                  differences in statistical methodologies and data collection practices.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-background-primary rounded-xl border border-border-light p-6">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Indicator Definitions</h2>
            <div className="grid gap-4">
              <div className="border-l-4 border-chart-eu pl-4">
                <h3 className="font-medium text-text-primary">GDP per Capita (PPP)</h3>
                <p className="text-sm text-text-secondary">
                  Gross domestic product per capita adjusted for purchasing power parity, 
                  in constant international dollars.
                </p>
              </div>
              <div className="border-l-4 border-chart-us pl-4">
                <h3 className="font-medium text-text-primary">Real GDP Growth</h3>
                <p className="text-sm text-text-secondary">
                  Annual percentage change in GDP at constant prices, adjusted for inflation.
                </p>
              </div>
              <div className="border-l-4 border-chart-china pl-4">
                <h3 className="font-medium text-text-primary">R&D Expenditure</h3>
                <p className="text-sm text-text-secondary">
                  Research and development expenditure as a percentage of GDP, 
                  including both public and private spending.
                </p>
              </div>
              <div className="border-l-4 border-chart-brics pl-4">
                <h3 className="font-medium text-text-primary">Capital Formation</h3>
                <p className="text-sm text-text-secondary">
                  Gross capital formation as a percentage of GDP, measuring investment 
                  in fixed assets and changes in inventories.
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">For Policy Analysis</h2>
          <p className="text-blue-800 text-sm leading-relaxed">
            These projections are designed to illustrate the long-term implications of different growth trajectories 
            for policy discussions. They should be interpreted as scenarios rather than forecasts, and used alongside 
            other analytical tools for comprehensive policy evaluation.
          </p>
        </div>
      </div>
    </div>
  );
}