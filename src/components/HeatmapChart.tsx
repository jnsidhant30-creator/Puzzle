import React from 'react';
import { HeatmapDay } from '../types';
import { formatCount } from '../utils/format';

interface Props {
  data: HeatmapDay[];
}

export const HeatmapChart: React.FC<Props> = ({ data }) => {
  const getColorClass = (level: HeatmapDay['level']) => {
    switch (level) {
      case 1:
        return 'bg-[#1C3D47] border-[#2C5561]';
      case 2:
        return 'bg-[#087F8C]/65 border-[#087F8C]';
      case 3:
        return 'bg-[#087F8C] border-[#38C6BA]';
      case 4:
        return 'bg-[#38C6BA] border-[#A8E5D5]';
      default:
        return 'bg-[#142331] border-[#36515F]';
    }
  };

  return (
    <div className="flex flex-col gap-2 p-1 overflow-x-auto">
      <div className="flex gap-1.5 min-w-max">
        {data.map((day, idx) => (
          <div
            key={idx}
            title={`${day.date}: ${formatCount(day.count, 'puzzle')} solved`}
            className={`w-3.5 h-3.5 rounded-sm border transition-colors ${getColorClass(day.level)}`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between text-xs text-[#B4C3CE] mt-1">
        <span>Less active</span>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-sm bg-[#142331] border border-[#36515F]" />
          <div className="w-2.5 h-2.5 rounded-sm bg-[#1C3D47] border border-[#2C5561]" />
          <div className="w-2.5 h-2.5 rounded-sm bg-[#087F8C]/65 border border-[#087F8C]" />
          <div className="w-2.5 h-2.5 rounded-sm bg-[#087F8C] border border-[#38C6BA]" />
          <div className="w-2.5 h-2.5 rounded-sm bg-[#38C6BA] border border-[#A8E5D5]" />
        </div>
        <span>More active</span>
      </div>
    </div>
  );
};
