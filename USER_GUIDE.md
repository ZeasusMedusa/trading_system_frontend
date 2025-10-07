# SMIIO Backtest Platform - User Guide

## Quick Start

### 1. Authentication
1. Navigate to the platform
2. You'll be redirected to `/login` if not authenticated
3. Enter your credentials
4. You'll be redirected to the dashboard

### 2. Running a Backtest

#### From Scratch
1. Go to `/backtest` page
2. Click one of the strategy buttons:
   - **Get Default Strategy** - Basic template
   - **Get BUY Strategy** - BUY-only template
   - **Get SELL Strategy** - SELL-only template
   - **Get DUAL Strategy** - Combined BUY+SELL template
3. Edit the strategy JSON in the editor
4. Configure:
   - Strategy Name
   - Start Date
   - End Date
5. Click **Run Backtest (Server)**
6. Watch the terminal for progress
7. View results in the info panel

#### Loading a File
1. Click **Load from JSON** or drag & drop a `.json` file
2. File contents will be loaded into the editor
3. Continue with step 4 above

### 3. Viewing Results

#### Quick Overview (Info Panel)
After backtest completes, you'll see:
- **Performance Overview**: Win Rate, Sharpe Ratio, Max Drawdown, Profit Factor
- **Analytics**: All metrics with human-friendly labels
- **Action Buttons**:
  - 📥 Download Results - Download ZIP file
  - 🔍 View Details - Open detailed modal
  - 💾 Save Strategy - Save for later
  - 📂 Load Strategy - Load saved strategy

#### Detailed View (Modal)
Click **View Details** to see:

**For Single Strategies:**
- **Bars Tab**: Full bars data table
- **Code Tab**: Strategy JSON

**For Dual Strategies:**
- **Объединённые данные**: Combined bars
- **BUY данные**: BUY branch with all indicators
- **SELL данные**: SELL branch with all indicators
- **Код стратегии**: Strategy JSON

**Table Features:**
- Click column headers to sort
- Horizontal scroll for many columns
- Sticky header (stays visible when scrolling)
- Shows total record count

### 4. Saving Strategies

#### How to Save
1. Complete a backtest
2. Click **💾 Save Strategy**
3. Enter:
   - **Name** (required) - e.g., "My Best Strategy"
   - **Description** (optional) - e.g., "Works well in bull markets"
4. Click **Save Strategy**
5. Terminal shows: "💾 Strategy saved: [name]"

#### What Gets Saved
- ✅ Strategy name and description
- ✅ Strategy JSON code
- ✅ Configuration (dates, settings)
- ✅ All analytics and metrics
- ✅ **Full bars data** (for 1 week)
- ✅ Preview bars (10 records, permanent)

#### Storage Limits
- Maximum 3-5 strategies recommended
- Full bars data auto-deleted after 1 week
- Preview and metrics always available
- Automatic cleanup if storage full

### 5. Loading Strategies

#### How to Load
1. Click **📂 Load Strategy**
2. Browse saved strategies:
   - Name and description
   - Creation date
   - Key metrics (PnL, Winrate, Trades)
   - Strategy type (single/dual)
3. Use search box to filter
4. Click **Load** on desired strategy
5. Click **Delete** to remove strategy

#### What Gets Restored
- ✅ Strategy code in editor
- ✅ Configuration (dates, name)
- ✅ All backtest results
- ✅ Full bars data (if <1 week old)
- ✅ Preview bars (if >1 week old)

### 6. Downloading Results

#### How to Download
1. After backtest completion, click **📥 Download Results**
2. Wait for download indicator
3. ZIP file downloads automatically
4. Repeat clicks use cache (instant)

#### ZIP Contents

**Single Strategy:**
- `bars.csv` - All bars data
- `analytics.json` - All metrics
- `strategy_info.json` - Strategy metadata

**Dual Strategy:**
- `bars.csv` - Combined data
- `bars_buy.csv` - BUY branch with all indicators
- `bars_sell.csv` - SELL branch with all indicators
- `buy_positions.csv` - BUY positions over time
- `sell_positions.csv` - SELL positions over time
- `analytics.json` - Combined metrics
- `strategy_info.json` - Strategy metadata

