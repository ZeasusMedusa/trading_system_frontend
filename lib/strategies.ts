// Strategy management utilities
import type { SavedStrategy, CompletedBacktest } from '@/types/backtest';
import { deleteZipFile } from './zipStorage';

const STORAGE_KEY = 'saved_strategies';

export function saveStrategy(
  name: string,
  description: string,
  backtestData: CompletedBacktest,
  strategyCode: Record<string, unknown>,
  config: { startDate: string; endDate: string; strategyName: string },
  zipFileName?: string
): SavedStrategy {
  const savedStrategy: SavedStrategy = {
    id: crypto.randomUUID(),
    name,
    description,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    backtestData,
    strategyCode,
    config,
    hasZipFile: !!zipFileName,
    zipFileName: zipFileName,
  };

  try {
    const existing = getSavedStrategies();
    
    // Store last 100 bars data separately
    const barsStorageKey = `bars_${savedStrategy.id}`;
    const barsData = {
      bars: savedStrategy.backtestData.bars?.slice(-100), // Last 100 records
      bars_buy: savedStrategy.backtestData.bars_buy?.slice(-100),
      bars_sell: savedStrategy.backtestData.bars_sell?.slice(-100),
      savedAt: new Date().toISOString(),
    };
    
    // Try to save bars data
    try {
      localStorage.setItem(barsStorageKey, JSON.stringify(barsData));
    } catch (barsError) {
      console.warn('Could not save bars data, will save compressed version');
    }
    
    // Save strategy with ALL analytics but minimal bars for quick loading
    const strategyToSave = {
      ...savedStrategy,
      backtestData: {
        ...savedStrategy.backtestData,
        bars: savedStrategy.backtestData.bars?.slice(-10), // Last 10 for preview
        bars_buy: savedStrategy.backtestData.bars_buy?.slice(-10),
        bars_sell: savedStrategy.backtestData.bars_sell?.slice(-10),
        analytics: savedStrategy.backtestData.analytics, // Keep ALL analytics metrics
      }
    };
    
    existing.push(strategyToSave);
    
    const dataToStore = JSON.stringify(existing);
    
    // Check if data is too large
    if (dataToStore.length > 2 * 1024 * 1024) { // 2MB limit
      throw new Error('Strategy data too large. Please reduce bars data or delete old strategies.');
    }
    
    localStorage.setItem(STORAGE_KEY, dataToStore);
    return savedStrategy;
  } catch (error) {
    if (error instanceof Error && (error.message.includes('quota') || error.message.includes('too large'))) {
      // Try to free up space by removing oldest strategies
      const existing = getSavedStrategies();
      if (existing.length > 0) {
        // Remove all but the 2 newest strategies
        existing.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const strategiesToKeep = existing.slice(0, 2);
        
        // Try again with even more reduced data
        const ultraCompressedStrategy = {
          ...savedStrategy,
          backtestData: {
            ...savedStrategy.backtestData,
            bars: savedStrategy.backtestData.bars?.slice(0, 5), // Only 5 bars
            bars_buy: savedStrategy.backtestData.bars_buy?.slice(0, 5),
            bars_sell: savedStrategy.backtestData.bars_sell?.slice(0, 5),
            analytics: savedStrategy.backtestData.analytics ? {
              ...savedStrategy.backtestData.analytics,
              trades: undefined,
              trade_type_analysis: undefined,
            } : undefined,
          }
        };
        
        strategiesToKeep.push(ultraCompressedStrategy);
        
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(strategiesToKeep));
          return savedStrategy;
        } catch (retryError) {
          // If still too large, save only essential data
          const minimalStrategy = {
            id: savedStrategy.id,
            name: savedStrategy.name,
            description: savedStrategy.description,
            createdAt: savedStrategy.createdAt,
            updatedAt: savedStrategy.updatedAt,
            strategyCode: savedStrategy.strategyCode,
            config: savedStrategy.config,
            backtestData: {
              id: savedStrategy.backtestData.id,
              total_pnl: savedStrategy.backtestData.total_pnl,
              winrate: savedStrategy.backtestData.winrate,
              n_trades: savedStrategy.backtestData.n_trades,
              n_wins: savedStrategy.backtestData.n_wins,
              n_losses: savedStrategy.backtestData.n_losses,
              sharpe_ratio: savedStrategy.backtestData.sharpe_ratio,
              max_drawdown: savedStrategy.backtestData.max_drawdown,
              profit_factor: savedStrategy.backtestData.profit_factor,
              strategy_type: savedStrategy.backtestData.strategy_type,
              // Remove all large arrays
              bars: undefined,
              bars_buy: undefined,
              bars_sell: undefined,
              analytics: savedStrategy.backtestData.analytics ? {
                n_trades: savedStrategy.backtestData.analytics.n_trades,
                n_wins: savedStrategy.backtestData.analytics.n_wins,
                n_losses: savedStrategy.backtestData.analytics.n_losses,
                winrate: savedStrategy.backtestData.analytics.winrate,
                total_pnl: savedStrategy.backtestData.analytics.total_pnl,
                sharpe_ratio: savedStrategy.backtestData.analytics.sharpe_ratio,
                max_drawdown: savedStrategy.backtestData.analytics.max_drawdown,
                profit_factor: savedStrategy.backtestData.analytics.profit_factor,
              } : undefined,
            }
          };
          
          strategiesToKeep[strategiesToKeep.length - 1] = minimalStrategy;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(strategiesToKeep));
          return savedStrategy;
        }
      } else {
        throw new Error('Not enough storage space. Please clear browser data or use a different browser.');
      }
    }
    throw error;
  }
}

