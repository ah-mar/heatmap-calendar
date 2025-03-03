"use client"

import { Calendar, dayjsLocalizer } from 'react-big-calendar';
import dayjs from 'dayjs';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useState } from 'react';

// Setup the localizer by providing the dayjs Object
// to the correct localizer.
const localizer = dayjsLocalizer(dayjs);


function MyCalendar() {
  const [events, setEvents] = useState([
    {
      title: "Meeting with John",
      start: dayjs().toDate(),  // Convert dayjs object to Date
      end: dayjs().add(30, 'minutes').toDate(), // Convert dayjs object to Date
      allDay: false, // Ensure it's not marked as all-day unless intended.      
    },
        {
            title: "Lunch Break",
            start: dayjs().add(1,'hour').toDate(),
            end: dayjs().add(1,'hour').add(45,'minutes').toDate(),
        },
        {
            title: "Doctor Appt",
            start: dayjs().add(2,'day').toDate(),
            end: dayjs().add(2,'day').add(1,'hour').toDate()
        },
        {
            title: "Vacation",
            start: dayjs().add(7, 'days').toDate(),
            end: dayjs().add(10, 'days').toDate()
        },

  ]);

  return (
    <div>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
            titleAccessor='title' //add title accessor
        views={['month','week','day']} //available views
        step={60} //60 minutes for each slot
        timeslots={1} //number of slots
      />
    </div>
  );
}

export default MyCalendar;