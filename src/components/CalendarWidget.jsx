import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ArrowLeftRight } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import './CalendarWidget.css';

export default function CalendarWidget() {
  const { dashboardData } = useAppContext();
  const transactions = dashboardData?.transactions || [];
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Calendar logic
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const renderCells = () => {
    const cells = [];
    const today = new Date();
    const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;

    const calendarData = {};
    transactions.forEach(tx => {
      if (!tx.date) return;
      const txDate = new Date(tx.date);
      if (txDate.getFullYear() === year && txDate.getMonth() === month) {
        const day = txDate.getDate().toString();
        if (!calendarData[day]) calendarData[day] = { count: 0, net: 0 };
        calendarData[day].count += 1;
        calendarData[day].net += tx.type === 'profit' ? Number(tx.amount) : -Number(tx.amount);
      }
    });

    // Blank cells before the 1st
    for (let i = 0; i < firstDayOfMonth; i++) {
       cells.push(<div key={`empty-${i}`} className="calendar-cell empty"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = isCurrentMonth && today.getDate() === day;
      const data = calendarData[day.toString()];
      const isNegative = data && data.net < 0;
      const isPositive = data && data.net > 0;

      let cellClass = 'calendar-cell';
      if (isToday) cellClass += ' today';
      if (isNegative) cellClass += ' negative-day';
      if (isPositive) cellClass += ' positive-day';

      cells.push(
        <div key={`day-${day}`} className={cellClass}>
          <div className="cell-date">{day}</div>
          {data && (
             <div className="cell-data">
               <div className="tx-count">
                 {data.count} <ArrowLeftRight size={10} />
               </div>
               <div className="tx-net">
                 {data.net < 0 ? '-' : '+'}₹{Math.abs(data.net).toLocaleString()}
               </div>
             </div>
          )}
        </div>
      );
    }
    
    // Fill remaining cells for a complete grid
    const remaining = 42 - cells.length; // 6 rows * 7 days
    if(remaining > 0 && remaining < 7) {
      for (let i = 0; i < remaining; i++) {
        cells.push(<div key={`empty-end-${i}`} className="calendar-cell empty"></div>);
      }
    }

    return cells;
  };

  return (
    <div className="glass-panel calendar-widget animate-fade-in" style={{ animationDelay: '0.4s' }}>
      <div className="calendar-header">
        <div className="calendar-nav">
          <button className="nav-btn" onClick={handlePrevMonth}><ChevronLeft size={18} /></button>
          <h3 className="month-title">{monthNames[month]} {year}</h3>
          <button className="nav-btn" onClick={handleNextMonth}><ChevronRight size={18} /></button>
          <button className="btn btn-outline today-btn" onClick={handleToday}>
            <CalendarIcon size={14} /> Today
          </button>
        </div>
      </div>

      <div className="calendar-grid-header">
        {dayNames.map(day => (
          <div key={day} className="day-name">{day}</div>
        ))}
      </div>

      <div className="calendar-grid">
        {renderCells()}
      </div>
    </div>
  );
}
