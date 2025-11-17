import { configureStore } from '@reduxjs/toolkit';
import meetingReducer from './meetingSlice.js';

const store = configureStore({
    reducer: {
        meeting: meetingReducer
    }
});

export default store;
