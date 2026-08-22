import { useState, useEffect } from 'react';
import { AppData, BroadcastLog, PatternGuide, LinkItem } from '../../types';
import { FileText, Save, Settings, Edit3, Plus, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';
import { formatTo12Hour } from '../../utils';

interface AdminTabProps {
  data: AppData;
  onAddLog: (log: BroadcastLog) => Promise<void>;
  onUpdateLog: (log: BroadcastLog) => Promise<void>;
  onDeleteLog: (id: string) => Promise<void>;
  onDeleteAllLogs: () => Promise<void>;
  onUpdateGuide: (guide: PatternGuide) => Promise<void>;
}

export function AdminTab({ data, onAddLog, onUpdateLog, onDeleteLog, onDeleteAllLogs, onUpdateGuide }: AdminTabProps) {
  const [rawText, setRawText] = useState(() => {
    return localStorage.getItem('adminDraftText') || '';
  });
  
  const createEmptyLog = (): Partial<BroadcastLog> => ({
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '20:00',
    endTime: '',
    durationHours: 3.5,
    game: '',
    games: [],
    category: '종합',
    vods: [{ title: '우주하마 생방송!', url: '' }],
    edited: [],
    shorts: []
  });

  const [parsedLogs, setParsedLogs] = useState<Partial<BroadcastLog>[]>(() => {
    const saved = localStorage.getItem('adminDraftLogs');
    if (saved) {
      try { return JSON.parse(saved); } catch(e) {}
    }
    return [createEmptyLog()];
  });

  const [selectedLogs, setSelectedLogs] = useState<Set<number>>(new Set());
  
  // States for guides editing
  const [editingGuide, setEditingGuide] = useState<string | null>(null);
  const [guideForm, setGuideForm] = useState({ title: '', content: '' });

  useEffect(() => {
    localStorage.setItem('adminDraftText', rawText);
  }, [rawText]);

  useEffect(() => {
    localStorage.setItem('adminDraftLogs', JSON.stringify(parsedLogs));
  }, [parsedLogs]);

  const guides = Object.values(data.patternGuides);

  const cleanTime = (t: string) => {
    return formatTo12Hour(t);
  };

  const handleParse = () => {
    try {
      // Split by double newline or unique markers to support multiple days pasted at once
      // For simplicity, let's assume each day block starts with a date like "1/8"
      const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      
      const newLogs: Partial<BroadcastLog>[] = [];
      let currentLog: Partial<BroadcastLog> | null = null;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Match Date (e.g., 1/8 (목) or 2023-11-02)
        if (line.match(/^\d{1,2}\/\d{1,2}/) || line.match(/^\d{4}-\d{2}-\d{2}/)) {
          if (currentLog) {
            currentLog.games = currentLog.games?.filter(g => g.name || g.link) || [];
            newLogs.push(currentLog);
          }
          currentLog = createEmptyLog();
          currentLog.games = []; // Start empty for clean parsing
          
          if (line.match(/^\d{1,2}\/\d{1,2}/)) {
            const [m, d] = line.split(' ')[0].split('/');
            const year = new Date().getFullYear();
            currentLog.date = `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
          } else {
            currentLog.date = line.split(' ')[0];
          }
          continue;
        }

        if (!currentLog) {
          currentLog = createEmptyLog();
          currentLog.games = [];
        }

        if (line.includes('~') && line.match(/\d{1,2}:\d{2}/)) {
          const parts = line.split('~');
          currentLog.time = cleanTime(parts[0]);
          currentLog.endTime = cleanTime(parts[1]);
          continue;
        }
        
        const durationClean = line.replace(/\s+/g, '');
        if (/^(?:\d+시간)?(?:\d+분)?$/.test(durationClean) && durationClean.length > 0) {
          const hMatch = line.match(/(\d+)시간/);
          const mMatch = line.match(/(\d+)분/);
          const h = hMatch ? parseInt(hMatch[1]) : 0;
          const m = mMatch ? parseInt(mMatch[1]) : 0;
          currentLog.durationHours = Number((h + (m / 60)).toFixed(2));
          continue;
        }

        // Check if line is purely a category marker like "[종겜]"
        if (line.startsWith('[') && line.endsWith(']')) {
          const cat = line.slice(1, -1);
          if (!currentLog.games) currentLog.games = [];
          
          if (currentLog.games.length > 0 && (!currentLog.games[currentLog.games.length - 1].category || currentLog.games[currentLog.games.length - 1].category === '종합')) {
            currentLog.games[currentLog.games.length - 1].category = cat;
          } else {
            currentLog.games.push({ name: '', link: '', category: cat });
          }
          continue;
        }

        if (line.startsWith('▶') || line.startsWith('-')) {
          const text = line.replace(/^[▶-]\s*/, '').trim();
          currentLog.edited?.push({ title: text, url: '' });
          continue;
        }
        
        // Unmatched line -> Game Name (possibly with inline category like "게임이름 [종겜]")
        let cat = '종합';
        let gameName = line;
        
        const catMatch = line.match(/\[(.*?)\]/);
        if (catMatch) {
            cat = catMatch[1];
            gameName = line.replace(catMatch[0], '').trim();
        }

        if (!currentLog.games) currentLog.games = [];
        
        if (currentLog.games.length > 0 && !currentLog.games[currentLog.games.length - 1].name) {
            currentLog.games[currentLog.games.length - 1].name = gameName;
            if (catMatch) {
                currentLog.games[currentLog.games.length - 1].category = cat;
            }
        } else {
            currentLog.games.push({ name: gameName, link: '', category: cat });
        }
        
        currentLog.game = currentLog.games.map(g => g.name).join(', ');
      }

      if (currentLog) {
        currentLog.games = currentLog.games?.filter(g => g.name || g.link) || [];
        newLogs.push(currentLog);
      }

      if (newLogs.length > 0) {
        setParsedLogs(newLogs);
      } else {
        alert("인식된 데이터가 없습니다.");
      }
    } catch (e) {
      alert("파싱에 실패했습니다. 형식에 맞게 텍스트를 입력해주세요.");
    }
  };

  const handleSaveLogs = async () => {
    for (const log of parsedLogs) {
      if (!log.date || !log.time) {
        alert('날짜와 시간은 필수입니다.');
        return;
      }
    }
    
    for (const log of parsedLogs) {
      const newLog = {
        ...log,
        id: log.id || Date.now().toString() + Math.random().toString(36).substr(2, 9)
      } as BroadcastLog;
      await onAddLog(newLog);
    }

    alert('모든 데이터가 성공적으로 저장되었습니다.');
    setParsedLogs([createEmptyLog()]);
    setRawText('');
  };

  const updateLog = (index: number, updates: Partial<BroadcastLog>) => {
    const updated = [...parsedLogs];
    updated[index] = { ...updated[index], ...updates };
    setParsedLogs(updated);
  };

  const addLink = (logIndex: number, type: 'vods' | 'edited' | 'shorts') => {
    const updated = [...parsedLogs];
    const arr = [...(updated[logIndex][type] || [])];
    arr.push({ title: type === 'vods' ? '우주하마 생방송!' : '', url: '' });
    updated[logIndex] = { ...updated[logIndex], [type]: arr };
    setParsedLogs(updated);
  };

  const updateLink = (logIndex: number, type: 'vods' | 'edited' | 'shorts', linkIndex: number, link: LinkItem) => {
    const updated = [...parsedLogs];
    const arr = [...(updated[logIndex][type] || [])];
    arr[linkIndex] = link;
    updated[logIndex] = { ...updated[logIndex], [type]: arr };
    setParsedLogs(updated);
  };

  const removeLink = (logIndex: number, type: 'vods' | 'edited' | 'shorts', linkIndex: number) => {
    const updated = [...parsedLogs];
    const arr = [...(updated[logIndex][type] || [])];
    arr.splice(linkIndex, 1);
    updated[logIndex] = { ...updated[logIndex], [type]: arr };
    setParsedLogs(updated);
  };

  const moveToShorts = (logIndex: number, linkIndex: number) => {
    const updated = [...parsedLogs];
    const link = updated[logIndex].edited![linkIndex];
    updated[logIndex].edited!.splice(linkIndex, 1);
    if (!updated[logIndex].shorts) updated[logIndex].shorts = [];
    updated[logIndex].shorts!.push(link);
    setParsedLogs(updated);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
          <Settings className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          신규 방송 기록 대량 입력 (직접 입력 & 기본 필드)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-zinc-500" />
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">대량 텍스트 입력 (스마트 자동 분류)</label>
            </div>
            <textarea 
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={`여러 날짜의 기록을 한 번에 붙여넣으세요.\n\n1/8 (목)\n10:01 ~ AM 1:18\n3시간 17분\n간장 라멘 포에버\n[소통]\n▶ 풀영상 제목 (다시보기)\n▶ 편집본 쇼츠 제목\n\n1/9 (금)\n20:00 ~ 23:00\n3시간\n배틀그라운드\n[FPS]`}
              className="w-full h-96 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button 
              onClick={handleParse}
              className="mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-xl transition-colors"
            >
              스마트 자동 분류
            </button>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2 gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-zinc-500" />
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">기본 필드 ({parsedLogs.length}개)</h4>
                </div>
                {selectedLogs.size > 0 && (
                  <div className="flex items-center gap-2 border-l border-zinc-300 dark:border-zinc-700 pl-4">
                    <span className="text-xs text-zinc-500 font-medium">{selectedLogs.size}개 선택됨</span>
                    <button onClick={() => {
                      const newCat = prompt("변경할 카테고리를 입력하세요 (예: 종겜)");
                      if (newCat) {
                        setParsedLogs(parsedLogs.map((log, i) => selectedLogs.has(i) ? { ...log, games: log.games?.map(g => ({ ...g, category: newCat })) } : log));
                      }
                    }} className="text-xs bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 px-2 py-1 rounded transition-colors text-zinc-700 dark:text-zinc-300">카테고리 일괄변경</button>
                    <button onClick={() => {
                      if (confirm("선택한 항목을 모두 삭제하시겠습니까?")) {
                        setParsedLogs(parsedLogs.filter((_, i) => !selectedLogs.has(i)));
                        setSelectedLogs(new Set());
                      }
                    }} className="text-xs bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 px-2 py-1 rounded transition-colors">선택 삭제</button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs flex items-center gap-1 cursor-pointer select-none text-zinc-600 dark:text-zinc-400">
                  <input type="checkbox" checked={selectedLogs.size === parsedLogs.length && parsedLogs.length > 0} onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedLogs(new Set(parsedLogs.map((_, i) => i)));
                    } else {
                      setSelectedLogs(new Set());
                    }
                  }} /> 전체 선택
                </label>
                <button onClick={() => setParsedLogs([...parsedLogs, createEmptyLog()])} className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1 font-medium">
                  <Plus className="w-4 h-4" /> 항목 추가
                </button>
              </div>
            </div>
            
            <div className="max-h-[600px] overflow-y-auto pr-2 space-y-6">
              {parsedLogs.map((log, index) => (
                <div key={log.id} className={`bg-zinc-50 dark:bg-zinc-950 border rounded-xl p-6 relative transition-colors ${selectedLogs.has(index) ? 'border-purple-500 ring-1 ring-purple-500' : 'border-zinc-200 dark:border-zinc-800'}`}>
                  <div className="absolute top-4 right-4 flex gap-2 items-center">
                    <input type="checkbox" checked={selectedLogs.has(index)} onChange={(e) => {
                      const newSet = new Set(selectedLogs);
                      if (e.target.checked) newSet.add(index);
                      else newSet.delete(index);
                      setSelectedLogs(newSet);
                    }} className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-500 px-2 py-1 rounded">#{index + 1}</span>
                    <button onClick={() => setParsedLogs(parsedLogs.filter((_, i) => i !== index))} className="text-zinc-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">날짜</label>
                        <input type="date" value={log.date || ''} onChange={e => updateLog(index, { date: e.target.value })} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm text-zinc-900 dark:text-white" />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">시작 ~ 종료 시간</label>
                        <div className="flex gap-1 items-center">
                          <input type="time" value={log.time || ''} onChange={e => updateLog(index, { time: e.target.value })} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm text-zinc-900 dark:text-white" />
                          <span className="text-zinc-500">~</span>
                          <input type="time" value={log.endTime || ''} onChange={e => updateLog(index, { endTime: e.target.value })} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm text-zinc-900 dark:text-white" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">방송 길이(시간)</label>
                        <input type="number" step="0.1" value={log.durationHours || 0} onChange={e => updateLog(index, { durationHours: Number(e.target.value) })} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm text-zinc-900 dark:text-white" />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs text-zinc-500">플레이한 게임 (다중 가능)</label>
                        <button onClick={() => {
                          const updated = [...parsedLogs];
                          if (!updated[index].games) updated[index].games = [];
                          updated[index].games!.push({ name: '', link: '', category: '종합' });
                          setParsedLogs(updated);
                        }} className="text-[10px] text-zinc-500 hover:text-purple-600">게임 추가</button>
                      </div>
                      
                      {(!log.games || log.games.length === 0) ? (
                        <div className="flex gap-2">
                          <input type="text" placeholder="게임 이름" value={log.game || ''} onChange={e => {
                            const updated = [...parsedLogs];
                            updated[index].game = e.target.value;
                            updated[index].games = [{ name: e.target.value, link: '', category: '종합' }];
                            setParsedLogs(updated);
                          }} className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm text-zinc-900 dark:text-white" />
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {log.games.map((g, gIdx) => (
                            <div key={gIdx} className="flex flex-col gap-2 p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
                              <div className="flex gap-2 items-center">
                                <input type="text" placeholder="게임 이름" value={g.name} onChange={e => {
                                  const updated = [...parsedLogs];
                                  updated[index].games![gIdx].name = e.target.value;
                                  if (gIdx === 0) updated[index].game = e.target.value;
                                  setParsedLogs(updated);
                                }} className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded p-1.5 text-sm text-zinc-900 dark:text-white" />
                                
                                <input type="text" placeholder="카테고리" value={g.category || ''} onChange={e => {
                                  const updated = [...parsedLogs];
                                  updated[index].games![gIdx].category = e.target.value;
                                  setParsedLogs(updated);
                                }} className="w-24 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded p-1.5 text-sm text-zinc-900 dark:text-white" />
                                
                                <button onClick={() => {
                                  const updated = [...parsedLogs];
                                  updated[index].games!.splice(gIdx, 1);
                                  setParsedLogs(updated);
                                }} className="text-zinc-400 hover:text-red-500 p-1"><X className="w-4 h-4"/></button>
                              </div>
                              <input type="url" placeholder="게임 링크 (선택)" value={g.link} onChange={e => {
                                const updated = [...parsedLogs];
                                updated[index].games![gIdx].link = e.target.value;
                                setParsedLogs(updated);
                              }} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded p-1.5 text-xs text-zinc-900 dark:text-white" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
                      {(['vods', 'edited', 'shorts'] as const).map(type => (
                        <div key={type} className="bg-white dark:bg-zinc-900/50 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                          <div className="flex items-center justify-between mb-2">
                            <label className={`block text-xs font-bold ${type === 'vods' ? 'text-purple-600 dark:text-purple-400' : type === 'edited' ? 'text-blue-600 dark:text-blue-400' : 'text-red-500 dark:text-red-400'}`}>
                              {type === 'vods' ? '다시보기 (풀영상)' : type === 'edited' ? '편집본 (유튜브)' : '관련 쇼츠'}
                            </label>
                            <button onClick={() => addLink(index, type)} className="text-[10px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 rounded">추가</button>
                          </div>
                          
                          <div className="space-y-2">
                            {log[type]?.map((item, lIdx) => (
                              <div key={lIdx} className="flex gap-2 items-start">
                                <div className="flex-1 space-y-1">
                                  <input type="text" placeholder="제목" value={item.title} onChange={e => updateLink(index, type, lIdx, { ...item, title: e.target.value })} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-1.5 text-xs text-zinc-900 dark:text-white" />
                                  <input type="url" placeholder="URL 링크" value={item.url} onChange={e => updateLink(index, type, lIdx, { ...item, url: e.target.value })} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-1.5 text-xs text-zinc-900 dark:text-white" />
                                </div>
                                <div className="flex flex-col gap-1 items-end justify-start">
                                  <button onClick={() => removeLink(index, type, lIdx)} className="p-1.5 text-zinc-400 hover:text-red-500 flex items-center justify-center"><X className="w-4 h-4"/></button>
                                  {type === 'edited' && (
                                    <button onClick={() => moveToShorts(index, lIdx)} className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-1.5 py-1 rounded border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors whitespace-nowrap">쇼츠로 이동</button>
                                  )}
                                </div>
                              </div>
                            ))}
                            {log[type]?.length === 0 && <div className="text-xs text-zinc-400 text-center py-2">등록된 링크 없음</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={handleSaveLogs}
              className="mt-2 w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
            >
              <Save className="w-4 h-4" />
              {parsedLogs.length}개 최종 저장하기
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">예측 가이드라인 편집 (줄글 수정)</h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">**강조할 내용**을 ** 로 감싸면 메인 화면에서 색상으로 하이라이트 표시됩니다.</p>
        <div className="space-y-4">
          {guides.map((guide) => (
            <div key={guide.id} className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 bg-zinc-50 dark:bg-zinc-950">
              {editingGuide === guide.id ? (
                <div className="space-y-3">
                  <input type="text" value={guideForm.title} onChange={e => setGuideForm({...guideForm, title: e.target.value})} className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg p-2 font-bold text-zinc-900 dark:text-white" />
                  <textarea value={guideForm.content} onChange={e => setGuideForm({...guideForm, content: e.target.value})} className="w-full h-32 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg p-2 text-sm text-zinc-900 dark:text-white" />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditingGuide(null)} className="px-4 py-2 text-sm text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg">취소</button>
                    <button onClick={() => {
                      onUpdateGuide({ ...guide, title: guideForm.title, content: guideForm.content });
                      setEditingGuide(null);
                    }} className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700">저장</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-zinc-800 dark:text-zinc-200">{guide.title}</h4>
                    <button onClick={() => {
                      setEditingGuide(guide.id);
                      setGuideForm({ title: guide.title, content: guide.content });
                    }} className="text-xs text-purple-600 dark:text-purple-400 font-medium px-2 py-1 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded">수정</button>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">{guide.content}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">최근 방송 기록 관리</h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">가장 최근에 등록된 10개의 방송 기록을 수정하거나 삭제할 수 있습니다.</p>
        <div className="space-y-4">
          {Object.values(data.logs).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10).map((log) => (
            <div key={log.id} className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 bg-zinc-50 dark:bg-zinc-950 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <p className="font-bold text-zinc-900 dark:text-zinc-100">{log.date} {log.time}</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{log.vods?.[0]?.title || log.game || '제목 없음'}</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    const editLog = window.prompt("방송 제목(방제)을 수정하세요:", log.vods?.[0]?.title || log.game);
                    if (editLog !== null && editLog.trim() !== '') {
                      const updatedLog = { ...log };
                      if (updatedLog.vods && updatedLog.vods.length > 0) {
                        updatedLog.vods[0].title = editLog;
                      } else {
                        updatedLog.vods = [{ title: editLog, url: '' }];
                      }
                      onUpdateLog(updatedLog);
                      alert('수정되었습니다.');
                    }
                  }} 
                  className="px-3 py-1.5 text-xs font-medium bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg transition-colors"
                >
                  수정
                </button>
                <button 
                  onClick={() => {
                    if(window.confirm(`${log.date} 기록을 정말 삭제하시겠습니까?`)) {
                      onDeleteLog(log.id);
                    }
                  }} 
                  className="px-3 py-1.5 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg transition-colors"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
          {Object.keys(data.logs).length === 0 && (
             <div className="text-center py-6 text-zinc-500 text-sm">등록된 방송 기록이 없습니다.</div>
          )}
        </div>
      </div>
    </div>
  );
}
