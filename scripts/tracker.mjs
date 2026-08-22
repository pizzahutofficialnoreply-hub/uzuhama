import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc, orderBy, limit, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyD33dUT30Gn5Vr2OKA_X3sI1HAddVsMZoM",
  authDomain: "uzuhama.firebaseapp.com",
  projectId: "uzuhama",
  storageBucket: "uzuhama.firebasestorage.app",
  messagingSenderId: "8322844637",
  appId: "1:8322844637:web:85ed5c72a675f66adad834",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const CHZZK_CHANNEL_ID = 'c6e1c8cf1b128bd321cc2684c92b5a00';
const CHZZK_API_URL = `https://api.chzzk.naver.com/service/v2/channels/${CHZZK_CHANNEL_ID}/live-detail`;

async function run() {
  try {
    const res = await fetch(CHZZK_API_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    const data = await res.json();
    const content = data.content;
    const status = content?.status; // "OPEN" or "CLOSE"

    // config/liveStatus 문서에 저장
    await setDoc(doc(db, 'config', 'liveStatus'), {
      status: status || 'CLOSE', // 'OPEN' 또는 'CLOSE'
      liveTitle: content?.liveTitle || '',
      liveCategoryValue: content?.liveCategoryValue || '',
      openDate: content?.openDate || '',
      updatedAt: new Date().toISOString()
    });

    const logsRef = collection(db, 'logs');
    // Find a running broadcast
    const q = query(logsRef, where('endTime', '==', ''), limit(1));
    const snap = await getDocs(q);
    let runningLog = null;
    if (!snap.empty) {
      runningLog = { id: snap.docs[0].id, ...snap.docs[0].data() };
    }

    if (status === 'OPEN') {
      if (!runningLog) {
        // Create new log
        const now = new Date();
        const openDateStr = content.openDate; 
        let openDate = now;
        if (openDateStr) {
          openDate = new Date(openDateStr.replace(' ', 'T') + '+09:00');
        }

        const dateStr = `${openDate.getFullYear()}-${String(openDate.getMonth()+1).padStart(2, '0')}-${String(openDate.getDate()).padStart(2, '0')}`;
        const timeStr = `${String(openDate.getHours()).padStart(2, '0')}:${String(openDate.getMinutes()).padStart(2, '0')}`;

        const newLog = {
          id: Date.now().toString(),
          date: dateStr,
          time: timeStr,
          endTime: '',
          durationHours: 0,
          game: content.liveCategoryValue || '종합',
          category: content.liveCategoryValue || '종합',
          games: [{ name: content.liveCategoryValue || '종합', category: '종합', link: '' }],
          vods: [],
          edited: [],
          shorts: []
        };
        await setDoc(doc(logsRef, newLog.id), newLog);
        console.log('Started new broadcast log:', newLog.id);
      }
    } else if (status === 'CLOSE') {
      if (runningLog) {
        const now = new Date();
        const endTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        let startMins = 0;
        let endMins = 0;
        
        const openDateStr = runningLog.date;
        const openTimeStr = runningLog.time;
        
        if (openDateStr && openTimeStr) {
          const startDate = new Date(`${openDateStr}T${openTimeStr}:00+09:00`);
          const diffMs = now.getTime() - startDate.getTime();
          const durationHours = Number((diffMs / (1000 * 60 * 60)).toFixed(2));

          await updateDoc(doc(logsRef, runningLog.id), {
            endTime: endTimeStr,
            durationHours: durationHours > 0 ? durationHours : 0
          });
        } else {
          // Fallback
          const [h, m] = runningLog.time.split(':').map(Number);
          startMins = h * 60 + m;
          endMins = now.getHours() * 60 + now.getMinutes();
          if (endMins < startMins) endMins += 24 * 60; 
  
          const durationHours = Number(((endMins - startMins) / 60).toFixed(2));
  
          await updateDoc(doc(logsRef, runningLog.id), {
            endTime: endTimeStr,
            durationHours: durationHours > 0 ? durationHours : 0
          });
        }
        console.log('Closed broadcast log:', runningLog.id);
      }
    }
    
    // Explicitly exit so the process doesn't hang due to Firebase timers
    process.exit(0);
  } catch(e) {
    console.error('Error in tracker:', e);
    process.exit(1);
  }
}

run();