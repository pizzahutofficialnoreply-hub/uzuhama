import { useState, useEffect } from 'react';
import { fetchYoutubeVideoStats, getWeightedRandomVideos, YouTubeVideoStats } from '../../utils';
import { ExternalLink, RefreshCw, Play, Video, MonitorPlay } from 'lucide-react';
import { useFirebaseData } from '../../hooks/useFirebaseData';

export function RecommendTab() {
  const { data } = useFirebaseData();
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState<YouTubeVideoStats[]>([]);
  const [recommended, setRecommended] = useState<YouTubeVideoStats[]>([]);

  const extractYoutubeIds = () => {
    if (!data?.logs) return [];
    
    const ids = new Set<string>();
    
    Object.values(data.logs).forEach((log: any) => {
      // Extract from vods
      log.vods?.forEach(vod => {
        if (vod.url) {
          const match = vod.url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
          if (match && match[1]) ids.add(match[1]);
        }
      });
      // Extract from edited
      log.edited?.forEach(edit => {
        if (edit.url) {
          const match = edit.url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
          if (match && match[1]) ids.add(match[1]);
        }
      });
    });
    
    return Array.from(ids);
  };

  const loadAndRecommend = async () => {
    setLoading(true);
    try {
      const videoIds = extractYoutubeIds();
      // If no videos in DB, fallback to an empty array
      const stats = await fetchYoutubeVideoStats(videoIds);
      setVideos(stats);
      setRecommended(getWeightedRandomVideos(stats, 3));
    } catch (error) {
      console.error('Failed to load videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (videos.length > 0) {
      setRecommended(getWeightedRandomVideos(videos, 3));
    } else {
      loadAndRecommend();
    }
  };

  useEffect(() => {
    loadAndRecommend();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Video className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            우주하마 추천 영상
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">올해 업로드 된 영상 중 추천해 드립니다.</p>
        </div>
      </div>

      <div className="flex justify-end">
        <button 
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          새로고침
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 h-72"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommended.map(video => (
            <div 
              key={video.id} 
              className="group flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1"
            >
              <a href={`https://youtu.be/${video.id}`} target="_blank" rel="noreferrer" className="block aspect-video relative overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                {video.thumbnailUrl ? (
                  <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-zinc-400">
                    <Play className="w-12 h-12 opacity-50" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-300"></div>
                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-medium px-2 py-1 rounded backdrop-blur-sm">
                  조회수 {(video.viewCount / 10000).toFixed(1)}만회
                </div>
              </a>
              <div className="p-4 flex-1 flex flex-col">
                <a href={`https://youtu.be/${video.id}`} target="_blank" rel="noreferrer" className="font-bold text-zinc-900 dark:text-white line-clamp-2 leading-snug hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                  {video.title || '우주하마 추천 영상'}
                </a>
                <div className="mt-auto pt-4 flex flex-wrap gap-2">
                  <a href={`https://youtu.be/${video.id}`} target="_blank" rel="noreferrer" className="flex-1 flex justify-center items-center gap-1 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-xs font-medium transition-colors">
                    <Play className="w-3.5 h-3.5" />
                    영상 보기
                  </a>
                  <a href="https://chzzk.naver.com/c6e1c8cf1b128bd321cc2684c92b5a00" target="_blank" rel="noreferrer" className="flex-1 flex justify-center items-center gap-1 px-3 py-2 bg-[#00ffa3]/10 text-[#00df8f] hover:bg-[#00ffa3]/20 rounded-lg text-xs font-medium transition-colors">
                    <MonitorPlay className="w-3.5 h-3.5" />
                    생방송
                  </a>
                  <a href="https://www.youtube.com/@uzuhama/shorts" target="_blank" rel="noreferrer" className="flex-1 flex justify-center items-center gap-1 px-3 py-2 bg-[#ff0000]/10 text-[#ff0000] hover:bg-[#ff0000]/20 rounded-lg text-xs font-medium transition-colors">
                    <Play className="w-3.5 h-3.5" />
                    쇼츠
                  </a>
                </div>
              </div>
            </div>
          ))}
          
          {recommended.length === 0 && (
            <div className="col-span-full py-12 text-center text-zinc-500 dark:text-zinc-400 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
              <Video className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>추천 영상을 불러올 수 없습니다.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
