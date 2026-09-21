'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { localStore } from '@/lib/store/localStore';
import { User, AttendanceRecord } from '@/types';
import { Clock, CheckCircle, PlusCircle, Calendar, UserCheck, AlertCircle } from 'lucide-react';

export default function MerchantAttendancePage() {
  const { company, user } = useAuth();
  const companyId = company?.id || user?.companyId || '';

  const [employees, setEmployees] = useState<User[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showMarkModal, setShowMarkModal] = useState(false);

  // Form states
  const [employeeId, setEmployeeId] = useState('');
  const [status, setStatus] = useState<AttendanceRecord['status']>('PRESENT');
  const [notes, setNotes] = useState('');

  const loadData = () => {
    if (!companyId) return;
    setEmployees(localStore.getCompanyUsers(companyId).filter((u) => u.role === 'EMPLOYEE'));
    setAttendance(localStore.getAttendance(companyId, selectedDate));
  };

  useEffect(() => {
    loadData();
    const unsub = localStore.subscribe(() => loadData());
    return () => unsub();
  }, [companyId, selectedDate]);

  const handleMarkAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) return;

    const emp = employees.find((e) => e.id === employeeId);
    if (!emp) return;

    const recordId = `att_${selectedDate}_${employeeId}`;
    const newRecord: AttendanceRecord = {
      id: recordId,
      companyId,
      employeeId,
      employeeName: emp.name,
      date: selectedDate,
      checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status,
      notes,
      createdAt: new Date().toISOString(),
    };

    localStore.saveAttendance(newRecord);
    setShowMarkModal(false);
    setNotes('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Daily Staff Attendance</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track daily presence, check-in timings, and leaves for counter workers
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold shadow-sm"
          />

          <button
            onClick={() => {
              if (employees.length === 0) {
                alert('Please add employees in the Staff Management tab first.');
                return;
              }
              setEmployeeId(employees[0].id);
              setShowMarkModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Mark Daily Attendance</span>
          </button>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {attendance.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <div className="font-bold text-slate-700">No Attendance Logged for {selectedDate}</div>
            <p className="text-slate-400 mt-1">Mark staff presence to record daily muster roll.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Employee Name</th>
                  <th className="px-4 py-3.5">Check-In Time</th>
                  <th className="px-4 py-3.5">Attendance Status</th>
                  <th className="px-4 py-3.5">Notes</th>
                  <th className="px-4 py-3.5 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {attendance.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3.5 font-bold text-slate-900">{rec.employeeName}</td>
                    <td className="px-4 py-3.5 text-slate-700 font-mono">{rec.checkInTime || '-'}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          rec.status === 'PRESENT'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : rec.status === 'LATE'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">{rec.notes || '-'}</td>
                    <td className="px-4 py-3.5 text-right text-slate-400">{rec.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mark Modal */}
      {showMarkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[92vh] flex flex-col p-4 sm:p-6 border border-slate-200 text-xs">
            <div className="flex-shrink-0 flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="font-bold text-slate-900 text-sm">Mark Staff Attendance</h3>
              <button onClick={() => setShowMarkModal(false)} className="text-slate-400 font-bold p-1 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleMarkAttendance} className="flex-1 flex flex-col min-h-0 text-xs">
              <div className="flex-1 overflow-y-auto pr-1 space-y-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Select Employee</label>
                  <select
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.subRole})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e: any) => setStatus(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                  >
                    <option value="PRESENT">Present</option>
                    <option value="LATE">Late Arrival</option>
                    <option value="HALF_DAY">Half Day</option>
                    <option value="ABSENT">Absent</option>
                    <option value="LEAVE">Approved Leave</option>
                    <option value="WEEKLY_OFF">Weekly Off</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Notes (Optional)</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Counter morning shift"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex-shrink-0 flex justify-end gap-2 pt-3 border-t border-slate-100 mt-2 bg-white">
                <button
                  type="button"
                  onClick={() => setShowMarkModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-xl text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
                >
                  Record Attendance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
