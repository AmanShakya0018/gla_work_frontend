import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';  



// Add this thunk for fetching all participants
export const fetchAllParticipants = createAsyncThunk(
    'meeting/fetchAllParticipants',
    async () => {
        const response = await axios.get('http://localhost:4000/api/getallusers');
        return response.data;
    }
);



export const fetchAllMeetings = createAsyncThunk(   
    'meeting/fetchAllMeetings', 
    async () => {   
        const response = await axios.get('http://localhost:4000/api/meeting-yes-no'); 
        return response.data;
    }
);

const meetingSlice = createSlice({
    name: 'meeting',
    initialState: {
        meetings: [],
        participants: [], // added participants state
        allmeetings : [],   
        meetings: [],
        loading: false,
        error: null,
    },
    reducers: {
        setMeetings(state, action) {
            state.meetings = action.payload;
        },
        setLoading(state, action) {
            state.loading = action.payload;
        },
        setError(state, action) {
            state.error = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAllMeetings.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAllMeetings.fulfilled, (state, action) => {
                state.loading = false;
                state.meetings = action.payload.meetings; // <-- fix: use .meetings
            })
            .addCase(fetchAllMeetings.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            // Add handlers for fetchAllParticipants
            .addCase(fetchAllParticipants.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAllParticipants.fulfilled, (state, action) => {
                state.loading = false;
                state.participants = action.payload;
            })
            .addCase(fetchAllParticipants.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            });
    }
});

export const { setMeetings, setLoading, setError } = meetingSlice.actions;
export default meetingSlice.reducer;
