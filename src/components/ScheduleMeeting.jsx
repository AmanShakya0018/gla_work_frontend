import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllParticipants } from './redux/meetingSlice.js';

export default function ScheduleMeeting({ onClose }) {
  const [form, setForm] = useState({
    meetingDate: '',
    meetingStart: '',
    meetingFinish: '',
    meetingTitle: '',
    meetingDescription: '',
    meetingOrganizer: '',
    meetingLocation: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedDropdownOpen, setSelectedDropdownOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dispatch = useDispatch();
  const meetingState = useSelector(state => state.meeting);
  // Support both: participants as array or object with userDetails
  const users = Array.isArray(meetingState.participants)
    ? meetingState.participants
    : Array.isArray(meetingState.participants?.userDetails)
      ? meetingState.participants.userDetails
      : [];

  console.log("Users fetched:", users);
  useEffect(() => {
    dispatch(fetchAllParticipants());
  }, [dispatch]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const filteredUsers = users
    .filter(
      user =>
        (user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()))
        && !selectedUsers.includes(user.email) // hide selected users
    );

  const handleUserToggle = (email) => {
    setSelectedUsers(prev =>
      prev.includes(email)
        ? prev.filter(u => u !== email)
        : [...prev, email]
    );
  };

  // Remove user from selectedUsers
  const handleRemoveUser = (email) => {
    setSelectedUsers(prev => prev.filter(u => u !== email));
  };
  console.log("selected users ",selectedUsers)

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      await axios.put('http://localhost:4000/api/schedule-meeting', {
        ...form,
        emails: selectedUsers // send as 'emails' array, not 'participants'
      });
      setSuccess(true);
      setForm({
        meetingDate: '',
        meetingStart: '',
        meetingFinish: '',
        meetingTitle: '',
        meetingDescription: '',
        meetingOrganizer: '',
        meetingLocation: '',
      });
      setSelectedUsers([]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to schedule meeting');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex items-center justify-center z-50">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-md sm:max-w-lg mx-2 border border-gray-200 relative" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        {/* X Close Icon */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-2xl font-bold focus:outline-none transition"
        >
          &times;
        </button>
        <h2 className="text-3xl font-extrabold mb-6 text-center text-blue-700 tracking-tight">Schedule a Meeting</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <input type="date" name="meetingDate" value={form.meetingDate} onChange={handleChange} required className="w-full border border-blue-200 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition" placeholder="Date" />
            <input type="time" name="meetingStart" value={form.meetingStart} onChange={handleChange} required className="w-full border border-blue-200 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition" placeholder="Start Time" />
            <input type="time" name="meetingFinish" value={form.meetingFinish} onChange={handleChange} required className="w-full border border-blue-200 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition" placeholder="Finish Time" />
            <input type="text" name="meetingTitle" value={form.meetingTitle} onChange={handleChange} required className="w-full border border-blue-200 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition" placeholder="Title" />
            <input type="text" name="meetingDescription" value={form.meetingDescription} onChange={handleChange} required className="w-full border border-blue-200 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition" placeholder="Description" />
            <input type="text" name="meetingOrganizer" value={form.meetingOrganizer} onChange={handleChange} required className="w-full border border-blue-200 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition" placeholder="Organizer" />
            <input type="text" name="meetingLocation" value={form.meetingLocation} onChange={handleChange} required className="w-full border border-blue-200 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition" placeholder="Location" />
          </div>

          <label className="block font-semibold mt-2 text-blue-700">Select Participants to Email:</label>
          <div className="relative">
            <div
              className="w-full border border-blue-200 px-3 py-2 rounded-lg bg-white cursor-pointer shadow-sm hover:shadow-md transition"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              {selectedUsers.length === 0
                ? <span className="text-gray-400">Select participants...</span>
                : users
                    .filter(u => selectedUsers.includes(u.email))
                    .map(u => u.name)
                    .join(', ')}
            </div>
            {dropdownOpen && (
              <div className="absolute z-10 w-full bg-white border border-blue-200 rounded-lg shadow-lg max-h-64 overflow-y-auto mt-1 animate-fade-in" style={{ minHeight: '120px' }}>
                {selectedUsers.length === 0 && (
                  <>
                    <input
                      type="text"
                      placeholder="Search participants..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 border-b border-blue-100 focus:outline-none"
                    />
                    {filteredUsers.length === 0 && (
                      <div className="px-3 py-2 text-gray-500">No users found</div>
                    )}
                  </>
                )}
                <div className="overflow-y-auto" style={{ maxHeight: '180px' }}>
                  {filteredUsers.map(user => (
                    <div
                      key={user._id}
                      className="flex items-center px-3 py-2 hover:bg-blue-50 cursor-pointer transition"
                      onClick={() => handleUserToggle(user.email)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.email)}
                        readOnly
                        className="mr-2 accent-blue-600"
                      />
                      <span className="font-medium text-blue-700">{user.name}</span>
                      <span className="ml-2 text-xs text-gray-500">({user.email})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* Collapsible Selected User Details */}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setSelectedDropdownOpen((open) => !open)}
              className="flex items-center font-bold text-lg text-blue-700 mb-2 focus:outline-none"
            >
              <span>Selected User Details</span>
              <svg className={`ml-2 w-5 h-5 transition-transform ${selectedDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </button>
            {selectedDropdownOpen && (
              <div className="grid gap-3 mt-2 max-h-48 overflow-y-auto">
                {users
                  .filter(user => selectedUsers.includes(user.email))
                  .map(user => (
                    <div key={user._id} className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm shadow-sm flex flex-col sm:flex-row sm:items-center justify-between">
                      <div>
                        <span className="block font-semibold text-blue-800">{user.name}</span>
                        <span className="block text-gray-700">Email: <span className="font-medium">{user.email}</span></span>
                        <span className="block text-gray-700">Department: <span className="font-medium">{user.department}</span></span>
                        <span className="block text-gray-700">Faculty ID: <span className="font-medium">{user.facultyid}</span></span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveUser(user.email)}
                        className="mt-2 sm:mt-0 sm:ml-4 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-xs font-semibold shadow transition"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button type="submit" disabled={loading} className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded-lg font-semibold shadow hover:from-blue-600 hover:to-purple-600 transition w-full sm:w-auto">{loading ? 'Scheduling...' : 'Schedule'}</button>
            <button type="button" onClick={onClose} className="bg-gray-200 px-6 py-2 rounded-lg font-semibold text-gray-700 hover:bg-gray-300 transition w-full sm:w-auto">Cancel</button>
          </div>
          {error && <div className="text-red-600 mt-4 text-center font-medium">{error}</div>}
          {success && <div className="text-green-600 mt-4 text-center font-medium">Meeting scheduled!</div>}
        </form>
      </div>
    </div>
  );
}
