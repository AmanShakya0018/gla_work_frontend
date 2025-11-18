import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";

import ScheduleMeeting from "../ScheduleMeeting.jsx";
import AllMeetingWithParticipants from "../allmeeting_with_participants.jsx";
import { fetchAllMeetings } from "./meetingSlice.js";

const Homepage = () => {
  const [showSchedule, setShowSchedule] = useState(false);
  const [showAllMeetings, setShowAllMeetings] = useState(false);
  const dispatch = useDispatch();

  const handleShowAllMeetings = () => {
    dispatch(fetchAllMeetings());
    setShowAllMeetings(true);
  };

  return (
    <div className="flex min-h-screen flex-col items-center gap-10 bg-neutral-100 px-4 py-16">
      <h1 className="text-3xl font-semibold text-neutral-900">
        Meetings Dashboard
      </h1>

      {/* Cards Wrapper */}
      <div className="grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* ALL MEETINGS */}
        <div className="flex flex-col justify-between rounded-2xl bg-white p-6 shadow-md ring-1 shadow-black/15 ring-neutral-300 transition">
          <div>
            <h3 className="mb-3 text-xl font-semibold text-black">
              All Meetings
            </h3>
            <p className="mb-6 text-neutral-800">
              View all your scheduled meetings in one place.
            </p>
          </div>
          <button
            onClick={handleShowAllMeetings}
            className="w-full cursor-pointer rounded-lg bg-indigo-600 py-3 text-lg font-bold text-white transition hover:bg-indigo-700"
          >
            View All Meetings
          </button>
        </div>

        {/* TODAY'S MEETINGS */}
        <div className="flex flex-col justify-between rounded-2xl bg-white p-6 shadow-md ring-1 shadow-black/15 ring-neutral-300 transition">
          <div>
            <h3 className="mb-3 text-xl font-semibold text-black">
              Today's Meetings
            </h3>
            <p className="mb-6 text-neutral-800">
              See what's planned for today.
            </p>
          </div>
          <Link to="/today-meetings" className="block w-full">
            <button className="w-full cursor-pointer rounded-lg bg-emerald-600 py-3 text-lg font-bold text-white transition hover:bg-emerald-700">
              View Today's Meetings
            </button>
          </Link>
        </div>

        {/* SCHEDULE MEETING */}
        <div className="flex flex-col justify-between rounded-2xl bg-white p-6 shadow-md ring-1 shadow-black/15 ring-neutral-300 transition">
          <div>
            <h3 className="mb-3 text-xl font-semibold text-black">
              Schedule a Meeting
            </h3>
            <p className="mb-6 text-neutral-800">
              Create a new meeting in just a few steps.
            </p>
          </div>
          <button
            onClick={() => setShowSchedule(true)}
            className="w-full cursor-pointer rounded-lg bg-rose-600 py-3 text-lg font-bold text-white transition hover:bg-rose-700"
          >
            Schedule New Meeting
          </button>
        </div>
      </div>

      {showSchedule && (
        <ScheduleMeeting onClose={() => setShowSchedule(false)} />
      )}

      {showAllMeetings && <AllMeetingWithParticipants />}
    </div>
  );
};

export default Homepage;
