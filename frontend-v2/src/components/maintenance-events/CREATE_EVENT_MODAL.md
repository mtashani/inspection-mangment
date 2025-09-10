# Create Event Modal Component

A beautiful, responsive maintenance event creation modal built with **shadcn/ui** components, designed specifically for the frontend-v2 architecture of the Inspection Management System.

## 🌟 Features

### ✨ **Beautiful Design & UX**
- **Modern UI**: Built with shadcn/ui components and Tailwind CSS
- **Responsive Layout**: Optimized for both desktop and mobile devices
- **Emojis & Visual Indicators**: Enhanced visual appeal with emojis in select options (🔧 Routine, ⚙️ Overhaul, etc.)
- **85vh Modal Height**: Proper modal sizing with `max-h-[85vh]` and `overflow-y-auto`
- **Compact Form Fields**: Uses `space-y-4` and `h-9` inputs for better space utilization
- **Hover Effects**: Modern button styling with `hover:bg-accent` and `rounded-md p-1` for close buttons

### 📅 **Advanced Date Range Picker**
- **Enhanced Date Range Selection**: Custom DateRangePicker component with presets
- **Smart Validation**: No past dates, end date after start date validation
- **Visual Feedback**: Shows selected duration with day count badge
- **Modal-Safe**: Proper z-index handling for modal environments (`z-[60]`)
- **Quick Presets**: Today, This Week, This Month options

### 🔍 **Smart Form Validation**
- **Real-time Validation**: Instant feedback as users type
- **Format Validation**: Event number format checking (MAINT-2025-001)
- **Required Fields**: Clear indication of mandatory fields
- **Error Messages**: User-friendly error descriptions
- **Date Logic**: Comprehensive date range validation

### 🎯 **Rich Event Configuration**
- **Multiple Event Types**: 6 different maintenance types with visual indicators
- **Priority Levels**: 4 priority levels with color coding and emojis
- **Department Selection**: All refinery departments supported
- **Live Preview**: Real-time preview of event details
- **Form Memory**: Maintains form state during session

## 🚀 Installation & Usage

### Prerequisites
Ensure these components are available in your project:
- All shadcn/ui components (Dialog, Button, Input, Select, etc.)
- Custom DateRangePicker component
- Proper TypeScript configuration
- Tailwind CSS with design tokens

### Basic Usage

```tsx
import { CreateEventModal } from '@/components/maintenance-events/create-event-modal'

function MaintenancePage() {
  const handleEventCreated = () => {
    console.log('Event created successfully!')
    // Refresh events list or show success message
  }

  return (
    <div>
      {/* Default trigger button */}
      <CreateEventModal onEventCreated={handleEventCreated} />
      
      {/* Custom trigger */}
      <CreateEventModal 
        trigger={<Button>Custom Create Button</Button>}
        onEventCreated={handleEventCreated} 
      />
    </div>
  )
}
```

### Advanced Integration

```tsx
import { CreateEventModal } from '@/components/maintenance-events/create-event-modal'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

function EventsPage() {
  const queryClient = useQueryClient()
  
  const handleEventCreated = () => {
    // Invalidate and refetch events
    queryClient.invalidateQueries(['maintenance-events'])
    
    // Show success message
    toast.success('Maintenance event created successfully!')
  }

  return (
    <CreateEventModal 
      onEventCreated={handleEventCreated}
      trigger={
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Maintenance Event
        </Button>
      }
    />
  )
}
```

## 📋 Props Interface

```tsx
interface CreateEventModalProps {
  trigger?: React.ReactNode      // Custom trigger element
  onEventCreated?: () => void   // Callback when event is created
}
```

### Prop Details

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `trigger` | `React.ReactNode` | No | Default "New Event" button | Custom trigger element |
| `onEventCreated` | `() => void` | No | `undefined` | Callback fired when event is successfully created |

## 📊 Data Structure

The modal creates events with this structure:

```tsx
interface CreateEventFormData {
  event_number: string              // Required: Format "MAINT-2025-001"
  title: string                    // Required: Event title
  description?: string             // Optional: Detailed description
  event_type: MaintenanceEventType // Required: Event type enum
  planned_start_date: string       // Required: ISO date string
  planned_end_date: string         // Required: ISO date string
  created_by?: string             // Optional: Creator name
  notes?: string                  // Optional: Additional notes
  requesting_department?: RefineryDepartment // Optional: Department enum
  priority?: 'Low' | 'Medium' | 'High' | 'Critical' // Optional: Priority level
}
```

## 🎨 Event Types & Visual Indicators

| Type | Emoji | Label | Description |
|------|-------|-------|-------------|
| `Routine` | 🔧 | Routine Maintenance | Regular scheduled maintenance |
| `Overhaul` | ⚙️ | Major Overhaul | Complete equipment overhaul |
| `Emergency` | 🚨 | Emergency Repair | Urgent repair required |
| `Preventive` | ✅ | Preventive Maintenance | Prevent future issues |
| `Corrective` | 🔨 | Corrective Maintenance | Fix existing problems |
| `Custom` | 🎯 | Custom Event | Custom maintenance task |

