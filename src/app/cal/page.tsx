"use client"

import { FC, useState, useRef, useEffect } from 'react'
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
import {addDays} from 'date-fns/addDays'
import {addWeeks} from 'date-fns/addWeeks'
import {addMonths} from 'date-fns/addMonths'

import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import './calendar.css'

// Type for our heatmap data
type HeatmapData = number[][];

// Recurrence options
type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly';

// Extended Event type with custom properties
interface CalendarEvent extends CalendarEventType {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  recurrence?: {
    type: RecurrenceType;
    interval: number;
    until: Date | null;
  };
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
  recurrenceType: RecurrenceType;
  recurrenceInterval: number;
  recurrenceUntil: string;
}

const App: FC = () => {
  // Use a ref to generate unique IDs for events
  const eventIdCounter = useRef(0);
  
  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: String(eventIdCounter.current++),
      title: 'Learn cool stuff',
      description: 'Initial calendar setup',
      start,
      end,
    },
  ]);
  
  // Initialize heatmap data: 7 days x 24 hours with random values 0-10
  const [heatmapData, setHeatmapData] = useState<HeatmapData>(() => {
    return Array(7).fill(0).map(() => 
      Array(24).fill(0).map(() => Math.floor(Math.random() * 11))
    );
  });

  // State to track if we're in "add event" mode or "update heatmap" mode
  const [interactionMode, setInteractionMode] = useState<'heatmap' | 'event'>('heatmap');
  
  // Event form state
  const [eventForm, setEventForm] = useState<EventFormState>({
    isOpen: false,
    isNewEvent: true,
    event: null,
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    recurrenceType: 'none',
    recurrenceInterval: 1,
    recurrenceUntil: '',
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
    // Get the element that contains this date
    const hour = getHours(date);
    const day = getDayOfWeek(date);
    
    // Skip applying heat values to time gutter cells
    // Time gutter cells don't have a valid day (they're not associated with a specific day)
    if (day < 0 || day > 6) {
      return {};
    }
    
    const heatValue = heatmapData[day][hour];
    
    return {
      className: 'heatmap-cell',
      'data-heat': heatValue
    };
  };
  
  // Function to update a specific cell's heat value
  const updateHeatValue = (day: number, hour: number, value: number) => {
    const newHeatmapData = [...heatmapData];
    newHeatmapData[day][hour] = Math.min(10, Math.max(0, value)); // Clamp between 0-10
    setHeatmapData(newHeatmapData);
  };
  
  // Handle slot selection based on current interaction mode
  const handleSelectSlot = (slotInfo: SlotInfo) => {
    const start = new Date(slotInfo.start);
    
    if (interactionMode === 'heatmap') {
      // Update heatmap when in heatmap mode
      const hour = getHours(start);
      const day = getDayOfWeek(start);
      updateHeatValue(day, hour, heatmapData[day][hour] + 1);
    } else {
      // Open event form for new event
      const end = new Date(slotInfo.end);
      
      const newEvent: CalendarEvent = {
        id: String(eventIdCounter.current++),
        title: '',
        description: '',
        start,
        end,
      };
      
      openEventForm(newEvent, true);
    }
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
      recurrenceType: event.recurrence?.type || 'none',
      recurrenceInterval: event.recurrence?.interval || 1,
      recurrenceUntil: event.recurrence?.until ? format(event.recurrence.until, 'yyyy-MM-dd') : '',
    });
  };
  
  // Close event form
  const closeEventForm = () => {
    setEventForm(prev => ({ ...prev, isOpen: false }));
  };
  
  // Handle event selection (for editing)
  const handleSelectEvent = (event: object, e: React.SyntheticEvent<HTMLElement>) => {
    // Cast the event to CalendarEvent type
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
    
    // Create recurrence object if applicable
    let recurrence = undefined;
    if (eventForm.recurrenceType !== 'none') {
      recurrence = {
        type: eventForm.recurrenceType,
        interval: Number(eventForm.recurrenceInterval),
        until: eventForm.recurrenceUntil ? new Date(eventForm.recurrenceUntil) : null,
      };
    }
    
    // Create updated event
    const updatedEvent: CalendarEvent = {
      ...eventForm.event,
      title: eventForm.event.title,
      description: eventForm.event.description,
      start: startDateTime,
      end: endDateTime,
      recurrence,
    };
    
    if (eventForm.isNewEvent) {
      // Add new event
      setEvents(prev => [...prev, updatedEvent]);
      
      // Generate recurring events if applicable
      if (recurrence) {
        const recurringEvents = generateRecurringEvents(updatedEvent);
        setEvents(prev => [...prev, ...recurringEvents]);
      }
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
  
  // Generate recurring events based on recurrence pattern
  const generateRecurringEvents = (baseEvent: CalendarEvent): CalendarEvent[] => {
    if (!baseEvent.recurrence || baseEvent.recurrence.type === 'none') {
      return [];
    }
    
    const { type, interval, until } = baseEvent.recurrence;
    const recurringEvents: CalendarEvent[] = [];
    
    // Calculate the duration of the event
    const duration = baseEvent.end.getTime() - baseEvent.start.getTime();
    
    // Set a reasonable limit for recurring events (e.g., 1 year or until the specified date)
    const maxDate = until || addMonths(baseEvent.start, 12);
    let currentDate = baseEvent.start;
    
    // Generate recurring events
    while (true) {
      // Calculate next occurrence based on recurrence type
      let nextDate: Date;
      
      switch (type) {
        case 'daily':
          nextDate = addDays(currentDate, interval);
          break;
        case 'weekly':
          nextDate = addWeeks(currentDate, interval);
          break;
        case 'monthly':
          nextDate = addMonths(currentDate, interval);
          break;
        default:
          return recurringEvents;
      }
      
      // Stop if we've reached the end date
      if (nextDate > maxDate) {
        break;
      }
      
      // Create the recurring event
      const nextEndDate = new Date(nextDate.getTime() + duration);
      
      const recurringEvent: CalendarEvent = {
        ...baseEvent,
        id: String(eventIdCounter.current++),
        start: nextDate,
        end: nextEndDate,
        // Mark as a recurring instance
        title: `${baseEvent.title} (recurring)`,
      };
      
      recurringEvents.push(recurringEvent);
      currentDate = nextDate;
    }
    
    return recurringEvents;
  };

  return (
    <div className="calendar-container" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="controls" style={{ marginBottom: '15px' }}>
        <div className="mode-selector" style={{ marginBottom: '10px' }}>
          <label style={{ marginRight: '10px' }}>Interaction Mode:</label>
          <button 
            onClick={() => setInteractionMode('heatmap')}
            style={{ 
              padding: '5px 10px', 
              marginRight: '10px',
              backgroundColor: interactionMode === 'heatmap' ? '#007bff' : '#f8f9fa',
              color: interactionMode === 'heatmap' ? 'white' : 'black',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          >
            Update Heatmap
          </button>
          <button 
            onClick={() => setInteractionMode('event')}
            style={{ 
              padding: '5px 10px',
              backgroundColor: interactionMode === 'event' ? '#007bff' : '#f8f9fa',
              color: interactionMode === 'event' ? 'white' : 'black',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          >
            Add Events
          </button>
        </div>
        <div className="instructions" style={{ fontSize: '0.9em', color: '#666' }}>
          {interactionMode === 'heatmap' 
            ? 'Click on time slots to increase heat intensity' 
            : 'Click and drag to create events. Click on events to edit them.'}
        </div>
      </div>
      
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
              
              <div className="form-group">
                <label htmlFor="recurrenceType">Recurrence</label>
                <select
                  id="recurrenceType"
                  name="recurrenceType"
                  value={eventForm.recurrenceType}
                  onChange={handleFormChange}
                >
                  <option value="none">None</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              
              {eventForm.recurrenceType !== 'none' && (
                <>
                  <div className="form-group">
                    <label htmlFor="recurrenceInterval">Repeat every</label>
                    <input
                      type="number"
                      id="recurrenceInterval"
                      name="recurrenceInterval"
                      min="1"
                      max="30"
                      value={eventForm.recurrenceInterval}
                      onChange={handleFormChange}
                    />
                    <span> {eventForm.recurrenceType === 'daily' ? 'days' : 
                           eventForm.recurrenceType === 'weekly' ? 'weeks' : 'months'}</span>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="recurrenceUntil">Until</label>
                    <input
                      type="date"
                      id="recurrenceUntil"
                      name="recurrenceUntil"
                      value={eventForm.recurrenceUntil}
                      onChange={handleFormChange}
                    />
                  </div>
                </>
              )}
              
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
//@ts-ignore
const DnDCalendar = withDragAndDrop(Calendar)

export default App