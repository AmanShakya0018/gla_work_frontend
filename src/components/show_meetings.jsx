import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { Calendar, Clock, MapPin, User, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { fetchAllMeetings, fetchAllParticipants } from './redux/meetingSlice';

const ShowMeetings = () => {
    const dispatch = useDispatch();
    const { meetings, loading, error } = useSelector(state => state.meeting);
    const allusersRaw = useSelector(state => state.meeting.participants) || [];
    const allusers = Array.isArray(allusersRaw.userDetails) ? allusersRaw.userDetails : Array.isArray(allusersRaw) ? allusersRaw : [];

    useEffect(() => {
        dispatch(fetchAllMeetings());
        dispatch(fetchAllParticipants());
    }, [dispatch]);

    const [openAvailable, setOpenAvailable] = useState({});
    const [openNotAvailable, setOpenNotAvailable] = useState({});
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editMeetingData, setEditMeetingData] = useState(null);
    const [editMessage, setEditMessage] = useState("");
    const [actionModalOpen, setActionModalOpen] = useState(false);
    const [actionMeetingData, setActionMeetingData] = useState(null);
    const [attendees, setAttendees] = useState([]);
    const [actionItems, setActionItems] = useState([
        { item: "", responsible: "", deadline: "", status: "Open", description: "" }
    ]);

    const today = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
    const todayMeetings = Array.isArray(meetings)
        ? meetings.filter(meeting => {
            const meetingDate = meeting.meetingDetails?.date;
            if (!meetingDate) return false;
            if (typeof meetingDate === "string") {
                return meetingDate.slice(0, 10) === todayStr;
            }
            return new Date(meetingDate).toISOString().split('T')[0] === todayStr;
        })
        : [];

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const onEditMeeting = (meetingId) => {
        const meeting = meetings.find(m => m.meetingId === meetingId);
        if (meeting) {
            let meetingStart = "";
            let meetingFinish = "";
            if (meeting.meetingDetails.time && meeting.meetingDetails.time.includes('-')) {
                const [start, finish] = meeting.meetingDetails.time.split('-').map(t => t.trim());
                meetingStart = start;
                meetingFinish = finish;
            }
            setEditMeetingData({
                id: meeting.id,
                meetingId: meeting.meetingId,
                title: meeting.meetingDetails.title,
                description: meeting.meetingDetails.description,
                organizer: meeting.meetingDetails.organizer,
                date: meeting.meetingDetails.date,
                location: meeting.meetingDetails.location,
                meetingStart,
                meetingFinish,
            });
            setEditModalOpen(true);
        }
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditMeetingData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleEditSave = async () => {
        try {
            const payload = {
                meetingTitle: editMeetingData.title,
                meetingDescription: editMeetingData.description,
                meetingOrganizer: editMeetingData.organizer,
                meetingDate: editMeetingData.date,
                meetingTime: {
                    meetingStart: editMeetingData.meetingStart,
                    meetingFinish: editMeetingData.meetingFinish,
                },
                meetingLocation: editMeetingData.location,
                meeting_id: editMeetingData.meetingId,
                createdAt: editMeetingData.createdAt || undefined,
                updatedAt: new Date().toISOString()
            };

            const response = await axios.post(
                `http://localhost:4000/api/edit-meeting/${editMeetingData.id}`,
                payload
            );
            if (response.data && response.data.message) {
                setEditMessage(response.data.message);
                setTimeout(() => setEditMessage(""), 3000);
            }
            setEditModalOpen(false);
            setEditMeetingData(null);
            dispatch(fetchAllMeetings());
        } catch (err) {
            setEditMessage("Failed to update meeting.");
            setTimeout(() => setEditMessage(""), 3000);
            setEditModalOpen(false);
            setEditMeetingData(null);
        }
    };

    const onActionMeeting = (meetingId) => {
        const meeting = meetings.find(m => m.meetingId === meetingId);
        if (meeting) {
            setActionMeetingData(meeting);
            setAttendees(meeting.meetingData.available_participants.map(p => p.email));
            setActionItems([
                { item: "", responsible: "", deadline: "", status: "Open", description: "" }
            ]);
            setActionModalOpen(true);
        }
    };

    // ...existing code for attendees CRUD, action items CRUD, etc...

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2 text-center">Today's Meetings</h1>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", justifyContent: "center" }}>
                    <Calendar size={22} style={{ color: "#2563eb" }} />
                    <span style={{ fontWeight: "bold", color: "#2563eb" }}>{todayStr}</span>
                </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {todayMeetings.length > 0 ? todayMeetings.map(meeting => {
                    const meetingId = meeting.meetingId;
                    return (
                        <div
                            key={meetingId}
                            className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow duration-200"
                        >
                            <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-5">
                                <h2 className="text-lg font-semibold text-white mb-1 line-clamp-2">
                                    {meeting.meetingDetails.title}
                                </h2>
                                <p className="text-slate-300 text-sm line-clamp-2">
                                    {meeting.meetingDetails.description}
                                </p>
                            </div>
                            <div className="flex justify-end px-5 pt-4 pb-2 gap-2">
                                <button
                                    onClick={() => onActionMeeting(meetingId)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium shadow transition"
                                >
                                    Action Items    
                                </button>
                                <button
                                    onClick={() => onEditMeeting(meetingId)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium shadow transition"
                                >
                                    Edit Meeting
                                </button>
                            </div>
                            <div className="p-5 pt-0">
                                <div className="space-y-3 mb-4">
                                    <div className="flex items-center text-sm text-slate-700">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 mr-3">
                                            <User size={16} className="text-blue-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-slate-500 font-medium">Organizer</p>
                                            <p className="font-medium truncate">{meeting.meetingDetails.organizer}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center text-sm text-slate-700">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-50 mr-3">
                                            <Calendar size={16} className="text-violet-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-slate-500 font-medium">Date</p>
                                            <p className="font-medium">{formatDate(meeting.meetingDetails.date)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center text-sm text-slate-700">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-50 mr-3">
                                            <Clock size={16} className="text-amber-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-slate-500 font-medium">Time</p>
                                            <p className="font-medium">{meeting.meetingDetails.time}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center text-sm text-slate-700">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-rose-50 mr-3">
                                            <MapPin size={16} className="text-rose-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-slate-500 font-medium">Location</p>
                                            <p className="font-medium truncate">{meeting.meetingDetails.location}</p>
                                        </div>
                                    </div>
                                </div>
                                {/* Available Participants */}
                                <div className="mb-3">
                                    <button
                                        onClick={() =>
                                            setOpenAvailable(prev => ({
                                                ...prev,
                                                [meetingId]: !prev[meetingId]
                                            }))
                                        }
                                        className="w-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 px-3 py-2.5 rounded-lg font-medium text-sm flex items-center justify-between transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Check size={16} />
                                            <span>Available ({meeting.meetingData.available_participants.length})</span>
                                        </div>
                                        {openAvailable[meetingId] ?
                                            <ChevronUp size={16} /> : <ChevronDown size={16} />
                                        }
                                    </button>
                                    {openAvailable[meetingId] && (
                                        <div className="mt-2 pl-3 pr-2">
                                            {meeting.meetingData.available_participants.length === 0 ? (
                                                <p className="text-sm text-slate-400 italic py-2">No available participants</p>
                                            ) : (
                                                <ul className="space-y-2">
                                                    {meeting.meetingData.available_participants.map((p, idx) => (
                                                        <li key={p.email + idx} className="flex items-start gap-2 py-2 border-b border-slate-100 last:border-0">
                                                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                                <span className="text-emerald-700 font-semibold text-xs">
                                                                    {p.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                                                </span>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-medium text-sm text-slate-900">{p.name}</p>
                                                                <p className="text-xs text-slate-500 truncate">{p.email}</p>
                                                                <div className="flex gap-2 mt-1">
                                                                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                                                                        {p.facultyid}
                                                                    </span>
                                                                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded truncate">
                                                                        {p.department}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {/* Not Available Participants */}
                                <div>
                                    <button
                                        onClick={() =>
                                            setOpenNotAvailable(prev => ({
                                                ...prev,
                                                [meetingId]: !prev[meetingId]
                                            }))
                                        }
                                        className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-3 py-2.5 rounded-lg font-medium text-sm flex items-center justify-between transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <X size={16} />
                                            <span>Unavailable ({meeting.meetingData.not_available_participants.length})</span>
                                        </div>
                                        {openNotAvailable[meetingId] ?
                                            <ChevronUp size={16} /> : <ChevronDown size={16} />
                                        }
                                    </button>
                                    {openNotAvailable[meetingId] && (
                                        <div className="mt-2 pl-3 pr-2">
                                            {meeting.meetingData.not_available_participants.length === 0 ? (
                                                <p className="text-sm text-slate-400 italic py-2">No unavailable participants</p>
                                            ) : (
                                                <ul className="space-y-2">
                                                    {meeting.meetingData.not_available_participants.map((p, idx) => (
                                                        <li key={p.email + idx} className="flex items-start gap-2 py-2 border-b border-slate-100 last:border-0">
                                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                                <span className="text-slate-700 font-semibold text-xs">
                                                                    {p.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                                                </span>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-medium text-sm text-slate-900">{p.name}</p>
                                                                <p className="text-xs text-slate-500 truncate">{p.email}</p>
                                                                <div className="flex gap-2 mt-1">
                                                                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                                                                        {p.facultyid}
                                                                    </span>
                                                                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded truncate">
                                                                        {p.department}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Calendar className="text-slate-400" size={32} />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900 mb-2">No meetings scheduled</h3>
                        <p className="text-slate-600 mb-4">Get started by creating your first meeting</p>
                    </div>
                )}
            </div>
            {/* ...existing code for modals if needed... */}
        </div>
    );
};

export default ShowMeetings;
