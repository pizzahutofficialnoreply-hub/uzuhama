import { useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  query, 
  where, 
  orderBy,
  deleteDoc,
  writeBatch,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BroadcastLog, DailyStat, TimeStat, DurationStat, MonthlyStat, AppData, PatternGuide } from '../types';
import { dailyStats as defaultDaily, timeStats as defaultTime, durationStats as defaultDuration, monthlyStats as defaultMonthly, patternGuides as defaultGuides } from '../data';

export function useFirebaseData() {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeLogs: () => void;

    const initializeData = async () => {
      try {
        setLoading(true);
        const statsRef = doc(db, 'config', 'dailyStats');
        const timeRef = doc(db, 'config', 'timeStats');
        const guidesRef = doc(db, 'config', 'patternGuides');
        
        let valStats = undefined;
        let valTime = undefined;
        let valGuides = undefined;
        try {
          const [statsSnap, timeSnap, guidesSnap] = await Promise.all([
            getDoc(statsRef), getDoc(timeRef), getDoc(guidesRef)
          ]);
          valStats = statsSnap.data();
          valTime = timeSnap.data();
          valGuides = guidesSnap.data();
        } catch (e: any) {
          console.warn("Failed to fetch config from Firebase, using defaults. Error:", e.message);
        }
        
        const initialData: AppData = {
          logs: {}, 
          dailyStats: valStats ? (valStats as Record<string, DailyStat>) : defaultDaily.reduce((acc, stat) => ({ ...acc, [stat.day]: stat }), {} as any),
          timeStats: valTime ? (valTime as Record<string, TimeStat>) : defaultTime.reduce((acc, stat) => ({ ...acc, [stat.time]: stat }), {} as any),
          durationStats: defaultDuration.reduce((acc, stat) => ({ ...acc, [stat.label]: stat }), {} as any),
          monthlyStats: defaultMonthly.reduce((acc, stat) => ({ ...acc, [stat.month]: stat }), {} as any),
          patternGuides: valGuides ? (valGuides as Record<string, PatternGuide>) : defaultGuides.reduce((acc, guide) => ({ ...acc, [guide.id]: guide }), {} as any),
        };

        try {
          if (!valStats || !valTime) {
            await Promise.all([
              setDoc(doc(db, "config", "dailyStats"), initialData.dailyStats),
              setDoc(doc(db, "config", "timeStats"), initialData.timeStats),
              setDoc(doc(db, "config", "durationStats"), initialData.durationStats),
              setDoc(doc(db, "config", "monthlyStats"), initialData.monthlyStats),
              setDoc(doc(db, "config", "patternGuides"), initialData.patternGuides),
            ]);
          }
        } catch (e: any) {
          console.warn("Failed to set default config to Firebase:", e.message);
        }
        
        setData(initialData);

        // Fetch logs using one-time getDocs with sessionStorage cache to minimize reads
        const cachedLogs = sessionStorage.getItem('uzuhama_logs_cache');
        const cachedTime = sessionStorage.getItem('uzuhama_logs_time');
        const CACHE_TTL = 1000 * 60 * 60; // 1 hour

        if (cachedLogs && cachedTime && (Date.now() - parseInt(cachedTime)) < CACHE_TTL) {
          const allLogs = JSON.parse(cachedLogs);
          setData(prev => {
            if (!prev) return prev;
            return { ...prev, logs: allLogs };
          });
        } else {
          let allLogs: Record<string, BroadcastLog> = {};
          try {
            const logsQuery = query(collection(db, "logs"), orderBy("date", "desc"));
            const snapshot = await getDocs(logsQuery);
            snapshot.forEach((docSnap) => {
              allLogs[docSnap.id] = docSnap.data() as BroadcastLog;
            });
            sessionStorage.setItem("uzuhama_logs_cache", JSON.stringify(allLogs));
            sessionStorage.setItem("uzuhama_logs_time", Date.now().toString());
          } catch (e: any) {
            console.warn("Failed to fetch logs from Firebase, using empty logs.", e.message);
          }
          setData(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              logs: allLogs
            };
          });
        }
        
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    initializeData();

    return () => {
      // No longer need to unsubscribe from onSnapshot
    };
  }, []);

  const fetchLogsByDateRange = async (startDate: string, endDate: string) => {
    // We already fetch all logs in real-time now, so this can just be a no-op or we can filter locally.
    // The previous implementation used getDocs, but since onSnapshot gets everything (or we could limit it if needed),
    // we don't strictly need to refetch unless we only want a specific range. For now, it's fine.
  };

  const updateCache = (newLogs: Record<string, BroadcastLog>) => {
    sessionStorage.setItem('uzuhama_logs_cache', JSON.stringify(newLogs));
    sessionStorage.setItem('uzuhama_logs_time', Date.now().toString());
  };

  const addLog = async (log: BroadcastLog) => {
    if (!data) return;
    try {
      await setDoc(doc(db, 'logs', log.id), log);
      setData(prev => {
        if (!prev) return prev;
        const newLogs = { ...prev.logs, [log.id]: log };
        updateCache(newLogs);
        return {
          ...prev,
          logs: newLogs
        };
      });
    } catch (e) {
      console.error(e);
    }
  };
  
  const updateLog = async (log: BroadcastLog) => {
    if (!data) return;
    try {
      await setDoc(doc(db, 'logs', log.id), log, { merge: true });
      setData(prev => {
        if (!prev) return prev;
        const newLogs = { ...prev.logs, [log.id]: log };
        updateCache(newLogs);
        return {
          ...prev,
          logs: newLogs
        };
      });
    } catch (e) {
      console.error(e);
    }
  };
  
  const deleteLog = async (id: string) => {
    if (!data) return;
    try {
      await deleteDoc(doc(db, 'logs', id));
      setData(prev => {
        if (!prev) return prev;
        const newLogs = { ...prev.logs };
        delete newLogs[id];
        updateCache(newLogs);
        return {
          ...prev,
          logs: newLogs
        };
      });
    } catch (e) {
      console.error(e);
    }
  };

  const deleteAllLogs = async () => {
    try {
      const logsRef = collection(db, 'logs');
      const q = query(logsRef);
      const snapshot = await getDocs(q);
      
      // Firestore batch has a limit of 500 writes
      let batch = writeBatch(db);
      let count = 0;
      
      snapshot.forEach((document) => {
        batch.delete(document.ref);
        count++;
        // If we have 400 operations, commit and start a new batch
        if (count % 400 === 0) {
          batch.commit();
          batch = writeBatch(db);
        }
      });
      
      if (count % 400 !== 0) {
        await batch.commit();
      }
      
      updateCache({});
      
      setData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          logs: {}
        };
      });
    } catch (e) {
      console.error('Error deleting all logs:', e);
    }
  };

  const updateGuide = async (guide: PatternGuide) => {
    if (!data) return;
    try {
      await setDoc(doc(db, 'config', 'patternGuides'), {
        [guide.id]: guide
      }, { merge: true });
    } catch (e) {
      console.error(e);
    }
  };

  return { data, loading, addLog, updateLog, deleteLog, deleteAllLogs, updateGuide, fetchLogsByDateRange };
}
