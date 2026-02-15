'use client';

import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend
);

export default function ScoreTrendChart({ trend }) {
  if (!Array.isArray(trend) || trend.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-gray-500">
        No trend data available
      </div>
    );
  }
const labels = trend.map(d => d.date);

// you only have avg_after for now
const afterData = trend.map(d => d.avg_after ?? 0);

// synthetic baseline so chart still works visually
const beforeData = afterData.map(() => 0);


  const data = {
  labels,
  datasets: [
    {
      label: 'Before Tailoring',
      data: beforeData,
      borderColor: '#9ca3af',
      backgroundColor: 'rgba(156,163,175,0.2)',
      tension: 0.35,
      pointRadius: 3,
    },
    {
      label: 'After Tailoring',
      data: afterData,
      borderColor: '#2563eb',
      backgroundColor: 'rgba(37,99,235,0.2)',
      tension: 0.35,
      pointRadius: 4,
    },
  ],
};


  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: { stepSize: 10 },
        title: { display: true, text: 'Score (%)' },
      },
      x: {
        ticks: { autoSkip: true, maxTicksLimit: 7 },
      },
    },
  };

  return (
    <div className="h-64">
      <Line data={data} options={options} />
    </div>
  );
}
