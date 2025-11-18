import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllParticipants } from "./redux/meetingSlice.js";
import {
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

const generateTimeOptions = (interval = 15) => {
  const options = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += interval) {
      const hour24 = String(h).padStart(2, "0");
      const minute = String(m).padStart(2, "0");
      const time24 = `${hour24}:${minute}`;

      let displayHour = h % 12;
      displayHour = displayHour === 0 ? 12 : displayHour;
      const ampm = h < 12 ? "AM" : "PM";
      const displayTime = `${String(displayHour).padStart(
        2,
        "0",
      )}:${minute} ${ampm}`;

      options.push({ value: time24, label: displayTime });
    }
  }
  return options;
};

const timeOptions = generateTimeOptions();

export default function ScheduleMeeting({ onClose }) {
  const [form, setForm] = useState({
    meetingDate: "",
    meetingStart: "",
    meetingFinish: "",
    meetingTitle: "",
    meetingDescription: "",
    meetingOrganizer: "",
    meetingLocation: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [selectedUserEmails, setSelectedUserEmails] = useState([]);
  const [participantDropdownOpen, setParticipantDropdownOpen] = useState(false);
  const [selectedUsersAccordionOpen, setSelectedUsersAccordionOpen] =
    useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const dispatch = useDispatch();
  const meetingState = useSelector((state) => state.meeting);

  const allUsers = Array.isArray(meetingState.participants)
    ? meetingState.participants
    : Array.isArray(meetingState.participants?.userDetails)
      ? meetingState.participants.userDetails
      : [];

  const participantDropdownRef = useRef(null);

  useEffect(() => {
    dispatch(fetchAllParticipants());
  }, [dispatch]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        participantDropdownRef.current &&
        !participantDropdownRef.current.contains(event.target)
      ) {
        setParticipantDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setSuccess(false);
    setError("");
  };

  const handleTimeChange = (type, time24Value) => {
    setForm((prevForm) => ({
      ...prevForm,
      [type]: time24Value,
    }));
    setSuccess(false);
    setError("");
  };

  const filteredAvailableUsers = allUsers.filter(
    (user) =>
      (user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
      !selectedUserEmails.includes(user.email),
  );

  const handleUserSelectionToggle = (email) => {
    setSelectedUserEmails((prev) =>
      prev.includes(email) ? prev.filter((u) => u !== email) : [...prev, email],
    );
    if (!selectedUsersAccordionOpen) {
      setSelectedUsersAccordionOpen(true);
    }
  };

  const handleRemoveSelectedUser = (email) => {
    setSelectedUserEmails((prev) => prev.filter((u) => u !== email));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    const validationErrors = [];

    if (!form.meetingDate) {
      validationErrors.push("Please choose a meeting date.");
    }
    if (!form.meetingStart || !form.meetingFinish) {
      validationErrors.push("Please select both start and end times.");
    }
    if (
      !form.meetingTitle ||
      !form.meetingDescription ||
      !form.meetingOrganizer ||
      !form.meetingLocation
    ) {
      validationErrors.push(
        "Please fill in all meeting details (title, description, organizer, location).",
      );
    }
    if (selectedUserEmails.length === 0) {
      validationErrors.push("Please select at least one participant.");
    }

    if (form.meetingStart && form.meetingFinish && form.meetingDate) {
      const startDateTime = new Date(
        `${form.meetingDate}T${form.meetingStart}`,
      );
      const finishDateTime = new Date(
        `${form.meetingDate}T${form.meetingFinish}`,
      );

      if (finishDateTime <= startDateTime) {
        validationErrors.push("Meeting end time must be after start time.");
      }
    }

    if (validationErrors.length > 0) {
      setError(validationErrors.join(" "));
      setLoading(false);
      document.getElementById("schedule-meeting-form").scrollTop = 0;
      return;
    }

    try {
      await axios.put("http://localhost:4000/api/schedule-meeting", {
        ...form,
        emails: selectedUserEmails,
      });
      setSuccess(true);
      setForm({
        meetingDate: "",
        meetingStart: "",
        meetingFinish: "",
        meetingTitle: "",
        meetingDescription: "",
        meetingOrganizer: "",
        meetingLocation: "",
      });
      setSelectedUserEmails([]);
      setSearchTerm("");
      setParticipantDropdownOpen(false);
      document.getElementById("schedule-meeting-form").scrollTop = 0;
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to schedule meeting. Please try again. Network error or server issue.",
      );
      document.getElementById("schedule-meeting-form").scrollTop = 0;
    }
    setLoading(false);
  };

  const selectedUserDetails = allUsers.filter((user) =>
    selectedUserEmails.includes(user.email),
  );

  return (
    <div className="bg-opacity-70 fixed inset-0 z-50 flex items-center justify-center bg-neutral-100">
      <div className="relative mx-auto flex max-h-[95vh] w-full max-w-md flex-col rounded-2xl bg-white shadow-[0px_4px_16px_rgba(17,17,26,0.1),0px_8px_24px_rgba(17,17,26,0.1),0px_16px_56px_rgba(17,17,26,0.1)] sm:max-w-lg lg:max-w-5xl">
        <div className="flex items-center justify-between border-b border-neutral-200 p-5 lg:p-6">
          <h2 className="text-2xl font-bold text-neutral-900 lg:text-3xl">
            Schedule a New Meeting
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1 text-neutral-500 transition hover:scale-110 hover:text-red-600 focus:ring-2 focus:ring-red-300 focus:outline-none active:scale-90"
          >
            <X size={28} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          id="schedule-meeting-form"
          className="h-full grow overflow-y-auto p-5 lg:p-8"
        >
          {error && (
            <div
              className="mb-4 flex items-center justify-center gap-2 rounded-lg bg-red-100/80 p-3 text-center text-lg font-bold text-red-700"
              role="alert"
            >
              <AlertCircle size={24} />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div
              className="mb-4 flex items-center justify-center gap-2 rounded-lg bg-green-100/80 p-3 text-center text-lg font-bold text-green-700"
              role="status"
            >
              <CheckCircle size={24} />
              <span>Meeting scheduled successfully!</span>
            </div>
          )}

          <div className="grid h-full grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
            <div className="flex flex-col space-y-5 lg:space-y-6">
              <div>
                <label
                  htmlFor="meetingDate"
                  className="mb-1 block text-sm font-medium text-neutral-700"
                >
                  Choose a Date<span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="meetingDate"
                  name="meetingDate"
                  value={form.meetingDate}
                  onChange={handleChange}
                  required
                  aria-required="true"
                  className="w-full rounded-lg border border-neutral-300 px-4 py-2 text-neutral-900 shadow-sm transition-all focus:ring-2 focus:ring-neutral-500 focus:outline-none"
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="meetingStart"
                    className="mb-1 block text-sm font-medium text-neutral-700"
                  >
                    Start Time<span className="text-red-500">*</span>
                  </label>
                  <select
                    id="meetingStart"
                    name="meetingStart"
                    value={form.meetingStart}
                    onChange={(e) =>
                      handleTimeChange("meetingStart", e.target.value)
                    }
                    required
                    aria-required="true"
                    className="w-full rounded-lg border border-neutral-300 px-4 py-2 text-neutral-900 shadow-sm transition-all focus:ring-2 focus:ring-neutral-500 focus:outline-none"
                  >
                    <option value="" disabled>
                      Select Start Time
                    </option>
                    {timeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="meetingFinish"
                    className="mb-1 block text-sm font-medium text-neutral-700"
                  >
                    End Time<span className="text-red-500">*</span>
                  </label>
                  <select
                    id="meetingFinish"
                    name="meetingFinish"
                    value={form.meetingFinish}
                    onChange={(e) =>
                      handleTimeChange("meetingFinish", e.target.value)
                    }
                    required
                    aria-required="true"
                    className="w-full rounded-lg border border-neutral-300 px-4 py-2 text-neutral-900 shadow-sm transition-all focus:ring-2 focus:ring-neutral-500 focus:outline-none"
                  >
                    <option value="" disabled>
                      Select End Time
                    </option>
                    {timeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label
                  htmlFor="meetingTitle"
                  className="mb-1 block text-sm font-medium text-neutral-700"
                >
                  Meeting Title<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="meetingTitle"
                  name="meetingTitle"
                  value={form.meetingTitle}
                  onChange={handleChange}
                  required
                  aria-required="true"
                  className="w-full rounded-lg border border-neutral-300 px-4 py-2 text-neutral-900 shadow-sm transition-all focus:ring-2 focus:ring-neutral-500 focus:outline-none"
                  placeholder="E.g., Team Stand-up, Project X Review"
                />
              </div>
              <div>
                <label
                  htmlFor="meetingDescription"
                  className="mb-1 block text-sm font-medium text-neutral-700"
                >
                  Description<span className="text-red-500">*</span>
                </label>
                <textarea
                  id="meetingDescription"
                  name="meetingDescription"
                  value={form.meetingDescription}
                  onChange={handleChange}
                  required
                  aria-required="true"
                  rows="4"
                  className="min-h-[100px] w-full resize-y rounded-lg border border-neutral-300 px-4 py-2 text-neutral-900 shadow-sm transition-all focus:ring-2 focus:ring-neutral-500 focus:outline-none"
                  placeholder="Brief overview of the meeting agenda, key topics..."
                ></textarea>
              </div>
              <div>
                <label
                  htmlFor="meetingOrganizer"
                  className="mb-1 block text-sm font-medium text-neutral-700"
                >
                  Organizer Name<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="meetingOrganizer"
                  name="meetingOrganizer"
                  value={form.meetingOrganizer}
                  onChange={handleChange}
                  required
                  aria-required="true"
                  className="w-full rounded-lg border border-neutral-300 px-4 py-2 text-neutral-900 shadow-sm transition-all focus:ring-2 focus:ring-neutral-500 focus:outline-none"
                  placeholder="Your Name (e.g., John Doe)"
                />
              </div>
              <div>
                <label
                  htmlFor="meetingLocation"
                  className="mb-1 block text-sm font-medium text-neutral-700"
                >
                  Meeting Location<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="meetingLocation"
                  name="meetingLocation"
                  value={form.meetingLocation}
                  onChange={handleChange}
                  required
                  aria-required="true"
                  className="w-full rounded-lg border border-neutral-300 px-4 py-2 text-neutral-900 shadow-sm transition-all focus:ring-2 focus:ring-neutral-500 focus:outline-none"
                  placeholder="e.g., Conference Room A / Google Meet Link"
                />
              </div>
            </div>

            <div className="flex flex-col space-y-6 lg:h-full">
              <h3 className="text-xl font-semibold text-neutral-900">
                Participants
              </h3>
              <div className="relative" ref={participantDropdownRef}>
                <label className="mb-2 block text-sm font-bold text-neutral-700">
                  Select Participants<span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  className="flex min-h-11 w-full cursor-pointer items-center justify-between rounded-lg border border-neutral-300 bg-white px-4 py-2 text-left shadow-sm transition hover:shadow-md focus:ring-2 focus:ring-neutral-500 focus:outline-none"
                  onClick={() =>
                    setParticipantDropdownOpen(!participantDropdownOpen)
                  }
                  aria-expanded={participantDropdownOpen}
                  aria-controls="participant-list-dropdown"
                >
                  {selectedUserEmails.length === 0 ? (
                    <span className="text-neutral-400">
                      Click to select attendees...
                    </span>
                  ) : (
                    <span className="text-neutral-800">
                      {selectedUserEmails.length} participant(s) selected
                    </span>
                  )}
                  <span className="ml-2 text-neutral-500">
                    {participantDropdownOpen ? (
                      <ChevronUp size={20} />
                    ) : (
                      <ChevronDown size={20} />
                    )}
                  </span>
                </button>
                {participantDropdownOpen && (
                  <div
                    id="participant-list-dropdown"
                    className="animate-fade-in absolute top-full right-0 left-0 z-10 mt-2 rounded-lg border border-neutral-300 bg-white shadow-xl"
                    style={{
                      maxHeight: "300px",
                      overflowY: "auto",
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="sticky top-0 z-20 w-full rounded-t-lg border-b border-neutral-200 bg-white px-4 py-3 focus:ring-1 focus:ring-neutral-400 focus:outline-none"
                      aria-label="Search participants"
                    />
                    <div className="py-1">
                      {meetingState.loading && (
                        <div className="px-4 py-2 text-neutral-500">
                          Loading participants...
                        </div>
                      )}
                      {meetingState.error && (
                        <div className="px-4 py-2 text-red-600">
                          Error loading participants. Please try again.
                        </div>
                      )}
                      {!meetingState.loading &&
                        !meetingState.error &&
                        filteredAvailableUsers.length === 0 && (
                          <div className="px-4 py-2 text-neutral-500">
                            No matching available users found.
                          </div>
                        )}
                      {!meetingState.loading &&
                        !meetingState.error &&
                        filteredAvailableUsers.map((user) => (
                          <div
                            key={user._id}
                            className="flex cursor-pointer items-center justify-between px-4 py-2 transition hover:bg-neutral-50"
                            onClick={() =>
                              handleUserSelectionToggle(user.email)
                            }
                          >
                            <label
                              htmlFor={`participant-${user._id}`}
                              className="flex grow cursor-pointer items-center"
                            >
                              <input
                                type="checkbox"
                                id={`participant-${user._id}`}
                                checked={selectedUserEmails.includes(
                                  user.email,
                                )}
                                readOnly
                                className="mr-3 h-5 w-5 cursor-pointer accent-neutral-600"
                              />
                              <div>
                                <span className="font-medium text-neutral-800">
                                  {user.name}
                                </span>
                                <span className="ml-2 text-sm text-neutral-500">
                                  ({user.email})
                                </span>
                              </div>
                            </label>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="grow">
                <button
                  type="button"
                  onClick={() => setSelectedUsersAccordionOpen((open) => !open)}
                  className="flex w-full items-center justify-between py-2 text-lg font-bold text-neutral-900 focus:outline-none"
                  aria-expanded={selectedUsersAccordionOpen}
                  aria-controls="selected-participants-accordion"
                >
                  <span className="text-xl">
                    Review Selected Participants ({selectedUserDetails.length})
                  </span>
                  <span className="ml-2 text-neutral-600">
                    {selectedUsersAccordionOpen ? (
                      <ChevronUp size={24} />
                    ) : (
                      <ChevronDown size={24} />
                    )}
                  </span>
                </button>
                {selectedUsersAccordionOpen && (
                  <div
                    id="selected-participants-accordion"
                    className="grid gap-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4 shadow-inner"
                    style={{
                      maxHeight: "350px",
                      overflowY: "auto",
                    }}
                  >
                    {selectedUserDetails.length === 0 ? (
                      <p className="py-2 text-center text-neutral-600">
                        No participants selected yet. Use the 'Select
                        Participants' dropdown above to add them.
                      </p>
                    ) : (
                      selectedUserDetails.map((user) => (
                        <div
                          key={user._id}
                          className="flex flex-col justify-between rounded-lg border border-neutral-200 bg-neutral-100 p-4 text-sm shadow-sm sm:flex-row sm:items-center"
                        >
                          <div className="grow">
                            <span className="mb-0.5 block text-base font-bold text-neutral-900">
                              {user.name}
                            </span>
                            <span className="block text-neutral-700">
                              <span className="font-medium">Email:</span>{" "}
                              {user.email}
                            </span>
                            {user.department && (
                              <span className="block text-neutral-700">
                                <span className="font-medium">Dept:</span>{" "}
                                {user.department}
                              </span>
                            )}
                            {user.facultyid && (
                              <span className="block text-neutral-700">
                                <span className="font-medium">ID:</span>{" "}
                                {user.facultyid}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveSelectedUser(user.email)}
                            className="mt-3 inline-flex items-center justify-center gap-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-red-700 sm:mt-0 sm:ml-4"
                            aria-label={`Remove ${user.name} from participants`}
                          >
                            <X size={16} /> Remove
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>
        <div className="flex flex-col-reverse justify-end gap-3 border-t border-neutral-200 p-5 sm:flex-row lg:p-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-neutral-200 px-6 py-3 text-lg font-semibold text-neutral-700 shadow transition-all duration-300 hover:scale-[1.02] hover:bg-neutral-300 active:scale-95 sm:w-auto"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="schedule-meeting-form"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 px-6 py-3 text-xl font-bold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:bg-blue-700 focus:ring-2 focus:ring-neutral-200 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {loading ? "Scheduling..." : "Schedule Meeting"}
          </button>
        </div>
      </div>
    </div>
  );
}
