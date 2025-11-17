import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { fetchAllMeetings, fetchAllParticipants } from './redux/meetingSlice';
import { Calendar, Clock, MapPin, User, Users, ChevronDown, ChevronUp, Check, X } from 'lucide-react';


function AllMeetingWithParticipants() {
  const meetings = useSelector(state => state.meeting.meetings);
  // Sort meetings by createdAt descending (latest first)
  const sortedMeetings = Array.isArray(meetings)
    ? [...meetings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    : [];

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Store dropdown state for each meeting by meetingId
  const [openAvailable, setOpenAvailable] = useState({});
  const [openNotAvailable, setOpenNotAvailable] = useState({});


  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editMeetingData, setEditMeetingData] = useState(null);
  const [editMessage, setEditMessage] = useState("");
  const dispatch = useDispatch();


  useEffect(() => {
    dispatch(fetchAllParticipants());
  }, [dispatch]);

  // Ensure allusers is always an array of user objects
  const allusersRaw = useSelector(state => state.meeting.participants) || [];

  const allusers = Array.isArray(allusersRaw.userDetails) ? allusersRaw.userDetails : Array.isArray(allusersRaw) ? allusersRaw : [];

  console.log('All Users:', allusers);


  const onEditMeeting = (meetingId) => {
    const meeting = meetings.find(m => m.meetingId === meetingId);
    if (meeting) {
      // Extract start/finish time if available
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

  // Handle form changes
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditMeetingData(prev => ({
      ...prev,
      [name]: value
    }));
  };


  // Save handler using direct API call
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
      console.log('Edit response:', response.data);
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

  // Action Table state
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionMeetingData, setActionMeetingData] = useState(null);
  const participants = useSelector(state => state.meeting.participants);
  const [attendees, setAttendees] = useState([]);
  const [actionItems, setActionItems] = useState([
    { item: "", responsible: "", deadline: "", status: "Open", description: "" }
  ]);


  console.log('All Users:', allusers);  
  // Open Action Table modal
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

  // Attendees CRUD
  const handleAttendeeChange = (e) => {
    const value = Array.from(e.target.selectedOptions, opt => opt.value);
    setAttendees(value);
  };
  // Add update attendees handler
  const [attendeesChanged, setAttendeesChanged] = useState(false);

  // Remove attendee and immediately update backend
  const removeAttendee = async (email) => {
    setAttendees(prev => {
      const updated = prev.filter(a => a !== email);
      setAttendeesChanged(true);
      console.log('Removing attendee:', updated);
   
      if (actionMeetingData) {
        const payload = {
          meetingId: actionMeetingData.meetingId,
          attendees: updated,
          notAttendees: [email]
        };
        axios.post("http://localhost:4000/api/update-meeting-attendees", payload)
          .then(response => {
            setEditMessage(response.data?.message || "Attendee removed.");
            dispatch(fetchAllMeetings());
            setTimeout(() => setEditMessage(""), 3000);
          })
          .catch(() => {
            setEditMessage("Failed to update attendees.");
            setTimeout(() => setEditMessage(""), 3000);
          });
      }
      return updated;
    });
  };
  const addAttendee = (email) => {
    setAttendees(prev => {
      if (!prev.includes(email)) setAttendeesChanged(true);
      return prev.includes(email) ? prev : [...prev, email];
    });
  };

  // Action Items CRUD
  const handleActionItemChange = (idx, field, value) => {
    setActionItems(items =>
      items.map((item, i) => i === idx ? { ...item, [field]: value } : item)
    );
  };
  const addActionItem = () => {
    setActionItems(items => [...items, { item: "", responsible: "", deadline: "", status: "Open", description: "" }]);
  };
  const removeActionItem = (idx) => {
    setActionItems(items => items.filter((_, i) => i !== idx));
  };

  // Update attendees API call logic
  const handleUpdateAttendees = async () => {
    if (!actionMeetingData) return;
    try {
      const payload = {
        meetingId: actionMeetingData.meetingId,
        attendees
      };
      
      const response = await axios.post(
        "http://localhost:4000/api/update-meeting-attendees",
        payload
      );
      console.log('Update Attendees response:', response.data);
      setAttendeesChanged(false);
      dispatch(fetchAllMeetings());
      setEditMessage(response.data?.message || "Attendees updated successfully.");
      setTimeout(() => setEditMessage(""), 3000);
    } catch (err) {
      setEditMessage("Failed to update attendees.");
      setTimeout(() => setEditMessage(""), 3000);
      setAttendeesChanged(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Show backend message */}
        {editMessage && (
          <div className="mb-4 px-4 py-2 rounded bg-emerald-100 text-emerald-800 font-semibold text-center shadow">
            {editMessage}
          </div>
        )}
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">All Meetings </h1>
          
        </div>

        {/* Stats Summary */}
      

        {/* Meetings Grid */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {sortedMeetings.map(meeting => {
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
                    Action Table
                  </button>
                  <button
                    onClick={() => onEditMeeting(meetingId)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium shadow transition"
                  >
                    Edit Meeting
                  </button>
                </div>

                {/* Meeting Details */}
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

                  {/* Participant Summary */}
          
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
          })}
        </div>

      
       
        {editModalOpen && editMeetingData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative">
              <button
                className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 text-xl"
                onClick={() => { setEditModalOpen(false); setEditMeetingData(null); }}
              >
                &times;
              </button>
              <h2 className="text-xl font-bold mb-4">Edit Meeting</h2>
              <form onSubmit={e => { e.preventDefault(); handleEditSave(); }}>
                {/* All editable fields */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={editMeetingData.title}
                    onChange={handleEditChange}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    value={editMeetingData.description}
                    onChange={handleEditChange}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Organizer</label>
                  <input
                    type="text"
                    name="organizer"
                    value={editMeetingData.organizer}
                    onChange={handleEditChange}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    name="date"
                    value={editMeetingData.date}
                    onChange={handleEditChange}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                {/* Add start and finish time inputs */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    name="meetingStart"
                    value={editMeetingData.meetingStart || ""}
                    onChange={handleEditChange}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Finish Time</label>
                  <input
                    type="time"
                    name="meetingFinish"
                    value={editMeetingData.meetingFinish || ""}
                    onChange={handleEditChange}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={editMeetingData.location}
                    onChange={handleEditChange}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                <div className="flex justify-end mt-6">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Action Modal */}
        {actionModalOpen && actionMeetingData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
            <div className="bg-white rounded-none shadow-2xl w-full h-full p-0 m-0 overflow-y-auto">
              <div className="relative w-full h-full flex flex-col">
                <button
                  className="absolute top-4 right-8 text-slate-400 hover:text-slate-600 text-3xl z-10"
                  onClick={() => setActionModalOpen(false)}
                >
                  &times;
                </button>
                <div className="px-8 pt-12 pb-8 flex-1 overflow-y-auto">
                  <div className="mb-6">
                    <h2 className="text-3xl font-bold text-blue-900 mb-2">{actionMeetingData.meetingDetails.title}</h2>
                    <p className="text-slate-600 mb-2">{actionMeetingData.meetingDetails.description}</p>
                  </div>
                  <div className="mb-6 bg-slate-50 rounded-lg p-4 shadow">
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">Attendees</h3>
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Attendees List */}
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-blue-700 mb-2">Attendees</h4>
                        <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
                          {attendees.map(email => {
                            const user = allusers.find(u => u.email === email);
                            return (
                              <span key={email} className="bg-blue-100 border rounded px-2 py-1 text-xs font-semibold flex items-center">
                                {user ? user.name : email} ({email})
                                <button
                                  type="button"
                                  className="ml-2 px-1 rounded bg-blue-200 text-blue-700 flex items-center"
                                  onClick={() => removeAttendee(email)}
                                  title="Remove attendee"
                                >
                                  Remove
                                </button>
                              </span>
                            );
                          })}
                          {attendees.length === 0 && (
                            <span className="text-xs text-slate-400">No attendees selected.</span>
                          )}
                        </div>
                      </div>
                      {/* Non-Attendees List */}
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-slate-700 mb-2">Non-Attendees</h4>
                        <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
                          {allusers
                            .filter(u => !attendees.includes(u.email))
                            .map(user => (
                              <span key={user.email} className="bg-slate-100 border rounded px-2 py-1 text-xs flex items-center">
                                {user.name} ({user.email})
                                <button
                                  type="button"
                                  className="ml-2 px-1 rounded bg-emerald-200 text-emerald-700 flex items-center"
                                  onClick={() => addAttendee(user.email)}
                                  title="Add attendee"
                                >
                                  Add
                                </button>
                              </span>
                            ))}
                          {allusers.length > 0 && allusers.filter(u => !attendees.includes(u.email)).length === 0 && (
                            <span className="text-xs text-slate-400">No non-attendees for this meeting.</span>
                          )}
                          {allusers.length === 0 && (
                            <span className="text-xs text-slate-400">No users found.</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Update button */}
                    {attendeesChanged && (
                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold shadow"
                          onClick={handleUpdateAttendees}
                        >
                          Update Attendees
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="mb-2">
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">Action Items</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border rounded-lg mb-2">
                        <thead>
                          <tr className="bg-slate-100">
                            <th className="p-2 text-left text-xs font-semibold">Action Item</th>
                            <th className="p-2 text-left text-xs font-semibold">Responsible</th>
                            <th className="p-2 text-left text-xs font-semibold">Deadline</th>
                            <th className="p-2 text-left text-xs font-semibold">Status</th>
                            <th className="p-2 text-left text-xs font-semibold">Description / Add Point</th>
                            <th className="p-2 text-left text-xs"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {actionItems.map((action, idx) => (
                            <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                              <td className="p-2 align-top">
                                <input
                                  type="text"
                                  value={action.item}
                                  onChange={e => handleActionItemChange(idx, "item", e.target.value)}
                                  className="border rounded px-2 py-1 w-full"
                                  placeholder="e.g. Update syllabus"
                                />
                              </td>
                              <td className="p-2 align-top">
                                <select
                                  value={action.responsible}
                                  onChange={e => handleActionItemChange(idx, "responsible", e.target.value)}
                                  className="border rounded px-2 py-1 w-full"
                                >
                                  <option value="">Select</option>
                                  {/* Show all users, highlight attendees */}
                                  {allusers.map(user => (
                                    <option
                                      key={user.email}
                                      value={user.email}
                                      style={attendees.includes(user.email) ? { fontWeight: 'bold', backgroundColor: '#dbeafe' } : {}}
                                    >
                                      {user.name} ({user.email}){attendees.includes(user.email) ? " ★" : ""}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="p-2 align-top">
                                <input
                                  type="date"
                                  value={action.deadline}
                                  onChange={e => handleActionItemChange(idx, "deadline", e.target.value)}
                                  className="border rounded px-2 py-1 w-full"
                                />
                              </td>
                              <td className="p-2 align-top">
                                <select
                                  value={action.status}
                                  onChange={e => handleActionItemChange(idx, "status", e.target.value)}
                                  className="border rounded px-2 py-1 w-full"
                                >
                                  <option value="Open">🟢 Open</option>
                                  <option value="Closed">🔴 Closed</option>
                                </select>
                              </td>
                              <td className="p-2 align-top">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={action.description}
                                    onChange={e => handleActionItemChange(idx, "description", e.target.value)}
                                    className="border rounded px-2 py-1 w-full"
                                    placeholder="Add point, remark, discussion"
                                  />
                                  <button
                                    type="button"
                                    className="text-violet-600 hover:text-violet-800 text-lg"
                                    title="Add Point"
                                    onClick={addActionItem}
                                  >+</button>
                                </div>
                              </td>
                              <td className="p-2 align-top">
                                <button
                                  type="button"
                                  className="text-red-500 px-2 font-bold"
                                  onClick={() => removeActionItem(idx)}
                                  title="Remove"
                                >×</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <button
                      type="button"
                      className="bg-violet-600 hover:bg-violet-700 text-white px-3 py-1 rounded flex items-center gap-2 mt-2"
                      onClick={addActionItem}
                    >
                      <span className="text-lg font-bold">+</span> Add Item
                    </button>
                  </div>
                  {/* You can add a save button here to handle action data */}
                </div>
              </div>
            </div>
          </div>
        )}

        {sortedMeetings.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="text-slate-400" size={32} />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No meetings scheduled</h3>
            <p className="text-slate-600 mb-4">Get started by creating your first meeting</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AllMeetingWithParticipants;