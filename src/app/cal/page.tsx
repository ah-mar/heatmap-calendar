"use client"

import { FC, useState, useRef } from 'react'
import { Calendar, dateFnsLocalizer, Event as CalendarEventType, SlotInfo } from 'react-big-calendar'
import withDragAndDrop, { withDragAndDropProps } from 'react-big-calendar/lib/addons/dragAndDrop'
import {format} from 'date-fns/format'
import {parse} from 'date-fns/parse'
import {startOfWeek} from 'date-fns/startOfWeek'
import {getDay} from 'date-fns/getDay'
import {enUS} from 'date-fns/locale/en-US'
import {addHours} from 'date-fns/addHours'
import {startOfHour} from 'date-fns/startOfHour'
import {getHours} from 'date-fns/getHours'
import {getDay as getDayOfWeek} from 'date-fns/getDay'

import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import './calendar.css'

// Type for our heatmap data
type HeatmapData = number[][];



// Extended Event type with custom properties
interface CalendarEvent extends CalendarEventType {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
}

// Event form state
interface EventFormState {
  isOpen: boolean;
  isNewEvent: boolean;
  event: CalendarEvent | null;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
}

const heatmapData: HeatmapData = Array(7).fill(0).map(() => 
  Array(24).fill(0).map(() => Math.floor((Math.random()) * 10 +1))
);

