import React, { useState, useEffect } from 'react';
import { 
  Database, 
  RefreshCw, 
  Download, 
  Copy, 
  Check, 
  Search, 
  FileJson, 
  FolderTree, 
  HardDrive, 
  RotateCcw,
  Sparkles,
  Layers,
  ShieldCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' ? '/api' : 'http://localhost:8000/api');

export default function BackendDataInspector() {
  const [dbData, setDbData] = useState<Record<string, any>>({});
  const [selectedCollection, setSelectedCollection] = useState<string>('medlens_intakes');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    fetchDatabaseData();
  }, []);

  const fetchDatabaseData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/medlens/database/inspect`);
      if (res.ok) {
        const data = await res.json();
        setDbData(data);
        const collections = Object.keys(data);
        if (collections.length > 0 && !collections.includes(selectedCollection)) {
          setSelectedCollection(collections[0]);
        }
      } else {
        throw new Error('Failed to inspect DB');
      }
    } catch (err) {
      console.warn('Fallback inspection:', err);
      // Client fallback representation
      setDbData({
        medlens_intakes: [
          {
            patient_id: "p-101",
            full_name: "Eleanor Vance",
            age: 58,
            gender: "Female",
            symptoms: ["Chronic fatigue", "Increased thirst", "Occasional blurred vision"],
            chronic_conditions: ["Essential Hypertension (Diagnosed 2019)"],
            allergies: ["Penicillin", "Sulfa drugs"],
            current_medications: [
              { name: "Amlodipine", dosage: "5mg once daily", source: "Patient Self-Reported" },
              { name: "Ibuprofen", dosage: "400mg PRN", source: "Patient Self-Reported" }
            ],
            provenance: "User-Provided (Patient Intake Form)",
            intake_date: "2026-09-05"
          }
        ],
        medlens_reports: [
          {
            report_id: "rep-demo-01",
            patient_id: "p-101",
            report_title: "Comprehensive Metabolic & Renal Panel",
            report_date: "2026-09-05",
            laboratory_name: "Quest Diagnostics / LalPathLabs Certified",
            file_name: "Lab_Report_Panel_Sep2026.pdf",
            extracted_tests_count: 6,
            inconsistencies_count: 2,
            provenance: "AI-Extracted & Structured"
          }
        ]
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetData = async () => {
    try {
      const res = await fetch(`${API_URL}/medlens/database/reset`, { method: 'POST' });
      if (res.ok) {
        toast.success('Database reset to baseline clinical demo state');
        fetchDatabaseData();
      }
    } catch (err) {
      toast.info('Reset local view');
      fetchDatabaseData();
    }
  };

  const handleCopy = () => {
    const activeData = dbData[selectedCollection] || {};
    navigator.clipboard.writeText(JSON.stringify(activeData, null, 2));
    setCopied(true);
    toast.success(`Copied collection '${selectedCollection}' JSON to clipboard`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dbData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `medlens_database_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success('Database export downloaded as JSON');
  };

  const collections = Object.keys(dbData);
  const activeRecords = dbData[selectedCollection] || [];

  const filteredRecords = Array.isArray(activeRecords) 
    ? activeRecords.filter(r => JSON.stringify(r).toLowerCase().includes(searchTerm.toLowerCase()))
    : activeRecords;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl text-white shadow-lg border border-slate-800">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
            <HardDrive className="w-3.5 h-3.5" />
            Direct Database Inspector • Zero Account Required
          </div>
          <h1 className="text-xl font-extrabold tracking-tight">
            Backend Data & Storage Hub
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl">
            Inspect, query, and export live records without logging into old management credentials. 
            All clinical data is stored on disk in <code className="bg-slate-800 px-1.5 py-0.5 rounded text-indigo-300 font-mono text-[11px]">backend/data/medlens_db.json</code>.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchDatabaseData}
            disabled={isLoading}
            className="h-8 text-xs bg-slate-800 hover:bg-slate-700 text-white border-slate-700 gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleResetData}
            className="h-8 text-xs bg-slate-800 hover:bg-rose-950 text-rose-300 border-rose-900/50 gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Demo Data
          </Button>

          <Button 
            size="sm" 
            onClick={handleDownload}
            className="h-8 text-xs bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Main Grid: Collections Selector & Data Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Collection Navigation */}
        <div className="lg:col-span-4 space-y-3">
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="py-3 px-4 bg-slate-50 border-b border-slate-100">
              <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-indigo-600" />
                Database Collections ({collections.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 space-y-1">
              {collections.length === 0 ? (
                <p className="p-4 text-center text-xs text-slate-400">Loading collections...</p>
              ) : (
                collections.map((colName) => {
                  const count = Array.isArray(dbData[colName]) ? dbData[colName].length : 1;
                  const isSelected = selectedCollection === colName;
                  return (
                    <button
                      key={colName}
                      onClick={() => setSelectedCollection(colName)}
                      className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between text-xs ${
                        isSelected 
                          ? 'bg-indigo-50 border border-indigo-200 text-indigo-950 font-semibold shadow-2xs' 
                          : 'hover:bg-slate-50 text-slate-700 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <FileJson className={`w-4 h-4 shrink-0 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                        <span className="truncate">{colName}</span>
                      </div>
                      <Badge variant={isSelected ? 'default' : 'secondary'} className={`text-[10px] px-2 py-0 ${isSelected ? 'bg-indigo-600' : ''}`}>
                        {count} records
                      </Badge>
                    </button>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Quick Storage Location Card */}
          <Card className="border-slate-200 bg-slate-50/50 text-xs text-slate-600 p-4 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <Database className="w-4 h-4 text-indigo-600" />
              File System Location
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500">
              You can also inspect or edit this raw database file directly in VS Code or Notepad:
            </p>
            <div className="p-2 bg-white rounded border border-slate-200 font-mono text-[10px] text-indigo-950 break-all select-all">
              backend/data/medlens_db.json
            </div>
          </Card>
        </div>

        {/* Right Column: Live Data Inspector */}
        <div className="lg:col-span-8 space-y-3">
          <Card className="border-slate-200 shadow-xs flex flex-col h-[650px] overflow-hidden">
            <CardHeader className="py-3 px-4 bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">
                  Collection: <span className="text-indigo-600 font-mono">{selectedCollection}</span>
                </span>
                <span className="text-[11px] text-slate-400">
                  ({Array.isArray(filteredRecords) ? filteredRecords.length : 1} records matched)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative w-48">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <Input 
                    placeholder="Search JSON..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-8 text-xs pl-8 bg-white"
                  />
                </div>

                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCopy}
                  className="h-8 text-xs gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0 flex-1 bg-slate-950 text-slate-100 overflow-auto font-mono text-xs p-4 leading-relaxed">
              <pre className="text-emerald-400/90 whitespace-pre-wrap select-text">
                {JSON.stringify(filteredRecords, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
