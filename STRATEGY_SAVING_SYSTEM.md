# Strategy Saving System Documentation

## Overview
This document describes the strategy saving and management system implemented in the SMIIO Backtest Platform.

## Features

### 1. Strategy Saving
- **Full Data Storage**: Strategies are saved with complete backtest results including analytics and bars data
- **Separate Storage**: Bars data is stored separately to optimize loading performance
- **Automatic Compression**: Analytics data is compressed by removing large arrays (trades, trade_type_analysis)

### 2. Data Structure

#### Main Strategy Storage (`saved_strategies`)
```typescript
interface SavedStrategy {
  id: string;                    // Unique identifier
  name: string;                  // User-provided name
  description?: string;          // Optional description
  createdAt: string;            // ISO timestamp
  updatedAt: string;            // ISO timestamp
  backtestData: CompletedBacktest; // Backtest results (compressed)
  strategyCode: Record<string, unknown>; // Strategy JSON
  config: {                     // Configuration
    startDate: string;
    endDate: string;
    strategyName: string;
  };
}
```

#### Bars Data Storage (`bars_{strategyId}`)
```typescript
interface BarsData {
  bars: Array<Record<string, unknown>>;        // Full bars data
  bars_buy?: Array<Record<string, unknown>>;   // BUY bars (for dual strategies)
  bars_sell?: Array<Record<string, unknown>>;  // SELL bars (for dual strategies)
  savedAt: string;                              // ISO timestamp for cleanup
}
```

### 3. Storage Strategy

#### Why Separate Storage?
1. **Performance**: Main strategy list loads quickly (only 10 bars preview)
2. **Storage Efficiency**: Full bars data (~thousands of records) stored separately
3. **Lazy Loading**: Full bars loaded only when viewing details
4. **Automatic Cleanup**: Old bars data auto-deleted after 1 week

#### Storage Keys
- `saved_strategies` - Main strategy list
- `bars_{strategyId}` - Individual bars data for each strategy

### 4. Automatic Cleanup System

#### Weekly Cleanup (`cleanupOldBarsData()`)
```typescript
// Runs on app load
cleanupOldBarsData();

// Logic:
- Check all bars data entries
- Compare savedAt timestamp with current date
- Delete bars data older than 7 days
- Keep strategy metadata (always available)
```

#### Strategy Limit (`clearOldStrategies()`)
```typescript
// Keep only newest strategies
clearOldStrategies(3);

// Logic:
- Sort strategies by creation date
- Keep only N newest strategies
- Compress remaining strategies (5 bars max)
- Delete associated bars data for removed strategies
```

### 5. API Functions

#### Save Strategy
```typescript
saveStrategy(
  name: string,
  description: string,
  backtestData: CompletedBacktest,
  strategyCode: Record<string, unknown>,
  config: { startDate, endDate, strategyName }
): SavedStrategy
```

**Process:**
1. Create strategy object with timestamp
2. Save full bars data to `bars_{id}` with timestamp
3. Compress strategy data (10 bars preview)
4. Add to saved_strategies list
5. Check size limit (2MB)
6. Auto-cleanup on quota exceeded

#### Get Strategy
```typescript
getSavedStrategy(id: string): SavedStrategy | null
```

**Process:**
1. Load strategy from saved_strategies
2. Check for full bars data in `bars_{id}`
3. Restore full bars if available
4. Return strategy with full or preview bars

#### Get All Strategies
```typescript
getSavedStrategies(): SavedStrategy[]
```

Returns all saved strategies (with preview bars only)

#### Delete Strategy
```typescript
deleteSavedStrategy(id: string): boolean
```

**Process:**
1. Remove strategy from saved_strategies
2. Delete associated `bars_{id}` data
3. Return success status

#### Cleanup Functions
```typescript
// Clean old bars data (>1 week)
cleanupOldBarsData(): void

// Keep only N newest strategies
clearOldStrategies(keepCount: number): void

// Get all bars storage keys
getAllBarsKeys(): string[]

// Get storage usage stats
getStorageUsage(): { used, available, percentage }
```

### 6. Error Handling

#### Quota Exceeded
```typescript
try {
  saveStrategy(...);
} catch (error) {
  if (error.message.includes('quota') || error.message.includes('too large')) {
    // Auto-cleanup: keep only 2 newest strategies
    clearOldStrategies(2);
    
    // Retry with ultra-compressed data (5 bars)
    saveStrategy(...);
    
    // Last resort: save only essential metrics (no bars)
  }
}
```

#### Fallback Strategy
1. **Level 1**: Save with 10 bars preview
2. **Level 2**: Save with 5 bars preview
3. **Level 3**: Save only metrics (no bars)

### 7. UI Integration

#### Save Strategy Flow
1. User completes backtest
2. Clicks "💾 Save Strategy" button
3. Modal prompts for name and description
4. System saves with full bars data
5. Terminal shows: "💾 Strategy saved: [name]"

#### Load Strategy Flow
1. User clicks "📂 Load Strategy" button
2. Modal shows list of saved strategies with:
   - Name and description
   - Creation date
   - Key metrics (PnL, Winrate, Trades)
   - Strategy type (single/dual)
