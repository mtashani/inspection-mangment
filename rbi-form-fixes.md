# RBI Configuration Form Fixes

## Overview of Changes

Several issues with the RBI Configuration form in the PSV Settings page have been addressed to improve the user interface and ensure proper functionality according to business requirements.

## Issues Fixed

### 1. Active Checkbox Styling
- **Problem**: The active checkbox had an oversized border compared to other form elements
- **Solution**: Removed the border and shadow styling, replacing it with a simpler flex layout that maintains proper alignment

### 2. Fixed Interval for Level 1
- **Problem**: Level 1 RBI should not use fixed intervals but database frequencies
- **Solution**: 
  - Removed the Fixed Interval field for Level 1 configurations
  - Added an informational message explaining that Level 1 uses database values
  - Only display Fixed Interval field for Levels 2-4

### 3. Test Thresholds for Level 1
- **Problem**: Test Thresholds are not applicable for Level 1 RBI calculations
- **Solution**:
  - Removed the Test Thresholds tab for Level 1
  - Conditionally render the tab only for Levels 2-4
  - Applied conditional rendering to TabsTrigger and TabsContent

### 4. Form Reset Issues
- **Problem**: Form wasn't properly updating when a new configuration was selected
- **Solution**:
  - Added a formKey state to force component re-rendering
  - Implemented useEffect hook to properly reset form with new values
  - Added detailed logging to track state changes

## Code Changes

### 1. Active Checkbox Styling
```tsx
<FormItem>
  <div className="flex items-center justify-between">
    <div>
      <FormLabel>Active</FormLabel>
      <FormDescription>
        Enable this configuration for use
      </FormDescription>
    </div>
    <FormControl>
      <Checkbox
        checked={field.value}
        onCheckedChange={field.onChange}
      />
    </FormControl>
  </div>
</FormItem>
```

### 2. Fixed Interval for Level 1
```tsx
{/* For Level 1, show info message about database frequencies */}
{form.watch("level") === 1 && (
  <div className="rounded-md bg-blue-50 p-4">
    <div className="flex">
      <div className="flex-shrink-0">
        <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
        </svg>
      </div>
      <div className="ml-3 flex-1">
        <p className="text-sm text-blue-700">
          For Level 1, calibration frequencies are based on database values rather than fixed intervals.
        </p>
      </div>
    </div>
  </div>
)}

{/* Only show fixed interval for Levels > 1 */}
{form.watch("level") > 1 && (
  <FormField
    control={form.control}
    name="settings.fixed_interval"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Fixed Interval (months)</FormLabel>
        <FormControl>
          <Input
            type="number"
            min={1}
            placeholder="60"
            {...field}
            onChange={(e) => field.onChange(parseInt(e.target.value))}
          />
        </FormControl>
        <FormDescription>
          Default calibration interval in months
        </FormDescription>
        <FormMessage />
      </FormItem>
    )}
  />
)}
```

### 3. Test Thresholds for Level 1
```tsx
<TabsList className="mb-4">
  <TabsTrigger value="general">General</TabsTrigger>
  {/* Only show Test Thresholds tab for level 2 and above */}
  {form.watch("level") >= 2 && (
    <TabsTrigger value="thresholds">Test Thresholds</TabsTrigger>
  )}
  {form.watch("level") >= 3 && (
    <TabsTrigger value="weights">Parameter Weights</TabsTrigger>
  )}
  {form.watch("level") === 4 && (
    <TabsTrigger value="risk">Risk Matrix</TabsTrigger>
  )}
</TabsList>

{/* Only show Test Thresholds tab content for level 2 and above */}
{form.watch("level") >= 2 && (
  <TabsContent value="thresholds" className="space-y-4">
    {/* Tab content... */}
  </TabsContent>
)}
```

### 4. Form Reset Functionality
```tsx
const [formKey, setFormKey] = useState<number>(0); // Add a key to force re-render

// Reset form when initialData changes
useEffect(() => {
  console.log("RBI form initialData changed:", initialData);
  if (initialData) {
    // Reset form with new values
    form.reset(initialData);
  } else {
    // Reset to default values
    form.reset(defaultValues);
  }
  // Increment key to force re-render
  setFormKey(prev => prev + 1);
}, [initialData, form]);

return (
  <Form {...form} key={formKey}>
    {/* Form content... */}
  </Form>
);
```

## Business Logic Explanation

1. **RBI Level Logic**:
   - Level 1: Uses database frequencies, no fixed intervals or test thresholds
   - Level 2: Uses fixed intervals and test thresholds
   - Level 3: Adds parameter weights
   - Level 4: Adds risk matrix configuration

2. **Form Visibility**:
   - UI elements dynamically appear/disappear based on the selected RBI level
   - This ensures users only see relevant fields for their selected level
   - Lower levels have simpler interfaces with fewer configuration options

## Testing

To verify that the fixes work correctly:

1. Select different RBI levels (1-4) and confirm:
   - Level 1 shows no Fixed Interval field, but shows an info message
   - Level 1 has no Test Thresholds tab
   - Level 2 shows Fixed Interval field and Test Thresholds tab
   - Level 3 adds Parameter Weights tab
   - Level 4 adds Risk Matrix tab

2. Test form reset functionality:
   - Click different configurations in the list
   - Confirm form values update immediately
   - Verify all fields correctly show the selected configuration's values

3. Test form submission:
   - Make changes to a configuration and save
   - Confirm changes are properly saved to the database
   - Verify changes persist after page reload