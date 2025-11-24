import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Activity, Thermometer, Wind, Settings, Cpu, FileText } from 'lucide-react';
import { SealInputs, SealResults } from './types';
import { calculateHeatTransfer } from './utils/formulas';
import { InputField } from './components/InputField';
import { analyzeResults } from './services/geminiService';

const INITIAL_INPUTS: SealInputs = {
  d_outer: 0.150,     // 150mm
  n_rpm: 10300,       // 10300 rpm
  rho: 1.225,         // Air density
  mu: 1.81e-5,        // Air viscosity
  lambda_gas: 0.026,  // Air thermal conductivity
  Pr: 0.71,           // Air Prandtl
  u_axial: 5.0,       // Axial velocity
  delta_gap: 5.0e-6,  // 5 microns
  d_hyd: 1.0e-5,      // Small hydraulic diameter
  B: 2.0
};

export default function App() {
  const [inputs, setInputs] = useState<SealInputs>(INITIAL_INPUTS);
  const [results, setResults] = useState<SealResults | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [apiKeyMissing, setApiKeyMissing] = useState<boolean>(false);

  // Calculate whenever inputs change
  useEffect(() => {
    const res = calculateHeatTransfer(inputs);
    setResults(res);
  }, [inputs]);

  // Check API key presence
  useEffect(() => {
    if (!process.env.API_KEY) {
      setApiKeyMissing(true);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  const handleGenerateInsight = async () => {
    if (!results) return;
    setIsAnalyzing(true);
    try {
      const text = await analyzeResults(inputs, results);
      setAiAnalysis(text);
    } catch (err) {
      setAiAnalysis("生成分析时出错。请检查您的网络连接或 API Key。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Prepare chart data
  const chartData = results ? [
    { name: '静环 (Static H_s)', value: results.H_s, fill: '#3b82f6' },
    { name: '动环 (Dynamic H_r)', value: results.H_r, fill: '#ef4444' },
  ] : [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Activity className="h-6 w-6 text-blue-400" />
            <h1 className="text-xl font-bold tracking-tight">干气密封热计算器</h1>
          </div>
          <div className="text-xs text-slate-400 hidden sm:block">
            基于 Nu_s & Nu_r 经验关联式
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: INPUTS */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 bg-slate-100 border-b border-slate-200 flex items-center space-x-2">
                <Settings className="w-4 h-4 text-slate-500" />
                <h2 className="font-semibold text-slate-800">参数设置</h2>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Section 1: Geometry & Operation */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">几何与运行参数</h3>
                  <InputField label="动环外径 (d_outer)" name="d_outer" value={inputs.d_outer} unit="m" onChange={handleInputChange} />
                  <InputField label="转速 (n_rpm)" name="n_rpm" value={inputs.n_rpm} unit="r/min" step="100" onChange={handleInputChange} />
                  <InputField label="密封间隙 (delta)" name="delta_gap" value={inputs.delta_gap} unit="m" step="1e-7" onChange={handleInputChange} />
                  <InputField label="水力直径 (d_hyd)" name="d_hyd" value={inputs.d_hyd} unit="m" step="1e-6" onChange={handleInputChange} />
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">气体物性</h3>
                  <InputField label="密度 (rho)" name="rho" value={inputs.rho} unit="kg/m³" onChange={handleInputChange} />
                  <InputField label="动力粘度 (mu)" name="mu" value={inputs.mu} unit="Pa·s" step="1e-6" onChange={handleInputChange} />
                  <InputField label="导热系数 (lambda)" name="lambda_gas" value={inputs.lambda_gas} unit="W/(m·K)" onChange={handleInputChange} />
                  <InputField label="普朗特数 (Pr)" name="Pr" value={inputs.Pr} unit="-" onChange={handleInputChange} />
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">流动与修正</h3>
                  <InputField label="轴向流速 (Uz)" name="u_axial" value={inputs.u_axial} unit="m/s" onChange={handleInputChange} />
                  <InputField label="修正系数 B" name="B" value={inputs.B} unit="-" onChange={handleInputChange} />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: RESULTS */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* KPI CARDS */}
            {results && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Static Ring Card */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Thermometer className="w-16 h-16 text-blue-600" />
                  </div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">静环换热系数 (H_s)</h3>
                  <div className="text-3xl font-bold text-slate-900 mb-2">
                    {results.H_s.toLocaleString(undefined, { maximumFractionDigits: 1 })} <span className="text-sm font-normal text-slate-400">W/(m²·K)</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-slate-500 bg-slate-50 rounded-md p-2 w-fit">
                    <span className="font-mono">Nu_s: {results.Nu_s.toFixed(2)}</span>
                    <span>•</span>
                    <span className="font-mono">Re_ax: {results.Re_ax.toFixed(0)}</span>
                  </div>
                </div>

                {/* Dynamic Ring Card */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Wind className="w-16 h-16 text-red-600" />
                  </div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">动环换热系数 (H_r)</h3>
                  <div className="text-3xl font-bold text-slate-900 mb-2">
                    {results.H_r.toLocaleString(undefined, { maximumFractionDigits: 1 })} <span className="text-sm font-normal text-slate-400">W/(m²·K)</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-slate-500 bg-slate-50 rounded-md p-2 w-fit">
                    <span className="font-mono">Nu_r: {results.Nu_r.toFixed(2)}</span>
                    <span>•</span>
                    <span className="font-mono">Re_rot: {results.Re_rot.toFixed(0)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* CHART SECTION */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-96">
               <h3 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-wider flex items-center">
                 <Activity className="w-4 h-4 mr-2 text-slate-400" />
                 对比分析
               </h3>
               <ResponsiveContainer width="100%" height="85%">
                 <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={true} />
                    <XAxis type="number" unit=" W/m²K" />
                    <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 12}} />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend />
                    <Bar dataKey="value" name="换热系数 (W/m²K)" barSize={40} radius={[0, 4, 4, 0]} animationDuration={1000}>
                      {
                        chartData.map((entry, index) => (
                          <React.Fragment key={`cell-${index}`}>
                             {/* Recharts specific coloring is handled in data */}
                          </React.Fragment>
                        ))
                      }
                    </Bar>
                 </BarChart>
               </ResponsiveContainer>
            </div>

            {/* AI ANALYSIS SECTION */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
               <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-white flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Cpu className="w-5 h-5 text-indigo-600" />
                    <h2 className="font-semibold text-slate-800">AI 工程洞察</h2>
                  </div>
                  <button 
                    onClick={handleGenerateInsight}
                    disabled={isAnalyzing || apiKeyMissing}
                    className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors flex items-center space-x-1
                      ${apiKeyMissing 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : isAnalyzing 
                          ? 'bg-indigo-50 text-indigo-400' 
                          : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                      }`}
                  >
                    {isAnalyzing ? (
                      <>
                         <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                         </svg>
                         分析中...
                      </>
                    ) : apiKeyMissing ? (
                      '缺少 API Key'
                    ) : (
                      '生成分析'
                    )}
                  </button>
               </div>
               <div className="p-6">
                 {aiAnalysis ? (
                   <div className="prose prose-sm text-slate-600 max-w-none">
                     <p className="whitespace-pre-line leading-relaxed">{aiAnalysis}</p>
                   </div>
                 ) : (
                   <div className="text-center py-8 text-slate-400 text-sm">
                     <FileText className="w-10 h-10 mx-auto mb-3 opacity-20" />
                     <p>点击“生成分析”以获取基于 AI 的热力与流体状态评估。</p>
                   </div>
                 )}
               </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}