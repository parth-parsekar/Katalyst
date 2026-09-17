import React from 'react';
import { Target, CheckCircle, Clock } from 'lucide-react';

const StatsWidget = ({ resources }) => {
  const total = resources.length;
  const completed = resources.filter(r => r.status === 'Completed').length;
  const inProgress = resources.filter(r => r.status === 'In Progress').length;
  
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-[100px] -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
      
      <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
        <Target className="w-5 h-5 text-primary" />
        Progress Overview
      </h2>

      <div className="mb-6">
        <div className="flex justify-between items-end mb-2">
          <span className="text-4xl font-bold tracking-tight text-white">{percentage}%</span>
          <span className="text-textMuted text-sm font-medium mb-1">Completed</span>
        </div>
        <div className="h-3 w-full bg-surface rounded-full overflow-hidden border border-white/5">
          <div 
            className="h-full bg-gradient-to-r from-primary to-blue-400 rounded-full transition-all duration-1000 ease-out relative"
            style={{ width: `${percentage}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface/50 p-4 rounded-xl border border-white/5 flex flex-col gap-1 hover:bg-surface/80 transition-colors">
          <span className="text-textMuted text-sm flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-success" /> Done
          </span>
          <span className="text-2xl font-semibold">{completed}</span>
        </div>
        <div className="bg-surface/50 p-4 rounded-xl border border-white/5 flex flex-col gap-1 hover:bg-surface/80 transition-colors">
          <span className="text-textMuted text-sm flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-warning" /> Active
          </span>
          <span className="text-2xl font-semibold">{inProgress}</span>
        </div>
      </div>
    </div>
  );
};

export default StatsWidget;