export function getSavedStrategies(): SavedStrategy[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading saved strategies:', error);
    return [];
  }
}

export function getSavedStrategy(id: string): SavedStrategy | null {
  const strategies = getSavedStrategies();
  const strategy = strategies.find(s => s.id === id);
  
  if (!strategy) {
    return null;
  }
  
  // Try to load full bars data
  try {
    const barsStorageKey = `bars_${id}`;
    const barsDataStr = localStorage.getItem(barsStorageKey);
    
    console.log(`Loading bars for strategy ${id}, key: ${barsStorageKey}`);
    console.log(`Bars data found:`, barsDataStr ? 'Yes' : 'No');
    
    if (barsDataStr) {
      const barsData = JSON.parse(barsDataStr);
      console.log(`Bars data parsed:`, {
        bars: barsData.bars?.length || 0,
        bars_buy: barsData.bars_buy?.length || 0,
        bars_sell: barsData.bars_sell?.length || 0,
        savedAt: barsData.savedAt
      });
      
      // Restore full bars data
      const fullStrategy = {
        ...strategy,
        backtestData: {
          ...strategy.backtestData,
          bars: barsData.bars || strategy.backtestData.bars,
          bars_buy: barsData.bars_buy || strategy.backtestData.bars_buy,
          bars_sell: barsData.bars_sell || strategy.backtestData.bars_sell,
        }
      };
      
      console.log(`Restored strategy with bars:`, {
        bars: fullStrategy.backtestData.bars?.length || 0,
        bars_buy: fullStrategy.backtestData.bars_buy?.length || 0,
        bars_sell: fullStrategy.backtestData.bars_sell?.length || 0,
      });
      
      return fullStrategy;
    } else {
      console.log(`No bars data found for ${id}, using preview only`);
    }
  } catch (error) {
    console.warn('Could not load full bars data for strategy', id, error);
  }
  
  console.log(`Returning strategy with preview bars:`, {
    bars: strategy.backtestData.bars?.length || 0
  });
  return strategy;
}