### 7. Dashboard (Home Page)

#### Viewing Backtest History
1. Go to main page (`/`)
2. See all backtests:
   - Server backtests (from API)
   - Saved strategies (from localStorage)
   - Mixed seamlessly in one list

#### Saved Strategy Indicators
- **💾 Saved** badge - Indicates local strategy
- **Description** - Shows under date if provided
- **All metrics** - PnL, Winrate, Sharpe, etc.

#### Filtering & Sorting
- **Search**: Filter by strategy name
- **Sort by**:
  - Date (default)
  - Win Rate
  - Sharpe Ratio
  - Total PnL
- **Filter by**:
  - All
  - Profitable only
  - Unprofitable only
- **Folders**: Organize by custom folders (server backtests only)

### 8. Understanding Data Lifecycle

#### Saved Strategy Timeline

```
Day 0: Save Strategy
├── ✅ Full bars data available
├── ✅ All metrics available
└── ✅ Can view full details

Day 1-6: Full Access Period
├── ✅ Full bars data still available
├── ✅ View Details shows all data
└── ✅ Can download anytime

Day 7+: Auto-Cleanup
├── 🗑️ Full bars data deleted (auto)
├── ✅ Preview bars (10) still available
├── ✅ All metrics still available
├── ✅ Can still load strategy
└── ⚠️ View Details shows preview only

Manual Delete:
└── 🗑️ Everything removed
```

### 9. Best Practices

#### Strategy Management
1. **Name clearly**: Use descriptive names
2. **Add descriptions**: Note market conditions, parameters
3. **Save important ones**: Don't save every test
4. **Review regularly**: Delete unused strategies
5. **Export important**: Download ZIP for long-term storage

#### Performance Tips
1. **Limit strategies**: Keep 3-5 active
2. **Use descriptions**: Easier to find later
3. **Clean regularly**: Delete old tests
4. **Download important**: Before 1-week deletion
5. **Check storage**: Monitor browser DevTools

#### Backtest Workflow
1. **Test variations**: Try different parameters
2. **Save best ones**: Only save successful tests
3. **Compare results**: Use dashboard filters
4. **Download data**: For external analysis
5. **Iterate**: Load, modify, re-test

### 10. Troubleshooting

#### "Strategy data too large"
**Cause**: Strategy exceeds storage limit

**Solution**: Automatic (no action needed)
- System retries with compression
- Deletes oldest strategies
- Saves with minimal data

#### "Could not load saved strategies"
**Cause**: localStorage issue

**Solutions**:
1. Check browser console for errors
2. Clear browser cache
3. Check browser storage settings
4. Try different browser

#### Missing bars data in View Details
**Cause**: Strategy older than 1 week

**Result**: Shows preview bars only (10 records)

**Solution**: 
- Re-run backtest if full data needed
- Download ZIP before 1-week deletion

#### Download not working
**Cause**: Cache issue or network error

