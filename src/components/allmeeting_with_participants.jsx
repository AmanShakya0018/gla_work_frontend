import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { fetchAllMeetings, fetchAllParticipants } from "./redux/meetingSlice";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  AlertCircle,
  CheckCircle,
  PlusCircle,
  MinusCircle,
} from "lucide-react";

// Helper to generate time options for dropdowns
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

// Helper to format date for display
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

function AllMeetingWithParticipants() {
  const dispatch = useDispatch();
  const {
    meetings,
    loading,
    error: meetingsError,
  } = useSelector((state) => state.meeting);
  const {
    participants,
    loading: participantsLoading,
    error: participantsError,
  } = useSelector((state) => state.meeting);

  const allUsers = Array.isArray(participants?.userDetails)
    ? participants.userDetails
    : Array.isArray(participants)
      ? participants
      : [];

  const sortedMeetings = Array.isArray(meetings)
    ? [...meetings].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      )
    : [];

  useEffect(() => {
    dispatch(fetchAllMeetings());
    dispatch(fetchAllParticipants());
  }, [dispatch]);

  const [openAvailable, setOpenAvailable] = useState({});
  const [openNotAvailable, setOpenNotAvailable] = useState({});

  // --- Edit Meeting Modal States ---
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    id: "", // MongoDB _id
    meetingId: "", // Your custom meeting ID
    meetingDate: "",
    meetingStart: "",
    meetingFinish: "",
    meetingTitle: "",
    meetingDescription: "",
    meetingOrganizer: "",
    meetingLocation: "",
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState(false);

  useEffect(() => {
    if (editError || editSuccess) {
      const timer = setTimeout(() => {
        setEditError("");
        setEditSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [editError, editSuccess]);

  const onEditMeeting = (meetingId) => {
    const meeting = sortedMeetings.find((m) => m.meetingId === meetingId);
    if (meeting) {
      let meetingStart = "";
      let meetingFinish = "";
      if (
        meeting.meetingDetails.time &&
        meeting.meetingDetails.time.includes("-")
      ) {
        const [start, finish] = meeting.meetingDetails.time
          .split("-")
          .map((t) => t.trim());
        meetingStart = start;
        meetingFinish = finish;
      }
      setEditForm({
        id: meeting.id,
        meetingId: meeting.meetingId,
        meetingDate: meeting.meetingDetails.date
          ? meeting.meetingDetails.date.split("T")[0]
          : "",
        meetingStart: meetingStart,
        meetingFinish: meetingFinish,
        meetingTitle: meeting.meetingDetails.title,
        meetingDescription: meeting.meetingDetails.description,
        meetingOrganizer: meeting.meetingDetails.organizer,
        meetingLocation: meeting.meetingDetails.location,
      });
      setEditModalOpen(true);
      setEditError("");
      setEditSuccess(false);
    }
  };

  const handleEditFormChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
    setEditError("");
    setEditSuccess(false);
  };

  const handleEditTimeChange = (type, time24Value) => {
    setEditForm((prevForm) => ({
      ...prevForm,
      [type]: time24Value,
    }));
    setEditError("");
    setEditSuccess(false);
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError("");
    setEditSuccess(false);

    const validationErrors = [];

    if (!editForm.meetingDate) {
      validationErrors.push("Please choose a meeting date.");
    }
    if (!editForm.meetingStart || !editForm.meetingFinish) {
      validationErrors.push("Please select both start and end times.");
    }
    if (
      !editForm.meetingTitle ||
      !editForm.meetingDescription ||
      !editForm.meetingOrganizer ||
      !editForm.meetingLocation
    ) {
      validationErrors.push(
        "Please fill in all meeting details (title, description, organizer, location).",
      );
    }

    if (
      editForm.meetingStart &&
      editForm.meetingFinish &&
      editForm.meetingDate
    ) {
      const startDateTime = new Date(
        `${editForm.meetingDate}T${editForm.meetingStart}`,
      );
      const finishDateTime = new Date(
        `${editForm.meetingDate}T${editForm.meetingFinish}`,
      );

      if (finishDateTime <= startDateTime) {
        validationErrors.push("Meeting end time must be after start time.");
      }
    }

    if (validationErrors.length > 0) {
      setEditError(validationErrors.join(" "));
      setEditLoading(false);
      return;
    }

    try {
      const payload = {
        meetingTitle: editForm.meetingTitle,
        meetingDescription: editForm.meetingDescription,
        meetingOrganizer: editForm.meetingOrganizer,
        meetingDate: editForm.meetingDate,
        meetingTime: {
          meetingStart: editForm.meetingStart,
          meetingFinish: editForm.meetingFinish,
        },
        meetingLocation: editForm.meetingLocation,
        meeting_id: editForm.meetingId,
        updatedAt: new Date().toISOString(),
      };

      await axios.post(
        `http://localhost:4000/api/edit-meeting/${editForm.id}`,
        payload,
      );
      setEditSuccess(true);
      dispatch(fetchAllMeetings());
    } catch (err) {
      setEditError(
        err.response?.data?.message ||
          "Failed to update meeting. Please try again. Network error or server issue.",
      );
    }
    setEditLoading(false);
  };

  // --- Action Table Modal States ---
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionMeetingData, setActionMeetingData] = useState(null);
  const [actionAttendees, setActionAttendees] = useState([]);
  const [actionItems, setActionItems] = useState([]);
  const [actionMessage, setActionMessage] = useState({
    type: "",
    text: "",
  });
  const [actionAttendeesChanged, setActionAttendeesChanged] = useState(false);
  const [actionItemsChanged, setActionItemsChanged] = useState(false);
  const [responsibleDropdownOpen, setResponsibleDropdownOpen] = useState({});
  const responsibleDropdownRef = useRef([]);

  useEffect(() => {
    if (actionMessage.text) {
      const timer = setTimeout(() => {
        setActionMessage({ type: "", text: "" });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [actionMessage]);

  const onActionMeeting = (meetingId) => {
    const meeting = sortedMeetings.find((m) => m.meetingId === meetingId);
    if (meeting) {
      setActionMeetingData(meeting);
      setActionAttendees(
        meeting.meetingData.available_participants.map((p) => p.email),
      );
      setActionItems(
        meeting.meetingData.action_items &&
          meeting.meetingData.action_items.length > 0
          ? meeting.meetingData.action_items.map((item) => ({
              ...item,
              deadline: item.deadline ? item.deadline.split("T")[0] : "",
            }))
          : [
              {
                item: "",
                responsible: "",
                deadline: "",
                status: "Open",
                description: "",
              },
            ],
      );
      setActionAttendeesChanged(false);
      setActionItemsChanged(false);
      setActionMessage({ type: "", text: "" });
      setActionModalOpen(true);
    }
  };

  const addActionAttendee = (email) => {
    setActionAttendees((prev) => {
      if (!prev.includes(email)) {
        setActionAttendeesChanged(true);
        return [...prev, email];
      }
      return prev;
    });
  };

  const removeActionAttendee = (email) => {
    setActionAttendees((prev) => {
      if (prev.includes(email)) {
        setActionAttendeesChanged(true);
        return prev.filter((a) => a !== email);
      }
      return prev;
    });
  };

  const handleUpdateActionAttendees = async () => {
    if (!actionMeetingData || !actionAttendeesChanged) return;
    setActionMessage({ type: "", text: "" });
    try {
      const payload = {
        meetingId: actionMeetingData.meetingId,
        attendees: actionAttendees,
      };

      await axios.post(
        "http://localhost:4000/api/update-meeting-attendees",
        payload,
      );
      dispatch(fetchAllMeetings());
      setActionMessage({
        type: "success",
        text: "Attendees updated successfully.",
      });
      setActionAttendeesChanged(false);
    } catch (err) {
      console.error("Update Attendees error:", err);
      setActionMessage({
        type: "error",
        text:
          err.response?.data?.message ||
          "Failed to update attendees. Network error.",
      });
    }
  };

  const handleActionItemChange = (idx, field, value) => {
    setActionItems((prev) => {
      const updated = prev.map((item, i) =>
        i === idx ? { ...item, [field]: value } : item,
      );
      setActionItemsChanged(true);
      return updated;
    });
  };

  const addActionItem = () => {
    setActionItems((prev) => {
      setActionItemsChanged(true);
      return [
        ...prev,
        {
          item: "",
          responsible: "",
          deadline: "",
          status: "Open",
          description: "",
        },
      ];
    });
  };

  const removeActionItem = (idx) => {
    setActionItems((prev) => {
      setActionItemsChanged(true);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleSaveActionItems = async () => {
    if (!actionMeetingData || !actionItemsChanged) return;
    setActionMessage({ type: "", text: "" });
    try {
      const payload = {
        meetingId: actionMeetingData.meetingId,
        actionItems,
      };
      await axios.post(
        "http://localhost:4000/api/update-meeting-action-items", // Placeholder API endpoint
        payload,
      );
      dispatch(fetchAllMeetings());
      setActionMessage({
        type: "success",
        text: "Action items saved successfully.",
      });
      setActionItemsChanged(false);
    } catch (err) {
      console.error("Save Action Items error:", err);
      setActionMessage({
        type: "error",
        text:
          err.response?.data?.message ||
          "Failed to save action items. Network error.",
      });
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (responsibleDropdownRef.current) {
        let clickedInsideAnyDropdown = false;
        for (let i = 0; i < responsibleDropdownRef.current.length; i++) {
          if (
            responsibleDropdownRef.current[i] &&
            responsibleDropdownRef.current[i].contains(event.target)
          ) {
            clickedInsideAnyDropdown = true;
            break;
          }
        }
        if (!clickedInsideAnyDropdown) {
          setResponsibleDropdownOpen({});
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleResponsibleDropdown = (idx) => {
    setResponsibleDropdownOpen((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const selectResponsible = (idx, email) => {
    handleActionItemChange(idx, "responsible", email);
    setResponsibleDropdownOpen((prev) => ({ ...prev, [idx]: false }));
  };

  return (
    <div className="min-h-screen w-full max-w-[85rem] bg-neutral-50 px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-neutral-900">
          All Meetings
        </h1>
        <p className="text-lg text-neutral-600">
          A comprehensive list of all scheduled meetings and their participants.
        </p>
      </div>

      {/* Loading & Error States for Meetings List */}
      {loading && (
        <div className="py-12 text-center text-lg text-neutral-600">
          Loading meetings...
        </div>
      )}
      {meetingsError && (
        <div className="py-12 text-center text-lg text-red-600">
          Error loading meetings: {meetingsError}
        </div>
      )}

      {/* Meetings Grid */}
      {!loading && !meetingsError && (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {" "}
          {/* Increased gap and card width for better visuals */}
          {sortedMeetings.length > 0 ? (
            sortedMeetings.map((meeting) => {
              const meetingId = meeting.meetingId;
              const availableParticipantsCount =
                meeting.meetingData.available_participants.length;
              const notAvailableParticipantsCount =
                meeting.meetingData.not_available_participants.length;

              return (
                <div
                  key={meetingId}
                  className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg transition-shadow duration-200 hover:shadow-xl" // Stronger shadow, larger card appearance
                >
                  <div className="bg-gradient-to-r from-neutral-800 to-neutral-700 p-6">
                    {" "}
                    {/* Increased padding */}
                    <h2 className="mb-2 line-clamp-2 text-xl font-semibold text-white">
                      {meeting.meetingDetails.title}
                    </h2>
                    <p className="line-clamp-2 text-base text-neutral-300">
                      {meeting.meetingDetails.description}
                    </p>
                  </div>

                  <div className="flex justify-end gap-3 px-6 pt-5 pb-3">
                    {" "}
                    {/* Increased padding and gap */}
                    <button
                      onClick={() => onActionMeeting(meetingId)}
                      className="rounded-lg bg-emerald-600 px-5 py-2 text-base font-medium text-white shadow transition hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-300 focus:outline-none" // Larger buttons, focus ring
                    >
                      Action Table
                    </button>
                    <button
                      onClick={() => onEditMeeting(meetingId)}
                      className="rounded-lg bg-indigo-600 px-5 py-2 text-base font-medium text-white shadow transition hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-300 focus:outline-none" // Larger buttons, focus ring
                    >
                      Edit Meeting
                    </button>
                  </div>

                  {/* Meeting Details */}
                  <div className="p-6 pt-0">
                    {" "}
                    {/* Increased padding */}
                    <div className="mb-5 space-y-4">
                      {" "}
                      {/* Increased margin and space */}
                      <div className="flex items-center text-base text-neutral-700">
                        {" "}
                        {/* Increased font size */}
                        <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100">
                          {" "}
                          {/* Larger icon container, neutral background */}
                          <User size={20} className="text-neutral-600" />{" "}
                          {/* Larger icon, neutral color */}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-neutral-500">
                            Organizer
                          </p>
                          <p className="truncate font-semibold text-neutral-900">
                            {meeting.meetingDetails.organizer}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center text-base text-neutral-700">
                        <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100">
                          <Calendar size={20} className="text-neutral-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-neutral-500">
                            Date
                          </p>
                          <p className="font-semibold text-neutral-900">
                            {formatDate(meeting.meetingDetails.date)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center text-base text-neutral-700">
                        <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100">
                          <Clock size={20} className="text-neutral-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-neutral-500">
                            Time
                          </p>
                          <p className="font-semibold text-neutral-900">
                            {meeting.meetingDetails.time}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center text-base text-neutral-700">
                        <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100">
                          <MapPin size={20} className="text-neutral-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-neutral-500">
                            Location
                          </p>
                          <p className="truncate font-semibold text-neutral-900">
                            {meeting.meetingDetails.location}
                          </p>
                        </div>
                      </div>
                    </div>
                    {/* Available Participants */}
                    <div className="mb-3">
                      <button
                        onClick={() =>
                          setOpenAvailable((prev) => ({
                            ...prev,
                            [meetingId]: !prev[meetingId],
                          }))
                        }
                        className="flex w-full items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-base font-medium text-emerald-700 transition-colors hover:bg-emerald-100 focus:ring-2 focus:ring-emerald-300 focus:outline-none" // Larger, focus ring
                      >
                        <div className="flex items-center gap-2">
                          <Check size={18} /> {/* Larger icon */}
                          <span>Available ({availableParticipantsCount})</span>
                        </div>
                        {openAvailable[meetingId] ? (
                          <ChevronUp size={18} />
                        ) : (
                          <ChevronDown size={18} />
                        )}
                      </button>
                      {openAvailable[meetingId] && (
                        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 shadow-inner">
                          {" "}
                          {/* Subtle shadow on open */}
                          {availableParticipantsCount === 0 ? (
                            <p className="py-2 text-center text-sm text-neutral-600 italic">
                              No available participants
                            </p>
                          ) : (
                            <ul className="space-y-2">
                              {meeting.meetingData.available_participants.map(
                                (p, idx) => (
                                  <li
                                    key={p.email + idx}
                                    className="flex items-start gap-3 rounded-md bg-white p-3 shadow-sm" // Clean white background for list item
                                  >
                                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                                      {" "}
                                      {/* Larger avatar, consistent bg */}
                                      <span className="text-sm font-semibold text-emerald-700">
                                        {p.name
                                          .split(" ")
                                          .map((n) => n[0])
                                          .join("")
                                          .toUpperCase()
                                          .slice(0, 2)}
                                      </span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-base font-semibold text-neutral-900">
                                        {p.name}
                                      </p>
                                      <p className="truncate text-sm text-neutral-600">
                                        {p.email}
                                      </p>
                                      <div className="mt-1 flex flex-wrap gap-2">
                                        {" "}
                                        {/* Flex wrap for tags */}
                                        <span className="rounded bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-700">
                                          {p.facultyid}
                                        </span>
                                        <span className="truncate rounded bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-700">
                                          {p.department}
                                        </span>
                                      </div>
                                    </div>
                                  </li>
                                ),
                              )}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                    {/* Not Available Participants */}
                    <div>
                      <button
                        onClick={() =>
                          setOpenNotAvailable((prev) => ({
                            ...prev,
                            [meetingId]: !prev[meetingId],
                          }))
                        }
                        className="flex w-full items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-base font-medium text-neutral-700 transition-colors hover:bg-neutral-100 focus:ring-2 focus:ring-neutral-300 focus:outline-none" // Larger, focus ring
                      >
                        <div className="flex items-center gap-2">
                          <X size={18} />
                          <span>
                            Unavailable ({notAvailableParticipantsCount})
                          </span>
                        </div>
                        {openNotAvailable[meetingId] ? (
                          <ChevronUp size={18} />
                        ) : (
                          <ChevronDown size={18} />
                        )}
                      </button>
                      {openNotAvailable[meetingId] && (
                        <div className="mt-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3 shadow-inner">
                          {notAvailableParticipantsCount === 0 ? (
                            <p className="py-2 text-center text-sm text-neutral-600 italic">
                              No unavailable participants
                            </p>
                          ) : (
                            <ul className="space-y-2">
                              {meeting.meetingData.not_available_participants.map(
                                (p, idx) => (
                                  <li
                                    key={p.email + idx}
                                    className="flex items-start gap-3 rounded-md bg-white p-3 shadow-sm"
                                  >
                                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100">
                                      <span className="text-sm font-semibold text-neutral-700">
                                        {p.name
                                          .split(" ")
                                          .map((n) => n[0])
                                          .join("")
                                          .toUpperCase()
                                          .slice(0, 2)}
                                      </span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-base font-semibold text-neutral-900">
                                        {p.name}
                                      </p>
                                      <p className="truncate text-sm text-neutral-600">
                                        {p.email}
                                      </p>
                                      <div className="mt-1 flex flex-wrap gap-2">
                                        <span className="rounded bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-700">
                                          {p.facultyid}
                                        </span>
                                        <span className="truncate rounded bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-700">
                                          {p.department}
                                        </span>
                                      </div>
                                    </div>
                                  </li>
                                ),
                              )}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-xl border border-neutral-200 bg-white p-12 text-center shadow-lg md:col-span-2 xl:col-span-3">
              {" "}
              {/* Centered in grid */}
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
                <Calendar className="text-neutral-400" size={32} />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-neutral-900">
                No meetings scheduled
              </h3>
              <p className="mb-4 text-lg text-neutral-600">
                Start by scheduling a new meeting to see it listed here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Edit Meeting Modal (Dedicated, styled as requested) */}
      {editModalOpen && editForm.id && (
        <div className="bg-opacity-70 fixed inset-0 z-50 flex items-center justify-center bg-neutral-100 p-4">
          <div className="relative mx-auto flex max-h-[95vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-[0px_4px_16px_rgba(17,17,26,0.1),0px_8px_24px_rgba(17,17,26,0.1),0px_16px_56px_rgba(17,17,26,0.1)]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-200 p-5 lg:p-6">
              <h2 className="text-2xl font-bold text-neutral-900 lg:text-3xl">
                Edit Meeting Details
              </h2>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                aria-label="Close"
                className="rounded-full p-1 text-neutral-500 transition hover:scale-110 hover:text-red-600 focus:ring-2 focus:ring-red-300 focus:outline-none active:scale-90"
              >
                <X size={28} />
              </button>
            </div>

            {/* Main Form Content */}
            <form
              onSubmit={handleEditSave}
              id="edit-meeting-form"
              className="h-full flex-grow overflow-y-auto p-5 lg:p-8"
            >
              {editError && (
                <div
                  className="mb-4 flex items-center justify-center gap-2 rounded-lg bg-red-100/80 p-3 text-center text-lg font-bold text-red-700"
                  role="alert"
                >
                  <AlertCircle size={24} />
                  <span>{editError}</span>
                </div>
              )}
              {editSuccess && (
                <div
                  className="mb-4 flex items-center justify-center gap-2 rounded-lg bg-green-100/80 p-3 text-center text-lg font-bold text-green-700"
                  role="status"
                >
                  <CheckCircle size={24} />
                  <span>Meeting updated successfully!</span>
                </div>
              )}

              <div className="flex flex-col space-y-6">
                {" "}
                {/* Consistent spacing */}
                <div>
                  <label
                    htmlFor="editMeetingTitle"
                    className="mb-1 block text-sm font-medium text-neutral-700"
                  >
                    Meeting Title<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="editMeetingTitle"
                    name="meetingTitle"
                    value={editForm.meetingTitle}
                    onChange={handleEditFormChange}
                    required
                    aria-required="true"
                    className="w-full rounded-lg border border-neutral-300 px-4 py-2 text-neutral-900 shadow-sm transition-all focus:ring-2 focus:ring-neutral-500 focus:outline-none"
                    placeholder="E.g., Team Stand-up, Project X Review"
                  />
                </div>
                <div>
                  <label
                    htmlFor="editMeetingDescription"
                    className="mb-1 block text-sm font-medium text-neutral-700"
                  >
                    Description<span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="editMeetingDescription"
                    name="meetingDescription"
                    value={editForm.meetingDescription}
                    onChange={handleEditFormChange}
                    required
                    aria-required="true"
                    rows="4"
                    className="min-h-[100px] w-full resize-y rounded-lg border border-neutral-300 px-4 py-2 text-neutral-900 shadow-sm transition-all focus:ring-2 focus:ring-neutral-500 focus:outline-none"
                    placeholder="Brief overview of the meeting agenda, key topics..."
                  ></textarea>
                </div>
                <div>
                  <label
                    htmlFor="editMeetingOrganizer"
                    className="mb-1 block text-sm font-medium text-neutral-700"
                  >
                    Organizer Name<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="editMeetingOrganizer"
                    name="meetingOrganizer"
                    value={editForm.meetingOrganizer}
                    onChange={handleEditFormChange}
                    required
                    aria-required="true"
                    className="w-full rounded-lg border border-neutral-300 px-4 py-2 text-neutral-900 shadow-sm transition-all focus:ring-2 focus:ring-neutral-500 focus:outline-none"
                    placeholder="Your Name (e.g., John Doe)"
                  />
                </div>
                <div>
                  <label
                    htmlFor="editMeetingLocation"
                    className="mb-1 block text-sm font-medium text-neutral-700"
                  >
                    Meeting Location<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="editMeetingLocation"
                    name="meetingLocation"
                    value={editForm.meetingLocation}
                    onChange={handleEditFormChange}
                    required
                    aria-required="true"
                    className="w-full rounded-lg border border-neutral-300 px-4 py-2 text-neutral-900 shadow-sm transition-all focus:ring-2 focus:ring-neutral-500 focus:outline-none"
                    placeholder="e.g., Conference Room A / Google Meet Link"
                  />
                </div>
                <div>
                  <label
                    htmlFor="editMeetingDate"
                    className="mb-1 block text-sm font-medium text-neutral-700"
                  >
                    Choose a Date<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="editMeetingDate"
                    name="meetingDate"
                    value={editForm.meetingDate}
                    onChange={handleEditFormChange}
                    required
                    aria-required="true"
                    className="w-full rounded-lg border border-neutral-300 px-4 py-2 text-neutral-900 shadow-sm transition-all focus:ring-2 focus:ring-neutral-500 focus:outline-none"
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="editMeetingStart"
                      className="mb-1 block text-sm font-medium text-neutral-700"
                    >
                      Start Time<span className="text-red-500">*</span>
                    </label>
                    <select
                      id="editMeetingStart"
                      name="meetingStart"
                      value={editForm.meetingStart}
                      onChange={(e) =>
                        handleEditTimeChange("meetingStart", e.target.value)
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
                      htmlFor="editMeetingFinish"
                      className="mb-1 block text-sm font-medium text-neutral-700"
                    >
                      End Time<span className="text-red-500">*</span>
                    </label>
                    <select
                      id="editMeetingFinish"
                      name="meetingFinish"
                      value={editForm.meetingFinish}
                      onChange={(e) =>
                        handleEditTimeChange("meetingFinish", e.target.value)
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
              </div>
            </form>
            {/* Modal Footer */}
            <div className="flex flex-col-reverse justify-end gap-3 border-t border-neutral-200 p-5 sm:flex-row lg:p-6">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="w-full rounded-xl bg-neutral-200 px-6 py-3 text-lg font-semibold text-neutral-700 shadow transition-all duration-300 hover:scale-[1.02] hover:bg-neutral-300 active:scale-95 sm:w-auto"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="edit-meeting-form"
                disabled={editLoading}
                className="w-full rounded-xl bg-blue-600 px-6 py-3 text-xl font-bold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:bg-blue-700 focus:ring-2 focus:ring-neutral-200 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {editLoading ? "Updating..." : "Update Meeting"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Table Modal (Top-tier UX, 85rem width) */}
      {actionModalOpen && actionMeetingData && (
        <div className="bg-opacity-70 fixed inset-0 z-50 flex items-center justify-center bg-neutral-100 p-4">
          <div className="relative mx-auto flex h-[95vh] w-full max-w-[85rem] flex-col rounded-2xl bg-white shadow-[0px_4px_16px_rgba(17,17,26,0.1),0px_8px_24px_rgba(17,17,26,0.1),0px_16px_56px_rgba(17,17,26,0.1)]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-200 p-5 lg:p-6">
              <h2 className="text-2xl font-bold text-neutral-900 lg:text-3xl">
                Action Table: {actionMeetingData.meetingDetails.title}
              </h2>
              <button
                type="button"
                onClick={() => setActionModalOpen(false)}
                aria-label="Close"
                className="rounded-full p-1 text-neutral-500 transition hover:scale-110 hover:text-red-600 focus:ring-2 focus:ring-red-300 focus:outline-none active:scale-90"
              >
                <X size={28} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="grow overflow-y-auto p-5 lg:p-8">
              {actionMessage.text && (
                <div
                  className={`mb-6 flex items-center justify-center gap-2 rounded-lg p-4 text-center text-lg font-bold ${
                    actionMessage.type === "success"
                      ? "bg-green-100/80 text-green-700"
                      : "bg-red-100/80 text-red-700"
                  }`}
                  role={actionMessage.type === "error" ? "alert" : "status"}
                >
                  {actionMessage.type === "success" ? (
                    <CheckCircle size={24} />
                  ) : (
                    <AlertCircle size={24} />
                  )}
                  <span>{actionMessage.text}</span>
                </div>
              )}

              {/* Meeting Info Summary */}
              <div className="mb-8 grid grid-cols-1 gap-4 rounded-xl border border-neutral-200 bg-neutral-50 p-5 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-neutral-500">
                    Date
                  </span>
                  <span className="text-base font-semibold text-neutral-800">
                    {formatDate(actionMeetingData.meetingDetails.date)}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-neutral-500">
                    Time
                  </span>
                  <span className="text-base font-semibold text-neutral-800">
                    {actionMeetingData.meetingDetails.time}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-neutral-500">
                    Organizer
                  </span>
                  <span className="text-base font-semibold text-neutral-800">
                    {actionMeetingData.meetingDetails.organizer}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-neutral-500">
                    Location
                  </span>
                  <span className="text-base font-semibold text-neutral-800">
                    {actionMeetingData.meetingDetails.location}
                  </span>
                </div>
              </div>

              {/* Attendees Management */}
              <div className="mb-10 rounded-xl border border-neutral-200 bg-white p-7 shadow-lg">
                <h3 className="mb-5 text-2xl font-bold text-neutral-800">
                  Manage Attendees
                </h3>
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  {/* Current Attendees */}
                  <div>
                    <h4 className="mb-3 text-xl font-semibold text-emerald-700">
                      Currently Attending ({actionAttendees.length})
                    </h4>
                    <div className="max-h-80 overflow-y-auto rounded-lg border border-emerald-200 bg-emerald-50 p-4 shadow-inner">
                      {actionAttendees.length === 0 ? (
                        <p className="py-4 text-center text-base text-neutral-600 italic">
                          No attendees selected for this meeting.
                        </p>
                      ) : (
                        <ul className="space-y-3">
                          {actionAttendees.map((email) => {
                            const user = allUsers.find(
                              (u) => u.email === email,
                            );
                            return (
                              <li
                                key={email}
                                className="flex items-center justify-between rounded-md bg-white p-3 text-base shadow-sm"
                              >
                                <span className="font-medium text-neutral-800">
                                  {user ? user.name : email}
                                </span>
                                <button
                                  type="button"
                                  className="rounded-full bg-red-100 p-1.5 text-red-600 transition hover:bg-red-200"
                                  onClick={() => removeActionAttendee(email)}
                                  title="Remove attendee"
                                >
                                  <X size={18} />
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </div>

                  {/* Available to Add */}
                  <div>
                    <h4 className="mb-3 text-xl font-semibold text-neutral-700">
                      Available Participants to Add (
                      {
                        allUsers.filter(
                          (u) => !actionAttendees.includes(u.email),
                        ).length
                      }
                      )
                    </h4>
                    <div className="max-h-80 overflow-y-auto rounded-lg border border-neutral-200 bg-neutral-50 p-4 shadow-inner">
                      {participantsLoading && (
                        <p className="py-4 text-center text-base text-neutral-600 italic">
                          Loading participants...
                        </p>
                      )}
                      {participantsError && (
                        <p className="py-4 text-center text-base text-red-600">
                          Error loading: {participantsError}
                        </p>
                      )}
                      {!participantsLoading &&
                        !participantsError &&
                        allUsers.filter(
                          (u) => !actionAttendees.includes(u.email),
                        ).length === 0 && (
                          <p className="py-4 text-center text-base text-neutral-600 italic">
                            All eligible participants are already attending or
                            no other users found.
                          </p>
                        )}
                      {!participantsLoading && !participantsError && (
                        <ul className="space-y-3">
                          {allUsers
                            .filter((u) => !actionAttendees.includes(u.email))
                            .map((user) => (
                              <li
                                key={user.email}
                                className="flex items-center justify-between rounded-md bg-white p-3 text-base shadow-sm"
                              >
                                <span className="font-medium text-neutral-800">
                                  {user.name} ({user.email})
                                </span>
                                <button
                                  type="button"
                                  className="rounded-full bg-green-100 p-1.5 text-green-600 transition hover:bg-green-200"
                                  onClick={() => addActionAttendee(user.email)}
                                  title="Add participant"
                                >
                                  <Check size={18} />
                                </button>
                              </li>
                            ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
                {actionAttendeesChanged && (
                  <div className="mt-8 flex justify-end">
                    <button
                      type="button"
                      className="w-full rounded-xl bg-blue-600 px-8 py-3 text-lg font-bold text-white shadow-lg transition hover:scale-[1.02] hover:bg-blue-700 focus:ring-2 focus:ring-neutral-200 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                      onClick={handleUpdateActionAttendees}
                    >
                      Save Attendee Changes
                    </button>
                  </div>
                )}
              </div>

              {/* Action Items Table */}
              <div className="mb-10 rounded-xl border border-neutral-200 bg-white p-7 shadow-lg">
                <h3 className="mb-5 text-2xl font-bold text-neutral-800">
                  Action Items
                </h3>
                <div className="overflow-x-auto rounded-lg border border-neutral-200">
                  <table className="w-full min-w-[900px] table-auto">
                    {" "}
                    {/* Increased min-width for spaciousness */}
                    <thead>
                      <tr className="bg-neutral-100 text-left text-sm font-semibold text-neutral-700 uppercase">
                        <th className="w-[25%] px-5 py-4">Action Item</th>{" "}
                        {/* Column widths */}
                        <th className="w-[20%] px-5 py-4">Responsible</th>
                        <th className="w-[15%] px-5 py-4">Deadline</th>
                        <th className="w-[15%] px-5 py-4">Status</th>
                        <th className="w-[20%] px-5 py-4">
                          Description / Note
                        </th>
                        <th className="w-[5%] px-5 py-4"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {actionItems.map((action, idx) => {
                        const responsibleUser = allUsers.find(
                          (u) => u.email === action.responsible,
                        );
                        return (
                          <tr
                            key={idx}
                            className="border-t border-neutral-100 last:border-b-0 even:bg-neutral-50 hover:bg-neutral-100"
                          >
                            <td className="px-5 py-4">
                              <input
                                type="text"
                                value={action.item}
                                onChange={(e) =>
                                  handleActionItemChange(
                                    idx,
                                    "item",
                                    e.target.value,
                                  )
                                }
                                className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-base text-neutral-900 shadow-sm focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200 focus:outline-none"
                                placeholder="e.g., Update syllabus"
                              />
                            </td>
                            <td className="relative px-5 py-4">
                              <button
                                type="button"
                                className="flex w-full items-center justify-between rounded-lg border border-neutral-300 bg-white px-4 py-2 text-base text-neutral-900 shadow-sm transition hover:shadow-md focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200 focus:outline-none"
                                onClick={() => toggleResponsibleDropdown(idx)}
                                aria-expanded={responsibleDropdownOpen[idx]}
                              >
                                {responsibleUser
                                  ? responsibleUser.name
                                  : action.responsible || "Select Responsible"}
                                {responsibleDropdownOpen[idx] ? (
                                  <ChevronUp size={18} />
                                ) : (
                                  <ChevronDown size={18} />
                                )}
                              </button>
                              {responsibleDropdownOpen[idx] && (
                                <div
                                  ref={(el) =>
                                    (responsibleDropdownRef.current[idx] = el)
                                  }
                                  className="absolute right-0 left-0 z-10 mt-2 max-h-48 overflow-y-auto rounded-lg border border-neutral-300 bg-white shadow-lg"
                                >
                                  <div
                                    className="cursor-pointer px-4 py-2 text-base text-neutral-700 transition hover:bg-neutral-100"
                                    onClick={() => selectResponsible(idx, "")}
                                  >
                                    None
                                  </div>
                                  {allUsers.map((user) => (
                                    <div
                                      key={user.email}
                                      className={`cursor-pointer px-4 py-2 text-base text-neutral-700 transition hover:bg-neutral-100 ${
                                        actionAttendees.includes(user.email)
                                          ? "bg-neutral-100 font-medium"
                                          : ""
                                      }`}
                                      onClick={() =>
                                        selectResponsible(idx, user.email)
                                      }
                                    >
                                      {user.name} ({user.email}){" "}
                                      {actionAttendees.includes(user.email) && (
                                        <span className="ml-2 text-emerald-600">
                                          ★
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="px-5 py-4">
                              <input
                                type="date"
                                value={action.deadline}
                                onChange={(e) =>
                                  handleActionItemChange(
                                    idx,
                                    "deadline",
                                    e.target.value,
                                  )
                                }
                                className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-base text-neutral-900 shadow-sm focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200 focus:outline-none"
                              />
                            </td>
                            <td className="px-5 py-4">
                              <select
                                value={action.status}
                                onChange={(e) =>
                                  handleActionItemChange(
                                    idx,
                                    "status",
                                    e.target.value,
                                  )
                                }
                                className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-base text-neutral-900 shadow-sm focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200 focus:outline-none"
                              >
                                <option value="Open">🟢 Open</option>
                                <option value="Closed">🔴 Closed</option>
                              </select>
                            </td>
                            <td className="px-5 py-4">
                              <textarea
                                value={action.description}
                                onChange={(e) =>
                                  handleActionItemChange(
                                    idx,
                                    "description",
                                    e.target.value,
                                  )
                                }
                                rows="2"
                                className="w-full resize-y rounded-lg border border-neutral-300 bg-white px-4 py-2 text-base text-neutral-900 shadow-sm focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200 focus:outline-none"
                                placeholder="Add point, remark, discussion"
                              ></textarea>
                            </td>
                            <td className="px-5 py-4 text-center">
                              <button
                                type="button"
                                className="p-1 text-red-500 transition hover:text-red-700"
                                onClick={() => removeActionItem(idx)}
                                title="Remove Action Item"
                              >
                                <MinusCircle size={22} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {actionItems.length === 0 && (
                        <tr>
                          <td
                            colSpan="6"
                            className="py-6 text-center text-base text-neutral-500"
                          >
                            No action items added yet. Click "Add Action Item"
                            to start.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <button
                  type="button"
                  className="mt-6 flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-lg font-bold text-white shadow-lg transition hover:scale-[1.02] hover:bg-violet-700 focus:ring-2 focus:ring-neutral-200"
                  onClick={addActionItem}
                >
                  <PlusCircle size={22} /> Add Action Item
                </button>
                {actionItemsChanged && (
                  <div className="mt-8 flex justify-end">
                    <button
                      type="button"
                      className="w-full rounded-xl bg-blue-600 px-8 py-3 text-lg font-bold text-white shadow-lg transition hover:scale-[1.02] hover:bg-blue-700 focus:ring-2 focus:ring-neutral-200 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                      onClick={handleSaveActionItems}
                    >
                      Save Action Item Changes
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer (Consistent with main modals) */}
            <div className="flex flex-col-reverse justify-end gap-3 border-t border-neutral-200 p-5 sm:flex-row lg:p-6">
              <button
                type="button"
                onClick={() => setActionModalOpen(false)}
                className="w-full rounded-xl bg-neutral-200 px-6 py-3 text-lg font-semibold text-neutral-700 shadow transition-all duration-300 hover:scale-[1.02] hover:bg-neutral-300 active:scale-95 sm:w-auto"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AllMeetingWithParticipants;
