import React from 'react';
import { formatAthens, outcomeLabel, taskCallNotes } from '@/constants/callOutcomes';

/** Notes of previous calls on a task, latest first, with date/time (Europe/Athens). */
export const TaskCallNotes: React.FC<{ task: any; greek?: boolean; className?: string }> = ({ task, greek = true, className = '' }) => {
  const notes = taskCallNotes(task);
  if (notes.length === 0) return null;

  return (
    <div className={`bg-slate-50 rounded-xl p-4 border border-slate-100 ${className}`}>
      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
        {greek ? 'Σημειώσεις προηγούμενων κλήσεων' : 'Previous call notes'}
      </span>
      <ul className="space-y-2 max-h-56 overflow-y-auto">
        {notes.map((n, i) => (
          <li key={`${n.at}-${i}`} className="text-xs text-slate-700 border-l-2 border-slate-300 pl-2">
            <div className="text-[10px] font-bold text-slate-500">
              {formatAthens(n.at)}
              {n.outcome ? ` · ${outcomeLabel(n.outcome, greek)}` : ''}
            </div>
            {n.note && <p className="whitespace-pre-wrap leading-relaxed">{n.note}</p>}
            {n.nextGoal && (
              <p className="text-[11px] text-slate-500">{greek ? 'Στόχος επόμενης επαφής' : 'Next goal'}: {n.nextGoal}</p>
            )}
            {n.nextCallAt && (
              <p className="text-[11px] text-slate-500">{greek ? 'Επόμενη κλήση' : 'Next call'}: {formatAthens(n.nextCallAt)}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};
