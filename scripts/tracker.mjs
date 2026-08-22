import admin from 'firebase-admin';

// 1. GitHub Secret에서 전달된 서비스 계정 키 파싱 및 초기화
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  throw new Error('FIREBASE_SERVICE_ACCOUNT secret is missing.');
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// 2. 치지직 채널 ID 설정
const CHANNEL_ID = 'uzuhama_channel_id'; // 실제 치지직 채널 고유 ID

async function runTracker() {
  try {
    // 치지직 라이브 상태 API 호출
    const res = await fetch(`https://api.chzzk.naver.com/service/v2/channels/${CHANNEL_ID}/live-detail`, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });
    const data = await res.json();
    const liveData = data.content;

    const status = liveData?.status || 'CLOSE';
    const title = liveData?.liveTitle || '';
    const category = liveData?.liveCategoryValue || '';
    const concurrentUserCount = liveData?.concurrentUserCount || 0;

    console.log(`[Tracker] Status: ${status} | Title: ${title}`);

    // 3. Firestore에 데이터 기록 (보안 규칙을 무시하고 관리자 권한으로 쓰기)
    await db.collection('live_status').doc(CHANNEL_ID).set({
      status,
      title,
      category,
      concurrentUserCount,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log('[Firestore] Successfully updated live status.');
  } catch (error) {
    console.error('Error in tracker:', error);
    process.exit(1);
  }
}

runTracker();