export function updateSavedStrategy(id: string, updates: Partial<SavedStrategy>): SavedStrategy | null {
  const strategies = getSavedStrategies();
  const index = strategies.findIndex(s => s.id === id);
  
  if (index === -1) {
    return null;
  }
  
  strategies[index] = {
    ...strategies[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(strategies));
  return strategies[index];
}

export async function deleteSavedStrategy(id: string): Promise<boolean> {
  const strategies = getSavedStrategies();
  const filtered = strategies.filter(s => s.id !== id);
  
  if (filtered.length === strategies.length) {
    return false;
  }
  
  // Also delete bars data
  try {
    const barsStorageKey = `bars_${id}`;
    localStorage.removeItem(barsStorageKey);
  } catch (error) {
    console.warn('Could not delete bars data for strategy', id);
  }
  
  // Also delete ZIP file from IndexedDB
  try {
    await deleteZipFile(id);
  } catch (error) {
    console.warn('Could not delete ZIP file for strategy', id);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

export function exportSavedStrategies(): string {
  const strategies = getSavedStrategies();
  return JSON.stringify(strategies, null, 2);
}

export function importSavedStrategies(jsonData: string): boolean {
  try {
    const strategies = JSON.parse(jsonData);
    if (!Array.isArray(strategies)) {
      return false;
    }
    
    // Validate structure
    for (const strategy of strategies) {
      if (!strategy.id || !strategy.name || !strategy.backtestData) {
        return false;
      }
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(strategies));
    return true;
  } catch (error) {
    console.error('Error importing strategies:', error);
    return false;
  }
}

export function clearOldStrategies(keepCount: number = 5): void {
  try {
    const strategies = getSavedStrategies();
    if (strategies.length <= keepCount) {
      return;
    }
    
    // Sort by creation date and keep only the newest ones
    strategies.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const strategiesToKeep = strategies.slice(0, keepCount);
    
    // Compress the remaining strategies
    const compressedStrategies = strategiesToKeep.map(s => ({
      ...s,
      backtestData: {
        ...s.backtestData,
        bars: s.backtestData.bars?.slice(0, 5),
        bars_buy: s.backtestData.bars_buy?.slice(0, 5),
        bars_sell: s.backtestData.bars_sell?.slice(0, 5),
        analytics: s.backtestData.analytics ? {
          ...s.backtestData.analytics,
          trades: undefined,
          trade_type_analysis: undefined,
        } : undefined,
      }
    }));
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(compressedStrategies));
  } catch (error) {
    console.error('Error clearing old strategies:', error);
  }
}

export function getStorageUsage(): { used: number; available: number; percentage: number } {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    const used = data ? new Blob([data]).size : 0;
    const available = 5 * 1024 * 1024; // 5MB estimate
    const percentage = (used / available) * 100;
    
    return { used, available, percentage };
  } catch (error) {
    console.error('Error getting storage usage:', error);
    return { used: 0, available: 0, percentage: 0 };
  }
}

export function cleanupOldBarsData(): void {
  try {
    const strategies = getSavedStrategies();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    let cleanedCount = 0;
    
    for (const strategy of strategies) {
      const barsStorageKey = `bars_${strategy.id}`;
      const barsDataStr = localStorage.getItem(barsStorageKey);
      
      if (barsDataStr) {
        try {
          const barsData = JSON.parse(barsDataStr);
          const savedAt = new Date(barsData.savedAt || strategy.createdAt);
          
          // Delete bars data older than 1 week
          if (savedAt < oneWeekAgo) {
            localStorage.removeItem(barsStorageKey);
            cleanedCount++;
            console.log(`Cleaned old bars data for strategy: ${strategy.name}`);
          }
        } catch (parseError) {
          // If can't parse, just remove it
          localStorage.removeItem(barsStorageKey);
          cleanedCount++;
        }
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`Cleaned ${cleanedCount} old bars data entries`);
    }
  } catch (error) {
    console.error('Error cleaning old bars data:', error);
  }
}

export function getAllBarsKeys(): string[] {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('bars_')) {
        keys.push(key);
      }
    }
    return keys;
  } catch (error) {
    console.error('Error getting bars keys:', error);
    return [];
  }
}
