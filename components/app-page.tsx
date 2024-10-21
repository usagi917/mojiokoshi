"use client"

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FileText, FileCheck, Loader2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"


export function AppPage() {
  const [file, setFile] = useState<File | null>(null)
  const [transcript, setTranscript] = useState('')
  const [summary, setSummary] = useState('')
  const [minutes, setMinutes] = useState('')
  const [summaryLength, setSummaryLength] = useState('medium')
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeTab, setActiveTab] = useState('api-keys')
  const [progress, setProgress] = useState(0)
  const [openAIKey, setOpenAIKey] = useState('')
  const [geminiKey, setGeminiKey] = useState('')
  const audioRef = useRef<HTMLAudioElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null);
 

  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.AudioContext)();
    }
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (file && audioRef.current && canvasRef.current) {
      const audio = audioRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      audio.src = URL.createObjectURL(file)
      audio.load()

      audio.onloadedmetadata = () => {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        if (!audioContextRef.current) return;

        const analyser = audioContextRef.current.createAnalyser();
        const source = audioContextRef.current.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioContextRef.current.destination);

        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
          requestAnimationFrame(draw);
          analyser.getByteFrequencyData(dataArray);

          ctx.fillStyle = 'rgb(240, 240, 240)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          const barWidth = (canvas.width / bufferLength) * 2.5;
          let x = 0;

          for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * canvas.height;

            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, 'rgb(0, 215, 255)');
            gradient.addColorStop(1, 'rgb(0, 143, 255)');

            ctx.fillStyle = gradient;
            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

            x += barWidth + 1;
          }
        };

        draw();
      }
    }
  }, [file])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }


  const handleUpload = async () => {
    if (!file) return
    if (!openAIKey && !geminiKey) {
      toast({
        title: "エラー",
        description: "APIキーが設定されていません。",
      })
      return
    }

    setIsProcessing(true)
    setProgress(0)
    const formData = new FormData()
    formData.append('audio', file, file.name)  // ファイル名を含める
    formData.append('apiKey', openAIKey || geminiKey)

    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setTranscript(data.transcript)
        setActiveTab('transcript')
        toast({
          title: "文字起こし完了",
          description: "音声の文字起こしが正常に完了しました。",
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || '文字起こしエラー')
      }
    } catch (error) {
      console.error('エラー:', error)
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "文字起こし処理中にエラーが発生しました。",
      })
    } finally {
      setIsProcessing(false)
      setProgress(100)
    }
  }

  const generateSummary = async () => {
    setIsProcessing(true);
    setProgress(0);
    try {
      if (!transcript || transcript.trim() === '') {
        toast({
          title: "エラー",
          description: "文字起こしされたテキストが存在しません。",
        });
        setIsProcessing(false);
        return;
      }
  
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: transcript, length: summaryLength, apiKey: openAIKey }),
      });
  
      if (response.ok) {
        const data = await response.json();
        setSummary(data.summary);
        setActiveTab('summary');
        toast({
          title: "要約完了",
          description: "テキストの要約が正常に完了しました。",
        });
      } else {
        throw new Error('要約生成エラー');
      }
    } catch (error) {
      console.error('要約生成エラー:', error);
      toast({
        title: "エラー",
        description: "要約生成中にエラーが発生しました。",
      });
    } finally {
      setIsProcessing(false);
      setProgress(100);
    }
  };

  const generateMinutes = async () => {
    setIsProcessing(true);
    setProgress(0);
    try {
      const response = await fetch('/api/generate-minutes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: transcript, apiKey: openAIKey }),
      });
      if (response.ok) {
        const data = await response.json();
        setMinutes(data.minutes);
        setActiveTab('minutes');
        toast({
          title: "議事録生成完了",
          description: "議事録の生成が正常に完了しました。",
        });
      } else {
        throw new Error('議事録生成エラー');
      }
    } catch (error) {
      console.error('議事録生成エラー:', error);
      toast({
        title: "エラー",
        description: "議事録生成中にエラーが発生しました。",
      });
    } finally {
      setIsProcessing(false);
      setProgress(100);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-8 max-w-7xl">
      <motion.h1
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-4xl font-bold text-center text-primary"
      >
        音声文字起こしと要約アプリ
      </motion.h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 rounded-full p-1 bg-muted">
          <TabsTrigger value="api-keys" className="rounded-full transition-all">APIキー</TabsTrigger>
          <TabsTrigger value="upload" className="rounded-full transition-all">アップロード</TabsTrigger>
          <TabsTrigger value="transcript" className="rounded-full transition-all">文字起こし</TabsTrigger>
          <TabsTrigger value="summary" className="rounded-full transition-all">要約</TabsTrigger>
          <TabsTrigger value="minutes" className="rounded-full transition-all">議事録</TabsTrigger>
        </TabsList>

        <TabsContent value="api-keys">
          <Card>
            <CardHeader className="bg-gradient-to-r from-purple-400 to-pink-300 text-white">
              <CardTitle className="text-2xl">APIキー設定</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="openai-key">OpenAI APIキー</Label>
                <Input
                  id="openai-key"
                  type="password"
                  value={openAIKey}
                  onChange={(e) => setOpenAIKey(e.target.value)}
                  placeholder="sk-..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gemini-key">Gemini APIキー</Label>
                <Input
                  id="gemini-key"
                  type="password"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AIza..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload">
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-400 to-cyan-300 text-white">
              <CardTitle className="text-2xl">音声ファイルをアップロード</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="audio-file" className="text-lg font-medium">音声ファイルを選択</Label>
                <Input
                  id="audio-file"
                  type="file"
                  accept="audio/*"
                  onChange={handleFileChange}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80 cursor-pointer"
                />
              </div>
              {file && (
                <div className="mt-4">
                  <audio ref={audioRef} controls className="w-full" />
                  <canvas ref={canvasRef} className="w-full h-24 mt-2" />
                </div>
              )}
              <Button
                onClick={handleUpload}
                disabled={!file || isProcessing}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white transition-all duration-300 transform hover:scale-105"
              >
                {isProcessing ? '処理中...' : 'アップロードして文字起こし'}
                <Upload className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transcript">
          <Card>
            <CardHeader className="bg-gradient-to-r from-green-400 to-teal-300 text-white">
              <CardTitle className="text-2xl">文字起こし結果</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <Textarea value={transcript} readOnly className="min-h-[200px] bg-gray-50 border-gray-200" />
              <div className="flex items-center space-x-4 mt-4">
                <Select value={summaryLength} onValueChange={setSummaryLength}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="要約の長さ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">短い</SelectItem>
                    <SelectItem value="medium">中程度</SelectItem>
                    <SelectItem value="long">長い</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={generateSummary} disabled={isProcessing} className="bg-gradient-to-r from-green-500 to-teal-400 hover:from-green-600 hover:to-teal-500 text-white transition-all duration-300 transform hover:scale-105">
                  要約を生成
                  <FileText className="ml-2 h-4  w-4" />
                </Button>
                <Button onClick={generateMinutes} disabled={isProcessing} className="bg-gradient-to-r from-purple-500 to-pink-400 hover:from-purple-600 hover:to-pink-500 text-white transition-all duration-300 transform hover:scale-105">
                  議事録を生成
                  <FileCheck className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary">
          <Card className="h-full">
            <CardHeader className="bg-gradient-to-r from-yellow-400 to-orange-300 text-white">
              <CardTitle className="text-2xl">要約</CardTitle>
            </CardHeader>
            <CardContent className="p-6 h-[calc(100vh-200px)] overflow-auto">
              <Textarea 
                value={summary} 
                readOnly 
                className="min-h-full w-full bg-gray-50 border-gray-200" 
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="minutes">
          <Card className="h-full">
            <CardHeader className="bg-gradient-to-r from-purple-400 to-pink-300 text-white">
              <CardTitle className="text-2xl">議事録</CardTitle>
            </CardHeader>
            <CardContent className="p-6 h-[calc(100vh-200px)] overflow-auto">
              <Textarea 
                value={minutes} 
                readOnly 
                className="min-h-full w-full bg-gray-50 border-gray-200" 
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center"
          >
            <Card className="w-[300px]">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
                <p className="mt-4 text-center">音声を処理中です...</p>
                <Progress value={progress} className="w-full mt-4" />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function toast({ title, description }: { title: string; description: string }) {
  // トースト通知の実装をここに追加する
  console.log(`タイトル: ${title}, 説明: ${description}`);
}