const App: FC = () => {
  // Use a ref to generate unique IDs for events
  const eventIdCounter = useRef(0);
  
  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: String(eventIdCounter.current++),
      title: 'Run Pump',
      description: 'Initial calendar setup',
      start,
      end,
    },
  ]);
  

  console.log(heatmapData);
  
  // Event form state
  const [eventForm, setEventForm] = useState<EventFormState>({
    isOpen: false,
    isNewEvent: true,
    event: null,
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
  });

  const onEventResize: withDragAndDropProps['onEventResize'] = data => {
    const { start, end, event } = data;

    setEvents(currentEvents => 
      currentEvents.map(existingEvent => 
        existingEvent.id === (event as CalendarEvent).id
          ? { ...existingEvent, start: new Date(start), end: new Date(end) }
          : existingEvent
      )
    );
  }

  const onEventDrop: withDragAndDropProps['onEventDrop'] = data => {
    const { start, end, event } = data;
    
    setEvents(currentEvents => 
      currentEvents.map(existingEvent => 
        existingEvent.id === (event as CalendarEvent).id
          ? { ...existingEvent, start: new Date(start), end: new Date(end) }
          : existingEvent
      )
    );
  }
  
  // Custom slot styling based on heatmap data
  const slotPropGetter = (date: Date) => {
    const hour = getHours(date);
    const day = getDayOfWeek(date);
    
    // Skip applying heat values to time gutter cells
    // Time gutter cells don't have a valid day (they're not associated with a specific day)
    if (day < 0 || day > 6) {
      return {};
    }
    
    // Check if the date is in the time gutter (i.e., the first column)
    // const isTimeGutter = hour === 0 && date.getMinutes() === 0; // Adjust this condition based on your calendar structure
    
    // if (isTimeGutter) {
    //   return {}; // No heatmap color for time gutter
    // }
    
    const heatValue = heatmapData[day][hour];
    
    return {
      className: 'heatmap-cell',
      'data-heat': heatValue
    };
  };
  
  // Function to update a specific cell's heat value
  // const updateHeatValue = (day: number, hour: number, value: number) => {
  //   const newHeatmapData = [...heatmapData];
  //   newHeatmapData[day][hour] = Math.min(10, Math.max(0, value)); // Clamp between 0-10
  //   setHeatmapData(newHeatmapData);
  // };
  
  // Handle slot selection based on current interaction mode
  const handleSelectSlot = (slotInfo: SlotInfo) => {
    const start = new Date(slotInfo.start);
    const end = new Date(slotInfo.end);
      
      const newEvent: CalendarEvent = {
        id: String(eventIdCounter.current++),
        title: '',
        description: '',
        start,
        end,
      };
      
      openEventForm(newEvent, true);
  };
  
  // Open event form with event data
  const openEventForm = (event: CalendarEvent, isNew: boolean) => {
    setEventForm({
      isOpen: true,
      isNewEvent: isNew,
      event: event,
      startDate: format(event.start, 'yyyy-MM-dd'),
      startTime: format(event.start, 'HH:mm'),
      endDate: format(event.end, 'yyyy-MM-dd'),
      endTime: format(event.end, 'HH:mm'),
    });
  };
  
  // Close event form
  const closeEventForm = () => {
    setEventForm(prev => ({ ...prev, isOpen: false }));
  };
  
  // Handle event selection (for editing)
  const handleSelectEvent = (event: object, e: React.SyntheticEvent<HTMLElement>) => {
    // Cast the event to CalendarEvent type
    console.log(e.target);
    const calEvent = event as CalendarEvent;
    openEventForm(calEvent, false);
  };
  
  // Handle form input changes
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEventForm(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle form submission
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!eventForm.event) return;
    
    // Parse dates and times
    const startDateTime = new Date(`${eventForm.startDate}T${eventForm.startTime}`);
    const endDateTime = new Date(`${eventForm.endDate}T${eventForm.endTime}`);
    
    const updatedEvent: CalendarEvent = {
      ...eventForm.event,
      title: eventForm.event.title,
      description: eventForm.event.description,
      start: startDateTime,
      end: endDateTime,
    };

    if (eventForm.isNewEvent) {
      // Add new event
      setEvents(prev => [...prev, updatedEvent]);
    } else {
      // Update existing event
      setEvents(prev => 
        prev.map(e => e.id === updatedEvent.id ? updatedEvent : e)
      );
    }
    
    closeEventForm();
  };
  
  // Handle event deletion
  const handleDeleteEvent = () => {
    if (!eventForm.event) return;
    
    setEvents(prev => prev.filter(e => e.id !== eventForm.event?.id));
    closeEventForm();
  };
  
  // Function to handle printing the calendar
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="calendar-container" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <button onClick={handlePrint} style={{ marginBottom: '10px' }}>
        Print Calendar
      </button>

      <DnDCalendar
        defaultView='week'
        events={events}
        localizer={localizer}
        onEventDrop={onEventDrop}
        onEventResize={onEventResize}
        resizable
        style={{ height: 'calc(100vh - 120px)' }}
        slotPropGetter={slotPropGetter}
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        selectable={true}
      />
      
      {/* Event Form Modal */}
      {eventForm.isOpen && eventForm.event && (
        <div className="event-form-modal">
          <div className="event-form-content">
            <h2>{eventForm.isNewEvent ? 'Add Event' : 'Edit Event'}</h2>
            
            <form onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label htmlFor="title">Event Title</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={eventForm.event.title}
                  onChange={(e) => setEventForm(prev => ({
                    ...prev,
                    event: { ...prev.event!, title: e.target.value }
                  }))}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={eventForm.event.description || ''}
                  onChange={(e) => setEventForm(prev => ({
                    ...prev,
                    event: { ...prev.event!, description: e.target.value }
                  }))}
                  rows={3}
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="startDate">Start Date</label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={eventForm.startDate}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="startTime">Start Time</label>
                  <input
                    type="time"
                    id="startTime"
                    name="startTime"
                    value={eventForm.startTime}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="endDate">End Date</label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={eventForm.endDate}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="endTime">End Time</label>
                  <input
                    type="time"
                    id="endTime"
                    name="endTime"
                    value={eventForm.endTime}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>
              
              <div className="form-actions">
                {!eventForm.isNewEvent && (
                  <button 
                    type="button" 
                    className="delete-button"
                    onClick={handleDeleteEvent}
                  >
                    Delete
                  </button>
                )}
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={closeEventForm}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="save-button"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const locales = {
  'en-US': enUS,
}
const endOfHour = (date: Date): Date => addHours(startOfHour(date), 1)
const now = new Date()
const start = endOfHour(now)
const end = addHours(start, 2)
// The types here are `object`. Strongly consider making them better as removing `locales` caused a fatal error
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

const DnDCalendar = withDragAndDrop(Calendar)

export default App