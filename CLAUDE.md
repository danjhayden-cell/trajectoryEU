# Claude Code Project Guide

## Project Overview
Trajectory visualization web app comparing economic indicators across regions with projection modeling.

## Development Context
- **Framework**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS v4 with custom design system
- **Charts**: Chart.js with react-chartjs-2
- **Data**: Sample economic data with CAGR projections

## Key Commands

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

### Testing & Quality
Run these after making significant changes:
```bash
npm run lint && npm run build
```

## File Structure

### Core Components
- `src/components/trajectory-compare.tsx` - Main application component
- `src/components/charts/chartjs-trajectory.tsx` - Chart rendering with custom plugins
- `src/components/ui/control-panel.tsx` - Advanced controls panel
- `src/lib/sample-data.ts` - Economic data and calculations

### Key Features
- **Custom Chart Plugins**: Line-end labels, projected area shading
- **State Management**: URL-based state with React hooks
- **Responsive Design**: 4/8px spacing system, consistent typography
- **Delta Analysis**: Memoized calculations for region comparisons

## Recent Changes & Patterns

### Design System (Latest)
- **Spacing**: 4/8px increments (space-y-8, p-6, gap-6)
- **Typography**: H1(30px), H2(20px), Body(16px), Small(14px)
- **Colors**: Unified `text-text-tertiary` for muted text
- **Buttons**: `font-semibold` for CTAs, consistent padding

### State Structure
```typescript
interface ComparisonState {
  indicator: string;      // Economic indicator ID
  regions: string[];      // Region codes (EUU, USA, CHN, BRC)
  startYear: number;      // Historical start year
  horizon: number;        // Projection years (5,10,20,50)
  scenario: number;       // Growth adjustment (-0.5 to +0.5pp)
  indexNormalized: boolean; // Index to 100 at start year
  unit: string;           // Display unit
}
```

## Development Patterns

### Checkpoint Strategy
**Claude creates automatic checkpoints before:**
- Major refactors or architectural changes
- Complex new features
- Experimental approaches
- Major dependency updates

**Users can request checkpoints:**
- "Let's save progress before trying this big change"
- "Should we commit before moving to next feature?"
- Before risky modifications

**Commit types:** `feat:` `fix:` `refactor:` `docs:` `style:` `checkpoint:` `session:`

### Component Updates
1. Use `Read` tool to understand existing code structure
2. Apply `MultiEdit` for multiple related changes
3. Maintain consistent spacing/typography in all edits
4. Test changes via development server
5. Create checkpoints before major changes

### Chart Customization
- Custom plugins in `chartjs-trajectory.tsx`
- Color mapping: EUU(blue), USA(red), CHN(amber), BRC(emerald)
- Responsive layout with line-end labels

### State Management
- URL-based persistence for shareability
- Memoized calculations to prevent hydration mismatches
- Custom scenario slider with real-time updates

## Common Issues & Solutions

### Hydration Errors
- Use `useMemo` for complex calculations
- Ensure consistent number formatting between server/client
- Dependency arrays must include all reactive values

### Import Paths
- Chart components: `./charts/chartjs-trajectory`
- Data utilities: `../../lib/sample-data`
- UI components: `./ui/control-panel`

### Performance
- Chart.js plugins are optimized for 60fps
- Sample data uses efficient filtering
- Memoized delta calculations prevent unnecessary re-renders

## Project Documentation
- `docs/PRD.md` - Product requirements and specifications
- `README.md` - Basic setup and installation
- This file - Development context and patterns

## Next Steps Checklist
- [ ] Commit current progress to git
- [ ] Add methodology page content
- [ ] Implement URL state persistence
- [ ] Add export functionality
- [ ] Performance optimization review