**Solutions**:
1. Check terminal for error messages
2. Check browser console
3. Verify backend is running (http://127.0.0.1:8000)
4. Try clearing download cache (refresh page)

#### Can't save strategy
**Cause**: Storage full or quota exceeded

**Solutions**:
1. Delete old strategies manually
2. System will auto-cleanup
3. Clear browser data
4. Close other tabs using storage

### 11. Keyboard Shortcuts

#### Editor
- `Ctrl+A` / `Cmd+A` - Select all
- `Ctrl+C` / `Cmd+C` - Copy
- `Ctrl+V` / `Cmd+V` - Paste
- `Ctrl+Z` / `Cmd+Z` - Undo
- `Tab` - Indent

#### Modal
- `Esc` - Close modal
- Click outside - Close modal

### 12. Understanding Metrics

#### Basic Metrics
- **Total Trades**: Total number of trades executed
- **Winning Trades**: Trades with positive PnL
- **Losing Trades**: Trades with negative PnL
- **Win Rate**: Percentage of winning trades

#### Performance Metrics
- **Total PnL**: Total profit/loss percentage
- **Average PnL**: Mean PnL per trade
- **Max Profit**: Largest single winning trade
- **Max Loss**: Largest single losing trade

#### Risk Metrics
- **Sharpe Ratio**: Risk-adjusted returns (higher is better)
- **Max Drawdown**: Largest peak-to-trough decline
- **Profit Factor**: Gross profit / Gross loss

#### Advanced Metrics
- **Win/Loss Streaks**: Consecutive wins/losses
- **Duration Metrics**: Average trade duration
- **Timeframe Analysis**: Performance by time period

### 13. Tips & Tricks

#### Strategy Development
1. **Start with default**: Modify default template
2. **Test small periods**: Faster iterations
3. **Validate JSON**: Check syntax before running
4. **Save versions**: Save different variations
5. **Document changes**: Use descriptions

#### Data Analysis
1. **Compare strategies**: Filter dashboard by metrics
2. **Export to Excel**: Open CSV files in Excel
3. **Track performance**: Monitor metrics over time
4. **Identify patterns**: Look for common factors
5. **Optimize parameters**: Iterate based on results

#### Storage Management
1. **Regular cleanup**: Delete unsuccessful tests
2. **Download important**: Before auto-deletion
3. **Monitor usage**: Check browser storage
4. **Clear old data**: Manually if needed
5. **Use folders**: Organize server backtests

### 14. FAQ

**Q: How long are strategies saved?**
A: Metadata forever, full bars for 1 week, preview bars forever

**Q: Can I save unlimited strategies?**
A: No, limited by browser storage (~5-10 MB total)

**Q: What happens after 1 week?**
A: Full bars deleted, preview and metrics remain

**Q: Can I export strategies?**
A: Yes, download ZIP file with all data

**Q: Can I share strategies?**
A: Not directly, but you can share downloaded ZIP files

**Q: Where is data stored?**
A: Browser's localStorage (not on server)

**Q: Is data backed up?**
A: No, local only. Download important strategies

**Q: Can I increase storage limit?**
A: No, browser limitation. Use downloads for backup

**Q: What if browser cache cleared?**
A: All saved strategies lost. Download important ones

**Q: Can I save from mobile?**
A: Yes, but limited storage on mobile browsers

### 15. Support & Resources

#### Documentation
- `STRATEGY_SAVING_SYSTEM.md` - Technical documentation
- `CHANGELOG_2025-10-07.md` - Recent changes
- `PROJECT_DOCUMENTATION.md` - Overall architecture

#### Getting Help
1. Check terminal output for errors
2. Open browser console (F12)
3. Review this guide
4. Check technical documentation

#### Useful Tools
- **Browser DevTools** (F12) - Inspect storage, console
- **Network Tab** - Monitor API calls
- **Application Tab** - View localStorage
- **Console Tab** - See error messages

---

## Quick Reference Card

### Essential Actions
| Action | Button | Location |
|--------|--------|----------|
| Run Backtest | Run Backtest (Server) | Backtest page |
| Save Strategy | 💾 Save Strategy | Info panel (after backtest) |
| Load Strategy | 📂 Load Strategy | Info panel |
| View Details | 🔍 View Details | Info panel |
| Download Results | 📥 Download Results | Info panel |
| Get Templates | Get BUY/SELL/DUAL | Strategy editor |

### Data Retention
| Data Type | Storage Duration | Notes |
|-----------|-----------------|-------|
| Metadata | Forever | Name, dates, metrics |
| Preview Bars | Forever | First 10 records |
| Full Bars | 1 week | Auto-deleted after |
| Downloads | Session | Cached until refresh |

### Storage Limits
| Item | Size | Limit |
|------|------|-------|
| Total Storage | ~5-10 MB | Browser dependent |
| Per Strategy | 2 MB | Auto-compression |
| Active Strategies | 3-5 | Recommended |
| Full Bars | 100-500 KB | Per strategy |

---

**Happy Backtesting! 🚀**

