"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ModeToggle } from "@/components/mode-toggle"
import { AlertCircle, CheckCircle, Info } from "lucide-react"

export default function ThemeDemoSimple() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header with Theme Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">shadcn/ui Theme Demo</h1>
          <p className="text-muted-foreground">Testing default shadcn/ui components with theme switching</p>
        </div>
        <ModeToggle />
      </div>

      {/* Buttons Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Buttons</CardTitle>
          <CardDescription>Different button variants and sizes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon">
              <CheckCircle className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Form Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Form Elements</CardTitle>
          <CardDescription>Input fields and labels</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="Enter your email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="Enter your password" />
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button variant="outline">Cancel</Button>
          <Button>Submit</Button>
        </CardFooter>
      </Card>

      {/* Badges Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Badges</CardTitle>
          <CardDescription>Status indicators and labels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Demo */}
      <div className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Info</AlertTitle>
          <AlertDescription>
            This is a default alert with some information.
          </AlertDescription>
        </Alert>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            This is a destructive alert indicating an error.
          </AlertDescription>
        </Alert>
      </div>

      {/* Cards Grid Demo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Card 1</CardTitle>
            <CardDescription>This is a simple card</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Card content goes here.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Card 2</CardTitle>
            <CardDescription>Another card example</CardDescription>
          </CardHeader>
          <CardContent>
            <p>More content in this card.</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">Action</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Card 3</CardTitle>
            <CardDescription>Third card with badge</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>Content with status badge:</p>
            <Badge>Active</Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}