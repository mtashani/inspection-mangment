# Create Event Modal Component

A beautiful and comprehensive maintenance event creation modal built with shadcn/ui components, featuring Persian/English support, advanced form validation, and modern design patterns.

## Features

✨ **Beautiful Design**
- Modern, responsive layout with shadcn/ui components
- Smooth animations and transitions
- Professional color scheme and typography
- Mobile-friendly responsive design

📅 **Enhanced Date Range Picker**
- Built-in date range picker from shadcn/ui
- Preset date ranges for quick selection
- Date validation (no past dates, end after start)
- Visual feedback with selected duration display

🔍 **Smart Form Validation**
- Real-time validation with error messages
- Format validation for event numbers
- Required field validation
- Date logic validation

🎯 **Rich Event Configuration**
- Multiple maintenance event types with visual indicators
- Simple/Complex event categories
- Priority levels with color coding
- Department selection
- Live preview of event details

🌍 **Internationalization Ready**
- Persian/English language support
- RTL layout compatibility
- Localized date formatting

## Installation & Setup

### Prerequisites
Make sure you have the following components installed in your project:
- shadcn/ui components (Dialog, Button, Input, etc.)
- Enhanced Date Range Picker
- Form components (Label, Select, Textarea)
- Lucide React icons

### Import the Component

```tsx
import CreateEventModal, { 
  CreateMaintenanceEventRequest 
} from '@/components/maintenance/create-event-modal';
```

## Usage

### Basic Usage

```tsx
import React, { useState } from 'react';
import CreateEventModal from '@/components/maintenance/create-event-modal';

function MaintenancePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreateEvent = async (eventData: CreateMaintenanceEventRequest) => {
    try {
      // Call your API to create the event
      const response = await fetch('/api/maintenance/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      });
      
      if (response.ok) {
        console.log('Event created successfully!');
        // Refresh your events list or show success message
      }
    } catch (error) {
      console.error('Failed to create event:', error);
    }
  };

  return (
    <div>
      <button onClick={() => setIsModalOpen(true)}>
        Create New Event
      </button>

      <CreateEventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateEvent}
      />
    </div>
  );
}
```

### Advanced Usage with Custom Options

```tsx
<CreateEventModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  onSubmit={handleCreateEvent}
  availableRequesters={[
    'Operations Team Alpha',
    'Maintenance Team Beta',
    'Engineering Team Gamma'
  ]}
  availableDepartments={[
    RefineryDepartment.Operations,
    RefineryDepartment.Maintenance,
    RefineryDepartment.Engineering
  ]}
  loading={isSubmitting}
/>
```

## Props Interface

```tsx
interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (eventData: CreateMaintenanceEventRequest) => Promise<void>;
  availableRequesters?: string[];
  availableDepartments?: RefineryDepartment[];
  loading?: boolean;
}
```

### Prop Details

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | `boolean` | Yes | Controls modal visibility |
| `onClose` | `() => void` | Yes | Callback when modal is closed |
| `onSubmit` | `(data) => Promise<void>` | Yes | Handles form submission |
| `availableRequesters` | `string[]` | No | List of available requesters |
| `availableDepartments` | `RefineryDepartment[]` | No | List of available departments |
| `loading` | `boolean` | No | Shows loading state in modal |

## Data Interface

```tsx
interface CreateMaintenanceEventRequest {
  eventNumber: string;              // Required: Format like "MAINT-2025-001"
  title: string;                   // Required: Event title
  description?: string;            // Optional: Detailed description
  eventType: MaintenanceEventType; // Required: Event type enum
  eventCategory: MaintenanceEventCategory; // Simple or Complex
  plannedStartDate: string;        // Required: ISO date string
  plannedEndDate: string;          // Required: ISO date string
  createdBy?: string;             // Optional: Creator name
  notes?: string;                 // Optional: Additional notes
  requestingDepartment?: RefineryDepartment; // Optional: Department
  priority?: 'Low' | 'Medium' | 'High' | 'Critical'; // Optional: Priority
}
```

## Event Types

The modal supports the following maintenance event types:

- **OVERHAUL** - Major equipment overhaul
- **REPAIR** - Emergency repair work
- **PREVENTIVE** - Preventive maintenance
- **CORRECTIVE** - Corrective maintenance
- **INSPECTION** - Inspection events

Each type has its own visual indicator and color coding.

## Event Categories

- **Simple**: Direct maintenance without sub-events (suitable for routine work)
- **Complex**: Complex maintenance with multiple sub-events (suitable for overhauls)

## Validation Rules

### Required Fields
- Event Number
- Event Title
- Event Type
- Planned Start Date
- Planned End Date

### Format Validation
- **Event Number**: Must match pattern `XX-YYYY-XXX` (e.g., "MAINT-2025-001")
- **Dates**: Start date cannot be in the past, end date must be after start date

### Business Rules
- Events can only be scheduled for future dates
- End date must be after start date
- Event numbers should follow organizational naming conventions

## Styling & Theming

The component uses shadcn/ui design tokens and CSS variables:

```css
/* Custom styling example */
.create-event-modal {
  --primary-color: hsl(var(--primary));
  --background: hsl(var(--background));
  --foreground: hsl(var(--foreground));
}
```

## Accessibility Features

- ✅ Keyboard navigation support
- ✅ Screen reader compatibility
- ✅ Focus management
- ✅ ARIA labels and roles
- ✅ Color contrast compliance
- ✅ Reduced motion support

## Integration Examples

### With React Hook Form

```tsx
import { useForm } from 'react-hook-form';

const {
  handleSubmit,
  formState: { isSubmitting }
} = useForm<CreateMaintenanceEventRequest>();

const onSubmit = async (data: CreateMaintenanceEventRequest) => {
  await createEvent(data);
};

<CreateEventModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  onSubmit={handleSubmit(onSubmit)}
  loading={isSubmitting}
/>
```

### With Tanstack Query

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

const createEventMutation = useMutation({
  mutationFn: createMaintenanceEvent,
  onSuccess: () => {
    queryClient.invalidateQueries(['maintenance-events']);
    setIsModalOpen(false);
  }
});

<CreateEventModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  onSubmit={createEventMutation.mutate}
  loading={createEventMutation.isLoading}
/>
```

## Customization

### Custom Event Types

```tsx
// Add custom event types by extending the enum
enum CustomMaintenanceEventType {
  ROUTINE = 'ROUTINE',
  SHUTDOWN = 'SHUTDOWN',
  UPGRADE = 'UPGRADE'
}
```

### Custom Validation

The component includes built-in validation, but you can extend it:

```tsx
const handleSubmit = async (data: CreateMaintenanceEventRequest) => {
  // Custom validation
  if (data.eventType === 'OVERHAUL' && !data.notes) {
    throw new Error('Overhaul events require notes');
  }
  
  await createEvent(data);
};
```

## Demo Page

Visit `/demo/create-event` to see a live demonstration of the component with sample data and interactive examples.

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## Dependencies

- React 18+
- shadcn/ui components
- Lucide React icons
- date-fns (for date handling)
- Tailwind CSS

## Troubleshooting

### Common Issues

1. **Date picker not working**: Ensure Enhanced Date Range Picker is properly installed
2. **Validation errors**: Check that all required props are provided
3. **Styling issues**: Verify shadcn/ui theme configuration
4. **Type errors**: Ensure proper TypeScript types are imported

### Performance Tips

- Use React.memo() for parent components to prevent unnecessary re-renders
- Debounce validation for better performance
- Pre-load department and requester data

## Contributing

To contribute to this component:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request with detailed description

## License

This component is part of the Inspection Management System and follows the project's licensing terms.