## 🎯 Priority Levels

| Priority | Emoji | Color | Description |
|----------|-------|-------|-------------|
| `Low` | 🟢 | Gray | Low priority task |
| `Medium` | 🟡 | Yellow | Standard priority |
| `High` | 🟠 | Orange | High priority task |
| `Critical` | 🔴 | Red | Critical/urgent task |

## ✅ Validation Rules

### Required Fields
- ✅ Event Number
- ✅ Event Title  
- ✅ Event Type
- ✅ Planned Start Date
- ✅ Planned End Date

### Format Validation
- **Event Number**: Must match pattern `XX-YYYY-XXX` (e.g., "MAINT-2025-001")
- **Dates**: Start date cannot be in the past, end date must be after start date
- **Title**: Must not be empty or only whitespace

### Business Rules
- Events can only be scheduled for future dates
- End date must be after start date
- Event numbers should follow organizational naming conventions

## 🎨 Design System Compliance

The component follows all design system requirements:

### Modal Standards
- ✅ **Height**: Uses `max-h-[85vh]` with `overflow-y-auto` for proper scrolling
- ✅ **Close Button**: `rounded-md p-1` with `hover:bg-accent` styling
- ✅ **Z-Index**: Proper layering for popover elements in modals

### Form Standards
- ✅ **Spacing**: Compact form fields with `space-y-4`
- ✅ **Input Height**: Consistent `h-9` for all input fields
- ✅ **Visual Appeal**: Enhanced with icons, emojis, and consistent styling

### Responsive Design
- ✅ **Mobile-First**: Responsive grid layouts (`grid-cols-1 md:grid-cols-2`)
- ✅ **Touch-Friendly**: Appropriate button sizes and spacing
- ✅ **Viewport Optimization**: Proper modal sizing for all screen sizes

## 🔧 Customization

### Custom Event Types
```tsx
// Extend the MaintenanceEventType enum
enum CustomMaintenanceEventType {
  Shutdown = 'Shutdown',
  Upgrade = 'Upgrade',
  Calibration = 'Calibration'
}
```

### Custom Styling
```tsx
// Override default styles
<CreateEventModal 
  trigger={
    <Button className="bg-gradient-to-r from-blue-500 to-purple-500">
      Create Event
    </Button>
  }
/>
```

### Custom Validation
The component includes comprehensive validation, but you can extend it by:

```tsx
const handleEventCreated = () => {
  // Add custom business logic validation
  // Call additional APIs
  // Update global state
}
```

## 📱 Mobile Optimization

The component is fully optimized for mobile devices:

- **Responsive Layout**: Adapts to different screen sizes
- **Touch-Friendly**: Appropriate tap targets and spacing
- **Scrollable Content**: Proper overflow handling on small screens
- **Readable Text**: Appropriate font sizes and contrast

## 🧪 Testing

### Manual Testing Checklist
- [ ] Modal opens and closes correctly
- [ ] Form validation works for all fields
- [ ] Date range picker functions properly
- [ ] Event types and priorities display correctly
- [ ] Mobile responsiveness
- [ ] Keyboard navigation
- [ ] Screen reader compatibility

### Integration Testing
```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { CreateEventModal } from './create-event-modal'

test('opens modal and creates event', async () => {
  const mockOnEventCreated = jest.fn()
  render(<CreateEventModal onEventCreated={mockOnEventCreated} />)
  
  fireEvent.click(screen.getByText('New Event'))
  // Add more test steps...
})
```

## 🚀 Performance

- **Lazy Loading**: Modal content only renders when opened
- **Optimized Re-renders**: Minimal re-rendering with proper state management
- **Memory Management**: Proper cleanup on component unmount
- **Bundle Size**: Efficient with tree-shaking support

## 🛠️ Troubleshooting

### Common Issues

1. **Date picker not appearing**
   - Ensure DateRangePicker component is properly installed
   - Check z-index conflicts in modal environments

2. **Form not submitting**
   - Verify all required fields are filled
   - Check network connectivity for API calls

3. **Styling issues**
   - Confirm Tailwind CSS configuration
   - Verify shadcn/ui theme setup

4. **TypeScript errors**
   - Ensure proper type imports
   - Check enum definitions match backend

### Debug Mode
Enable console logging to debug form submission:

```tsx
const handleEventCreated = () => {
  console.log('Event creation callback triggered')
  // Your implementation
}
```

## 📚 Related Components

- **DateRangePicker**: `/src/components/ui/date-range-picker.tsx`
- **EventsList**: Display created events
- **EventCard**: Individual event display
- **EventsHeader**: Main events page header

## 🔄 Version History

- **v1.0.0**: Initial implementation with basic form
- **v1.1.0**: Added date range picker integration
- **v1.2.0**: Enhanced visual design with emojis and icons
- **v1.3.0**: Mobile optimization and accessibility improvements
- **v1.4.0**: Validation enhancements and error handling

## 📄 License

This component is part of the Inspection Management System and follows the project's licensing terms.

---

For more information, visit the [demo page](/demo/create-event) or check the [main documentation](/docs).