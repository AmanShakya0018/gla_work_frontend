import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Calendar, Clock, MapPin, User, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Route, Routes, Link } from 'react-router-dom';

import ScheduleMeeting from '../ScheduleMeeting.jsx';
import AllMeetingWithParticipants from '../allmeeting_with_participants.jsx';
import ShowMeetings from '../show_meetings.jsx';
import { fetchAllMeetings } from './meetingSlice.js';

const Homepage = () => {
    const [showSchedule, setShowSchedule] = useState(false);
    const [showAllMeetings, setShowAllMeetings] = useState(false);
    const [showTodayMeetings, setShowTodayMeetings] = useState(false);
    const dispatch = useDispatch();

    const meetings = useSelector(state => state.meeting.meetings);
    const [openAvailable, setOpenAvailable] = useState({});
    const [openNotAvailable, setOpenNotAvailable] = useState({});
    const today = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
    // Filter meetings by today's date (ensure date format matches)
    const todayMeetings = Array.isArray(meetings)
        ? meetings.filter(meeting => {
            const meetingDate = meeting.meetingDetails?.date;
            if (!meetingDate) return false;
            // Accept both Date objects and string dates
            if (typeof meetingDate === "string") {
                // Only compare date part (YYYY-MM-DD)
                return meetingDate.slice(0, 10) === todayStr;
            }
            // If meetingDate is a Date object
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

    const handleShowAllMeetings = () => {
        dispatch(fetchAllMeetings());
        setShowAllMeetings(true);
    };

    return (
        <>
            <div className="flex justify-center gap-6 mt-8">
                <div className="bg-red shadow-md rounded-lg p-6 w-64 text-center">
                    <h3 className="text-2xl text-red-500 font-semibold mb-2">All Meetings</h3>
                    <p className="mb-4 text-gray-600">View all scheduled meetings.</p>
                    <button
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                        onClick={handleShowAllMeetings}
                    >
                        
                        Show All
                    </button>
                </div>
                <div className="bg-white shadow-md rounded-lg p-6 w-64 text-center">
                    <h3 className="text-xl font-semibold mb-2">Today's Meetings</h3>
                    <p className="mb-4 text-gray-600">Meetings scheduled for today.</p>
                    <Link to="/today-meetings">
                        <button
                            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
                        >
                            Show Today's
                        </button>
                    </Link>
                </div>
                <div className="bg-white shadow-md rounded-lg p-6 w-64 text-center">
                    <h3 className="text-xl font-semibold mb-2">Schedule a Meeting</h3>
                    <p className="mb-4 text-gray-600">Create a new meeting event.</p>
                    <button className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition" onClick={() => setShowSchedule(true)}>Schedule</button>
                </div>
            </div>
            {showSchedule && <ScheduleMeeting onClose={() => setShowSchedule(false)} />}
            {showAllMeetings && <AllMeetingWithParticipants />}
            {/* Today's Meetings Cards */}
            {/* Remove inline rendering, handled by route now */}
        </>
    );
};

export default Homepage;
