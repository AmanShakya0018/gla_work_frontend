import './index.css';
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
// import Temp from './components/temp';
import Homepage from './components/redux/homepage';
import ShowMeetings from './components/show_meetings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/today-meetings" element={<ShowMeetings />} />
        {/* <Route path="/meetings" element={<Temp />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;