3. User clicks "Load" button
4. Full bars data loaded automatically
5. Strategy code, config, and results restored
6. Terminal shows: "📂 Loaded strategy: [name]"

#### View Details Flow
1. User clicks "View Details" on saved strategy
2. System loads full bars data from `bars_{id}`
3. Modal displays:
   - Full bars table (sortable, scrollable)
   - Strategy code
   - All metrics
4. If bars data deleted (>1 week), shows preview only

### 8. Display in Backtest History

#### Dashboard Integration
- Saved strategies appear in main backtest history
- Visual indicator: "💾 Saved" badge
- Shows description if provided
- Mixed with server backtests seamlessly
- Same filtering and sorting as server data

#### Distinguishing Features
```typescript
{
  isSaved: true,           // Flag for saved strategies
  source: 'local',         // vs 'server'
  description: string      // User description
}
```

### 9. Storage Limits

#### LocalStorage Constraints
- **Maximum total size**: ~5-10 MB (browser dependent)
- **Strategy limit**: 2 MB per save operation
- **Bars limit**: Separate storage, no hard limit
- **Auto-cleanup**: Keeps system under limits

#### Best Practices
1. Limit to 3-5 active strategies
2. Full bars available for 1 week
3. Preview bars (10 records) always available
4. Metrics and analytics always preserved

### 10. Data Lifecycle

```
Day 0: Save Strategy
├── Full bars data → bars_{id}
├── Preview (10 bars) → saved_strategies
└── All metrics → saved_strategies

Day 1-6: Full Access
├── View Details shows full bars
└── All data available

Day 7+: Auto-Cleanup
├── Full bars deleted from bars_{id}
├── Preview bars still available
├── Metrics still available
└── Can still load strategy (no bars data)

Manual Delete: Complete Removal
├── Delete from saved_strategies
├── Delete from bars_{id}
└── Cleanup complete
```

### 11. Performance Optimization

#### Fast Loading
- Main list loads ~10 KB (3 strategies with 10 bars each)
- Full bars loaded on-demand (~100-500 KB)
- No impact on initial page load

#### Memory Efficiency
- Separate storage prevents memory bloat
- Automatic cleanup keeps storage lean
- Compressed analytics saves space

#### User Experience
- Instant strategy list display
- Smooth loading of full data
- No noticeable delays
- Transparent cleanup process

### 12. Troubleshooting

#### "Strategy data too large" Error
**Cause**: Total data exceeds 2 MB limit

**Solutions:**
1. System auto-retries with compression
2. Deletes oldest strategies automatically
3. Saves with minimal data as fallback

**User Action**: None required (automatic)

#### Missing Bars Data
**Cause**: Data older than 1 week (auto-deleted)

**Result**: 
- Preview bars still shown (10 records)
- All metrics still available
- Can still view strategy details

**User Action**: Re-run backtest if full data needed

#### Storage Quota Exceeded
**Cause**: Browser storage limit reached

**Solutions:**
1. Auto-cleanup runs immediately
2. Keeps only 2 newest strategies
3. Clears all old bars data

**User Action**: 
- Delete unused strategies manually
- Clear browser data if needed

### 13. Future Enhancements

#### Potential Improvements
1. **IndexedDB Migration**: Better storage for large datasets
2. **Cloud Sync**: Optional server backup
3. **Export/Import**: Share strategies between devices
4. **Compression**: GZIP compression for bars data
5. **Selective Cleanup**: User control over retention period

#### API Extensions
```typescript
// Planned functions
exportStrategy(id: string): string
importStrategy(data: string): boolean
syncToCloud(id: string): Promise<void>
compressBarsData(bars: any[]): string
decompressBarsData(data: string): any[]
```

## Implementation Files

### Core Files
- `lib/strategies.ts` - Storage management functions
- `types/backtest.ts` - TypeScript interfaces
- `app/components/SaveStrategyModal.tsx` - Save UI
- `app/components/LoadStrategyModal.tsx` - Load UI

### Integration Files
- `app/backtest/page.tsx` - Backtest page with save/load
- `app/page.tsx` - Dashboard with saved strategies display
- `app/components/BacktestDetailsModal.tsx` - View details modal

## Testing Checklist

- [x] Save strategy with full bars data
- [x] Load strategy and verify bars restored
- [x] Auto-cleanup after 1 week
- [x] Quota exceeded handling
- [x] Delete strategy removes all data
- [x] Display in dashboard with badge
- [x] View details shows full bars
- [x] Multiple strategies management
- [x] Search and filter saved strategies
- [x] Error handling and fallbacks

## Conclusion

The strategy saving system provides a robust, user-friendly way to persist backtest results locally. Key features include:

- ✅ Full data preservation for 1 week
- ✅ Automatic cleanup and optimization
- ✅ Graceful error handling
- ✅ Seamless UI integration
- ✅ Performance optimized
- ✅ Storage efficient

Users can confidently save their best strategies knowing the system will manage storage automatically while keeping their data accessible for the critical analysis period.

