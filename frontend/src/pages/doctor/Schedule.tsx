import { useEffect, useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  HelpCircle,
} from 'lucide-react';
import api from '../../lib/api';

interface TimeOff {
  id: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  isRecurring: boolean;
}

interface DayStatus {
  date: string;
  isAvailable: boolean;
  hasTimeOff: boolean;
  timeOffReason?: string;
  timeOffId?: string;
}

export default function DoctorSchedule() {
  const [timeOffs, setTimeOffs] = useState<TimeOff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [timeOffReason, setTimeOffReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showHowToUse, setShowHowToUse] = useState(false);

  useEffect(() => {
    fetchTimeOffs();
  }, []);

  // Helper function to get local date string in YYYY-MM-DD format (IST timezone)
  const getLocalDateString = (date: Date): string => {
    // Adjust for IST timezone (UTC+5:30)
    const istOffset = 5.5 * 60; // minutes
    const utcOffset = date.getTimezoneOffset();
    const istTime = new Date(date.getTime() + (istOffset + utcOffset) * 60000);
    return istTime.toISOString().split('T')[0];
  };

  const fetchTimeOffs = async () => {
    try {
      const response = await api.get('/doctors/time-offs');
      setTimeOffs(response.data || []);
    } catch (error) {
      console.error('Error fetching time-offs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate calendar days for the current month
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Add days from previous month
    const prevMonth = new Date(year, month, 0);
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonth.getDate() - i),
        isCurrentMonth: false,
      });
    }

    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        date: new Date(year, month, day),
        isCurrentMonth: true,
      });
    }

    // Add days from next month to fill the grid
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        date: new Date(year, month + 1, day),
        isCurrentMonth: false,
      });
    }

    return days;
  };

  // Check if a date has time-off - using local date comparison
  const getDayStatus = (date: Date): DayStatus => {
    const dateStr = getLocalDateString(date);
    const timeOff = timeOffs.find((t) => {
      const startDateStr = getLocalDateString(new Date(t.startDate));
      const endDateStr = getLocalDateString(new Date(t.endDate));
      return dateStr >= startDateStr && dateStr <= endDateStr;
    });

    const todayStr = getLocalDateString(new Date());
    const isPast = dateStr < todayStr;

    return {
      date: dateStr,
      isAvailable: !timeOff && !isPast,
      hasTimeOff: !!timeOff,
      timeOffReason: timeOff?.reason || undefined,
      timeOffId: timeOff?.id,
    };
  };

  const handleDateClick = (date: Date) => {
    const todayStr = getLocalDateString(new Date());
    const dateStr = getLocalDateString(date);
    
    if (dateStr < todayStr) {
      return; // Can't modify past dates
    }

    const dayStatus = getDayStatus(date);

    if (dayStatus.hasTimeOff && dayStatus.timeOffId) {
      // Remove time-off
      handleRemoveTimeOff(dayStatus.timeOffId);
    } else {
      // Show modal to add time-off
      setSelectedDate(dateStr);
      setTimeOffReason('');
      setShowModal(true);
    }
  };

  const handleAddTimeOff = async () => {
    if (!selectedDate) return;

    setSubmitting(true);
    try {
      await api.post('/doctors/time-offs', {
        startDate: selectedDate,
        endDate: selectedDate,
        reason: timeOffReason || 'Unavailable',
        isRecurring: false,
      });
      setShowModal(false);
      setSelectedDate(null);
      setTimeOffReason('');
      fetchTimeOffs();
    } catch (error) {
      console.error('Error adding time-off:', error);
      alert('Failed to mark date as unavailable');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveTimeOff = async (timeOffId: string) => {
    if (!window.confirm('Are you sure you want to mark this date as available again? Patients will be able to book appointments on this date.')) {
      return;
    }

    try {
      await api.delete(`/doctors/time-offs/${timeOffId}`);
      // Refresh the time-offs list
      await fetchTimeOffs();
      alert('Date has been marked as available. Patients can now book appointments.');
    } catch (error) {
      console.error('Error removing time-off:', error);
      alert('Failed to remove time-off. Please try again.');
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const calendarDays = generateCalendarDays();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Legend</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-green-100 border-2 border-green-500"></div>
            <span className="text-sm text-gray-600">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-red-100 border-2 border-red-500"></div>
            <span className="text-sm text-gray-600">Unavailable (Blocked)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gray-100 border-2 border-gray-300"></div>
            <span className="text-sm text-gray-600">Past Date</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded border-2 border-blue-500"></div>
            <span className="text-sm text-gray-600">Today</span>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Calendar Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Week Days Header */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {weekDays.map((day) => (
            <div
              key={day}
              className="px-2 py-3 text-center text-sm font-medium text-gray-600"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            const dayStatus = getDayStatus(day.date);
            const todayStr = getLocalDateString(new Date());
            const dateStr = getLocalDateString(day.date);
            const isPast = dateStr < todayStr;
            const isCurrentDay = dateStr === todayStr;

            return (
              <button
                key={index}
                onClick={() => handleDateClick(day.date)}
                disabled={isPast || !day.isCurrentMonth}
                className={`
                  min-h-[80px] p-2 border-b border-r border-gray-200 text-left transition-all
                  ${!day.isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''}
                  ${isPast ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-gray-50'}
                  ${isCurrentDay ? 'ring-2 ring-blue-500 ring-inset' : ''}
                `}
              >
                <div className="flex flex-col h-full">
                  <span
                    className={`text-sm font-medium ${
                      isCurrentDay
                        ? 'text-blue-600'
                        : day.isCurrentMonth
                        ? 'text-gray-900'
                        : 'text-gray-400'
                    }`}
                  >
                    {day.date.getDate()}
                  </span>
                  {day.isCurrentMonth && !isPast && (
                    <div className="mt-1 flex-1">
                      {dayStatus.hasTimeOff ? (
                        <div className="flex items-center gap-1">
                          <XCircle className="w-4 h-4 text-red-500" />
                          <span className="text-xs text-red-600 truncate">
                            {dayStatus.timeOffReason || 'Blocked'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-xs text-green-600">Available</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* How to Use - Collapsible */}
      <div className="bg-white rounded-lg border border-secondary-200 overflow-hidden">
        <button
          onClick={() => setShowHowToUse(!showHowToUse)}
          className="w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r from-blue-50 to-primary-50 hover:from-blue-100 hover:to-primary-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-blue-600" />
            </div>
            <span className="font-semibold text-secondary-900">How to Use Schedule</span>
          </div>
          {showHowToUse ? (
            <ChevronUp className="w-5 h-5 text-secondary-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-secondary-500" />
          )}
        </button>
        
        {showHowToUse && (
          <div className="p-4 border-t border-secondary-200">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <XCircle className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <h5 className="text-sm font-medium text-secondary-900">Block a Date</h5>
                  <p className="text-sm text-secondary-600">Click on any future date in the calendar to mark it as unavailable. Patients will not be able to book appointments on blocked dates.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h5 className="text-sm font-medium text-secondary-900">Remove a Blocked Date</h5>
                  <p className="text-sm text-secondary-600">Click on a blocked date (shown in red) or click "Remove" in the Upcoming Blocked Dates list to restore availability. Patients can then book appointments again.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                </div>
                <div>
                  <h5 className="text-sm font-medium text-secondary-900">Important Notes</h5>
                  <ul className="text-sm text-secondary-600 space-y-1">
                    <li>• Existing appointments on blocked dates will be notified about the unavailability.</li>
                    <li>• Past dates cannot be modified.</li>
                    <li>• You can add an optional reason when blocking a date.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Upcoming Time-offs List */}
      {timeOffs.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h3 className="font-semibold text-gray-900">Upcoming Blocked Dates</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {timeOffs.map((timeOff) => (
              <div
                key={timeOff.id}
                className="px-4 py-3 flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(timeOff.startDate).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                      {timeOff.startDate !== timeOff.endDate && (
                        <> - {new Date(timeOff.endDate).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </>
                      )}
                    </p>
                    {timeOff.reason && (
                      <p className="text-xs text-gray-500">{timeOff.reason}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveTimeOff(timeOff.id)}
                  className="px-3 py-1.5 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Time-off Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Mark Date as Unavailable</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Date: <strong>{selectedDate && new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}</strong>
              </p>
              <p className="text-xs text-gray-500">
                Patients will not be able to book appointments on this date.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason (Optional)
              </label>
              <input
                type="text"
                value={timeOffReason}
                onChange={(e) => setTimeOffReason(e.target.value)}
                placeholder="e.g., Conference, Personal leave, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTimeOff}
                disabled={submitting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {submitting ? 'Blocking...' : 'Block Date'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
