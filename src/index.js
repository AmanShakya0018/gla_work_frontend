import express from 'express';  
const router = express.Router();    
import { Saveindb } from '../methods/save_in_db_temp_handler.js';
import { meetingResponseHandler } from '../methods/meeting_response_handler.js';
import { sendMailHandler } from '../methods/send_mail_handler.js';
import { getMeetingdata } from '../methods/get_yes_no.js';
import { scheduleMeetingHandler } from '../methods/schedule_meeting_handler.js';
import { getAllMeetings } from '../methods/get_all_meetings.js';
import { Provider } from 'react-redux';
import store from './components/redux/store.js';

router.put('/save-users', Saveindb); //temp_routes to save users in db ones
router.post('/send-mails',sendMailHandler)
router.get('/meeting-response', meetingResponseHandler); // yes/no response handler hai ye jo db me update krta hai 
router.get('/meeting-yes-no', getMeetingdata)  

router.put('/schedule-meeting',scheduleMeetingHandler)
router.get('/getall-meetings',getAllMeetings)        


export default router;

<Provider store={store}>
    <App />
</Provider>