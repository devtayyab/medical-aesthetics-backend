import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Plus,
    BarChart,
    XCircle,
    Clock
} from 'lucide-react';
import { Button } from '@/components/atoms/Button/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/molecules/Card/Card';
import { Badge } from '@/components/atoms/Badge';
import { RootState } from '@/store';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, startOfWeek, endOfWeek } from 'date-fns';

interface CalendarNote {
    id: string;
    date: string;
    content: string;
    type: 'note' | 'goal' | 'reminder';
    color: string;
}

import { fetchSalespersonAnalytics } from '@/store/slices/crmSlice';
import { AppDispatch } from '@/store'; // Ensure AppDispatch is used if needed, or just useDispatch

export const SalesCalendar: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>(); // Typed dispatch
    const { user } = useSelector((state: RootState) => state.auth);
    const { tasks, analytics } = useSelector((state: RootState) => state.crm);

    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
    const [notes, setNotes] = useState<CalendarNote[]>(() => {
        const saved = localStorage.getItem('sales_calendar_notes');
        return saved ? JSON.parse(saved) : [];
    });
    const [timeRange, setTimeRange] = useState('this_month');

    // New state for note input
    const [noteContent, setNoteContent] = useState('');
    const [noteColor, setNoteColor] = useState('bg-blue-100 border-blue-200 text-blue-800');
    const [isAddingNote, setIsAddingNote] = useState(false);

    useEffect(() => {
        localStorage.setItem('sales_calendar_notes', JSON.stringify(notes));
    }, [notes]);

    // Fetch real analytics based on time filter
    useEffect(() => {
        if (user?.id) {
            let startDate = new Date();
            let endDate = new Date();

            if (timeRange === 'this_week') {
                startDate = startOfWeek(new Date());
                endDate = endOfWeek(new Date());
            } else if (timeRange === 'this_month') {
                startDate = startOfMonth(new Date());
                endDate = endOfMonth(new Date());
            } else if (timeRange === 'last_3_months') {
                startDate = startOfMonth(subMonths(new Date(), 3));
                endDate = endOfMonth(new Date());
            }

            dispatch(fetchSalespersonAnalytics({
                salespersonId: user.id,
                dateRange: {
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString()
                }
            }));
        }
    }, [dispatch, user?.id, timeRange]);

    // Derived Performance Data from Redux
    const progress = {
        sales: analytics?.customers?.totalRevenue || 0,
        calls: analytics?.communications?.calls || 0,
        appointments: analytics?.completedActions || 0
    };

    const daysInMonth = eachDayOfInterval({
        start: startOfWeek(startOfMonth(currentMonth)),
        end: endOfWeek(endOfMonth(currentMonth))
    });

    // Color palettes for notes
    const colors = [
        { name: 'Blue', value: 'bg-blue-100 border-blue-200 text-blue-800' },
        { name: 'Green', value: 'bg-green-100 border-green-200 text-green-800' },
        { name: 'Purple', value: 'bg-purple-100 border-purple-200 text-purple-800' },
        { name: 'Amber', value: 'bg-amber-100 border-amber-200 text-amber-800' },
        { name: 'Red', value: 'bg-red-100 border-red-200 text-red-800' },
    ];

    const handleSaveNote = () => {
        if (!selectedDate || !noteContent.trim()) return;

        const newNote: CalendarNote = {
            id: Math.random().toString(),
            date: selectedDate.toISOString(),
            content: noteContent,
            type: 'note',
            color: noteColor
        };

        setNotes([...notes, newNote]);
        setNoteContent('');
        setIsAddingNote(false);
    };

    const renderHeader = () => {
        return (
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                        {format(currentMonth, 'MMMM yyyy')}
                    </h2>
                    <div className="flex bg-gray-100/80 rounded-lg p-1 border border-gray-200/50">
                        <button onClick={() => setViewMode('month')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all shadow-sm ${viewMode === 'month' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50 shadow-none'}`}>Month</button>
                        <button onClick={() => setViewMode('week')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all shadow-sm ${viewMode === 'week' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50 shadow-none'}`}>Week</button>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="h-9 w-9 border-gray-200 hover:bg-gray-50 hover:text-gray-900">
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" onClick={() => setCurrentMonth(new Date())} className="h-9 border-gray-200 hover:bg-gray-50 hover:text-gray-900 font-medium">Today</Button>
                    <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="h-9 w-9 border-gray-200 hover:bg-gray-50 hover:text-gray-900">
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto p-2">
            {/* Progress / Stats Area */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="md:col-span-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-none shadow-xl shadow-blue-900/10 relative overflow-hidden">
                    {/* Subtle aesthetic overlay */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none"></div>

                    <CardContent className="p-8 relative z-10">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-xl font-bold tracking-tight">Personal Dashboard</h3>
                                <p className="text-blue-100 mt-1.5 text-sm font-medium opacity-90">Track your daily wins and upcoming targets.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <select
                                    value={timeRange}
                                    onChange={(e) => setTimeRange(e.target.value)}
                                    className="bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors cursor-pointer appearance-none pr-8 font-medium"
                                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}
                                >
                                    <option value="this_week" className="text-gray-900">This Week</option>
                                    <option value="this_month" className="text-gray-900">This Month</option>
                                    <option value="last_3_months" className="text-gray-900">Last 3 Months</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-12">
                            <div className="text-center md:text-left group cursor-default">
                                <div className="text-4xl font-extrabold tracking-tight group-hover:scale-105 transition-transform duration-300">{progress.sales.toLocaleString('de-DE')} €</div>
                                <div className="text-xs font-bold uppercase tracking-widest text-blue-200 mt-2">Total Sales</div>
                            </div>
                            <div className="text-center md:text-left group cursor-default">
                                <div className="text-4xl font-extrabold tracking-tight group-hover:scale-105 transition-transform duration-300">{progress.appointments}</div>
                                <div className="text-xs font-bold uppercase tracking-widest text-blue-200 mt-2">Appointments</div>
                            </div>
                            <div className="text-center md:text-left group cursor-default">
                                <div className="text-4xl font-extrabold tracking-tight group-hover:scale-105 transition-transform duration-300">{progress.calls}</div>
                                <div className="text-xs font-bold uppercase tracking-widest text-blue-200 mt-2">Calls Logged</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="flex flex-col justify-center items-center p-8 border-none shadow-lg shadow-gray-100 bg-white ring-1 ring-gray-100 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-emerald-500"></div>
                    <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 ease-out">
                        <BarChart className="w-10 h-10 text-green-600" strokeWidth={1.5} />
                    </div>
                    <div className="text-center">
                        <div className="font-extrabold text-gray-900 text-3xl tracking-tight">
                            {analytics?.salespersonConversionRate || 0}%
                        </div>
                        <div className="text-sm font-medium text-gray-500 mt-1">Conversion Rate</div>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Calendar Area */}
                <div className="lg:col-span-2">
                    <Card className="shadow-xl shadow-gray-100/50 border-none ring-1 ring-gray-100 bg-white">
                        <CardContent className="p-6">
                            {renderHeader()}

                            <div className="grid grid-cols-7 mb-4">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                    <div key={day} className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest py-2">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-7 border-l border-t border-gray-100 rounded-2xl overflow-hidden">
                                {daysInMonth.map((day) => {
                                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                                    const isCurrentMonth = isSameMonth(day, currentMonth);
                                    const dayNotes = notes.filter(n => isSameDay(new Date(n.date), day));
                                    const dayTasks = tasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), day));

                                    return (
                                        <div
                                            key={day.toISOString()}
                                            onClick={() => setSelectedDate(day)}
                                            className={`min-h-[130px] p-3 relative transition-all duration-200 cursor-pointer border-r border-b border-gray-100
                                                ${!isCurrentMonth ? 'bg-gray-50/50 text-gray-300' : 'bg-white hover:bg-gray-50/80'}
                                                ${isSelected ? 'ring-2 ring-inset ring-blue-500 z-10 bg-blue-50/20' : ''}
                                            `}
                                        >
                                            <div className="flex justify-between items-start">
                                                <span className={`text-sm font-semibold w-8 h-8 flex items-center justify-center rounded-lg transition-all
                                                    ${isToday(day) ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : isCurrentMonth ? 'text-gray-700' : ''}
                                                    ${isSelected && !isToday(day) ? 'bg-blue-100 text-blue-700' : ''}
                                                `}>
                                                    {format(day, 'd')}
                                                </span>
                                            </div>

                                            {/* Content Preview */}
                                            <div className="mt-3 space-y-1.5">
                                                {dayNotes.map(note => (
                                                    <div key={note.id} className={`h-1.5 rounded-full w-full ${note.color.split(' ')[0]}`} />
                                                ))}
                                                {dayTasks.map(task => (
                                                    <div key={task.id} className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-gray-100/80 max-w-full">
                                                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${task.status === 'completed' ? 'bg-green-500' : 'bg-blue-400'}`} />
                                                        <span className="text-[10px] text-gray-600 truncate font-medium">{task.title}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar: Day Details & Notes */}
                <div className="space-y-6">
                    <Card className="shadow-xl shadow-gray-100/50 border-none ring-1 ring-gray-100 h-full flex flex-col bg-white overflow-hidden">
                        <CardHeader className="bg-white px-6 py-5 border-b border-gray-100">
                            <CardTitle className="text-lg font-bold text-gray-900 flex justify-between items-center tracking-tight">
                                <span>
                                    {selectedDate ? format(selectedDate, 'EEEE, MMM do') : 'Select a date'}
                                </span>
                                {selectedDate && !isAddingNote && (
                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-gray-100 text-gray-500 transition-colors" onClick={() => setIsAddingNote(true)}>
                                        <Plus className="w-5 h-5" />
                                    </Button>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 flex-1 flex flex-col gap-5 overflow-y-auto max-h-[600px] custom-scrollbar bg-gray-50/30">
                            {!selectedDate ? (
                                <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-sm italic">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                        <CalendarIcon className="w-8 h-8 opacity-40" />
                                    </div>
                                    <p>Click a date to view details</p>
                                </div>
                            ) : (
                                <>
                                    {/* Reformed Add Note Box */}
                                    {(isAddingNote || notes.filter(n => isSameDay(new Date(n.date), selectedDate)).length === 0) && (
                                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100/80 relative overflow-hidden group">
                                            {/* Decorative top bar */}
                                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-400 opacity-50"></div>

                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block flex justify-between">
                                                {isAddingNote ? 'New Entry' : 'Quick Note'}
                                                {!isAddingNote && <span className="text-[10px] font-normal text-gray-400 lowercase italic">visible to you</span>}
                                            </label>

                                            <textarea
                                                className="w-full text-sm p-3.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all placeholder:text-gray-400/80 min-h-[110px] resize-none text-gray-700 leading-relaxed"
                                                placeholder="Type your note here..."
                                                value={noteContent}
                                                onChange={(e) => setNoteContent(e.target.value)}
                                            />

                                            <div className="flex items-center justify-between mt-4 pl-1">
                                                <div className="flex -space-x-1.5 hover:space-x-1 transition-all duration-300 p-1">
                                                    {colors.map(c => (
                                                        <button
                                                            key={c.name}
                                                            onClick={() => setNoteColor(c.value)}
                                                            className={`w-7 h-7 rounded-full border-2 border-white shadow-sm transition-transform ${c.value.split(' ')[0]} ${noteColor === c.value ? 'scale-110 z-10 ring-2 ring-gray-200' : 'hover:scale-110 hover:z-10'}`}
                                                            title={c.name}
                                                        />
                                                    ))}
                                                </div>
                                                <div className="flex gap-2">
                                                    {isAddingNote && (
                                                        <Button size="sm" variant="ghost" onClick={() => setIsAddingNote(false)} className="text-gray-500 hover:text-gray-700 h-8 rounded-lg">Cancel</Button>
                                                    )}
                                                    <Button size="sm" onClick={handleSaveNote} disabled={!noteContent.trim()} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200 h-8 px-4 rounded-lg font-medium transition-all active:scale-95">
                                                        Save
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Lists Area */}
                                    <div className="space-y-6">
                                        {notes.filter(n => isSameDay(new Date(n.date), selectedDate)).length > 0 && (
                                            <div>
                                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                    Notes
                                                </h4>
                                                <div className="space-y-3">
                                                    {notes.filter(n => isSameDay(new Date(n.date), selectedDate)).map(note => (
                                                        <div key={note.id} className={`p-4 rounded-2xl text-sm border-0 shadow-sm relative group hover:shadow-md transition-all ${note.color} bg-opacity-30`}>
                                                            <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-lg ${note.color.split(' ')[2].replace('text-', 'bg-')}`}></div>
                                                            <p className="pl-3 pr-4 leading-relaxed text-gray-800">{note.content}</p>
                                                            <button
                                                                onClick={() => setNotes(notes.filter(n => n.id !== note.id))}
                                                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-black/5 rounded-full text-current transition-opacity"
                                                            >
                                                                <XCircle className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            {tasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), selectedDate)).length > 0 && (
                                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                    Tasks
                                                </h4>
                                            )}

                                            <div className="space-y-2.5">
                                                {tasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), selectedDate)).map(task => (
                                                    <div key={task.id} className="flex items-center gap-3 p-3.5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-gray-200 hover:shadow-md transition-all group">
                                                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${task.status === 'completed' ? 'bg-green-500 ring-2 ring-green-100' : 'bg-blue-500 ring-2 ring-blue-100'}`} />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-sm font-semibold text-gray-900 truncate">{task.title}</div>
                                                            {task.description && <div className="text-xs text-gray-500 truncate mt-0.5">{task.description}</div>}
                                                        </div>
                                                        {task.dueDate && (
                                                            <div className="text-[10px] font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
                                                                {format(new Date(task.dueDate), 'HH:mm')}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div >
    );
};
