# Development Workflow & Best Practices

## Git Workflow

### Branch Strategy
- `main` - Production-ready code
- `feature/*` - New features and major changes
- `fix/*` - Bug fixes and small improvements

### Commit Practices
```bash
# Before major changes - create a backup point
git add -A && git commit -m "checkpoint: before major refactor"

# Regular commits - be descriptive
git commit -m "feat: add delta callout panel with memoized calculations"
git commit -m "fix: resolve hydration mismatch in percentage display"
git commit -m "style: implement 4/8px spacing system"
```

### Rollback Strategy
```bash
# See recent commits
git log --oneline -10

# Soft rollback (keep changes in working directory)
git reset --soft HEAD~1

# Hard rollback (discard all changes)
git reset --hard HEAD~1

# Rollback to specific commit
git reset --hard <commit-hash>
```

## Development Session Workflow

### 1. Start Session
```bash
# Pull latest changes
git pull origin main

# Check status
git status

# Start dev server
npm run dev
```

### 2. Checkpoint Strategy (Collaborative Approach)

#### **Automatic Checkpoints (Claude's Responsibility)**
Claude will create checkpoints before major changes:
```bash
git add -A && git commit -m "checkpoint: before implementing URL state persistence"
```

**When Claude creates checkpoints:**
- Before major refactors or architectural changes
- Before implementing complex new features  
- Before trying experimental approaches
- Before major dependency updates

#### **User-Requested Checkpoints**
Users can suggest checkpoints anytime:
- "Let's save our progress before trying this big change"
- "Should we commit this before moving to the next feature?"
- "Let's create a checkpoint here in case we need to roll back"

#### **Progress Commits (After Completing Work)**
After logical units of work are completed:
```bash
git add -A && git commit -m "feat: implement feature X with improvements Y"
```

**Commit Types:**
- `feat:` - New features and enhancements
- `fix:` - Bug fixes and corrections
- `refactor:` - Code restructuring without functionality changes
- `docs:` - Documentation updates
- `style:` - Design system and UI improvements
- `checkpoint:` - Safety saves before major changes
- `session:` - End-of-session consolidation commits

#### **Example Checkpoint Flow**
```
1. [CLAUDE] "checkpoint: before adding URL persistence"
2. [WORK] Implement URL persistence feature
3. [BOTH] "feat: add URL state persistence with query params"
4. [CLAUDE] "checkpoint: before refactoring chart components"
5. [WORK] Refactor chart architecture  
6. [BOTH] "refactor: improve chart component structure"
7. [END] "session: complete URL persistence and chart improvements"
8. [PUSH] git push origin main
```

### 3. During Development
- Use TodoWrite tool to track progress
- Make incremental commits for logical units of work
- Test changes in browser before moving to next task
- Run `npm run lint` periodically
- Either party can suggest checkpoints for safety

### 4. After Significant Changes
```bash
# Quality checks
npm run lint
npm run build

# If successful, commit
git add -A
git commit -m "feat: implement feature X with improvements Y"
```

### 5. End Session
```bash
# Final quality check
npm run lint && npm run build

# Commit final state
git add -A
git commit -m "session: complete UI improvements and design system"

# Push to remote backup
git push origin main
```

## File Organization Best Practices

### Component Structure
```
src/components/
├── trajectory-compare.tsx     # Main app component
├── charts/
│   └── chartjs-trajectory.tsx # Chart logic
└── ui/
    ├── control-panel.tsx      # Reusable controls
    ├── narrative-panel.tsx    # Analysis display
    └── header.tsx             # Navigation
```

### Documentation Structure
```
docs/
├── PRD.md           # Product requirements
├── DEVELOPMENT.md   # This file - workflows
└── CHANGELOG.md     # Version history
```

## Code Quality Standards

### TypeScript
- Always use interfaces for component props
- Maintain strict type checking
- Document complex type definitions

### React Patterns
- Use `useMemo` for expensive calculations
- Prefer functional components with hooks
- Keep components focused and single-purpose

### Styling
- Follow 4/8px spacing system
- Use semantic color variables (`text-text-tertiary`)
- Maintain responsive design patterns

## Testing Strategy

### Manual Testing Checklist
- [ ] All controls respond correctly
- [ ] Chart renders with all scenarios
- [ ] Responsive layout works on mobile
- [ ] No console errors in browser
- [ ] Build succeeds without warnings

### Automated Checks
```bash
# Type checking
npx tsc --noEmit

# Linting
npm run lint

# Build verification
npm run build
```

## Performance Monitoring

### Bundle Size
- Monitor JavaScript bundle size
- Use dynamic imports for large components
- Optimize Chart.js plugin performance

### Runtime Performance
- Chart rendering should be smooth (60fps)
- State updates should be immediate
- No unnecessary re-renders

## Backup Strategy

### Local Backups
- Commit frequently (every 30-60 minutes of work)
- Create checkpoints before major changes
- Use descriptive commit messages

### Remote Backups
- Push to GitHub daily
- Tag important milestones
- Maintain clean commit history

### Recovery Plan
```bash
# If working directory is corrupted
git reset --hard HEAD
git clean -fd

# If need to recover old version
git log --oneline
git checkout <commit-hash>
git checkout -b recovery-branch

# If remote is needed
git clone <repository-url> trajectory-backup
```

## Session Documentation

### What to Track in CLAUDE.md
- New patterns discovered
- Component architecture decisions  
- Performance optimizations
- Common issues and solutions
- Import path patterns
- State management approaches

### End-of-Session Updates
1. Update CLAUDE.md with new learnings
2. Add any new commands to the reference
3. Document component changes
4. Note any technical debt
5. Update next steps checklist