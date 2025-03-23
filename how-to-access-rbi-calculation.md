# How to Access the RBI Calculation Component

The RBI Calculation component has been implemented as a **tab** in the PSV detail page. Here's how to access it:

## Steps to View RBI Calculation

1. Navigate to a PSV detail page (URL format: `/psv-layout/psv/[tag_number]`)
2. Look for the tab navigation near the top of the page
3. You should see three tabs:
   - **PSV Information** (default tab)
   - **Calibration History**
   - **RBI Calculation** ← Click this tab

![Tab Navigation Illustration](https://via.placeholder.com/800x100/f3f4f6/000000?text=PSV+Information+|+Calibration+History+|+RBI+Calculation)

## Tab Structure in the Code

The tabs are implemented in the PSV detail page:

```tsx
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList className="mb-4">
    <TabsTrigger value="info">PSV Information</TabsTrigger>
    <TabsTrigger value="calibration">Calibration History</TabsTrigger>
    <TabsTrigger value="rbi">RBI Calculation</TabsTrigger>
  </TabsList>

  <TabsContent value="info" className="space-y-4">
    <PSVInfoCard psv={psv} />
  </TabsContent>

  <TabsContent value="calibration" className="space-y-4">
    <Card className="p-4">
      <CalibrationHistory tagNumber={params.tag} />
    </Card>
  </TabsContent>

  <TabsContent value="rbi" className="space-y-4">
    <RBICalculation tagNumber={params.tag} />
  </TabsContent>
</Tabs>
```

## Troubleshooting

If you don't see the "RBI Calculation" tab:

1. **Page Route Check**: Make sure you're on the correct page (`/psv-layout/psv/[tag_number]`)
2. **Component Loading**: Check the browser console for any errors
3. **Tab Implementation**: Verify that `@radix-ui/react-tabs` is properly installed and working
4. **Component Import**: Confirm that `RBICalculation` is properly imported in the page component

## What You Should See

After clicking the "RBI Calculation" tab, you should see:

1. Information about the active RBI configuration
2. A "Calculate RBI" button
3. After clicking the button, results showing:
   - Recommended interval
   - Next calibration date
   - **Time remaining until next calibration** (months and days)
   - Risk score and category

If you're seeing a different view than what's described above, please let us know what page/route you're currently looking at so we can identify the correct location for the RBI Calculation component.