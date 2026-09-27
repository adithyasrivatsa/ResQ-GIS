import type { WeatherForecast } from '../types';

const today = new Date();
const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function getDay(offset: number): string {
  const d = new Date(today);
  d.setDate(d.getDate() + offset);
  return days[d.getDay()];
}

function getDate(offset: number): string {
  const d = new Date(today);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

export const DEMO_WEATHER: WeatherForecast[] = [
  {
    date: getDate(0),
    dayLabel: 'TODAY',
    condition: 'RAIN',
    maxTemp: 18,
    minTemp: 12,
    rainfall: 45,
    warning: 'orange',
  },
  {
    date: getDate(1),
    dayLabel: getDay(1),
    condition: 'RAIN',
    maxTemp: 17,
    minTemp: 11,
    rainfall: 60,
    warning: 'orange',
  },
  {
    date: getDate(2),
    dayLabel: getDay(2),
    condition: 'CLOUD',
    maxTemp: 19,
    minTemp: 13,
    rainfall: 12,
    warning: 'yellow',
  },
  {
    date: getDate(3),
    dayLabel: getDay(3),
    condition: 'CLEAR',
    maxTemp: 22,
    minTemp: 14,
    rainfall: 0,
  },
];
