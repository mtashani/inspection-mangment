"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  BarChart3, 
  FileText, 
  Users, 
  Wrench, 
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
  Plus
} from "lucide-react"

export default function Dashboard() {
  return (
    <>
      {/* Key Metrics Cards */}
      <div className="grid auto-rows-min gap-4 md:grid-cols-3 mb-6">
        <Card className="bg-[var(--color-base-100)] border-[var(--border)] rounded-[var(--radius-box)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[var(--color-base-content)]">
              Total Inspections
            </CardTitle>
            <FileText className="h-4 w-4 text-[var(--color-base-content)]/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--color-base-content)]">1,234</div>
            <p className="text-xs text-[var(--color-base-content)]/70">
              <span className="text-[var(--color-success)]">+12%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[var(--color-base-100)] border-[var(--border)] rounded-[var(--radius-box)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[var(--color-base-content)]">
              Pending Reviews
            </CardTitle>
            <Clock className="h-4 w-4 text-[var(--color-warning)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--color-base-content)]">23</div>
            <p className="text-xs text-[var(--color-base-content)]/70">
              <span className="text-[var(--color-warning)]">5 urgent</span> require attention
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[var(--color-base-100)] border-[var(--border)] rounded-[var(--radius-box)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[var(--color-base-content)]">
              Completion Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-[var(--color-success)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--color-base-content)]">94.2%</div>
            <p className="text-xs text-[var(--color-base-content)]/70">
              <span className="text-[var(--color-success)]">+2.1%</span> improvement
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mb-6">
        {/* Recent Inspections */}
        <Card className="col-span-4 bg-[var(--color-base-100)] border-[var(--border)] rounded-[var(--radius-box)]">
          <CardHeader>
            <CardTitle className="text-[var(--color-base-content)]">Recent Inspections</CardTitle>
            <CardDescription className="text-[var(--color-base-content)]/70">
              Latest inspection activities and status updates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                id: "INS-001",
                equipment: "Pressure Vessel PV-101",
                inspector: "John Smith",
                status: "completed",
                date: "2024-01-15"
              },
              {
                id: "INS-002", 
                equipment: "Safety Valve PSV-205",
                inspector: "Sarah Johnson",
                status: "pending",
                date: "2024-01-14"
              },
              {
                id: "INS-003",
                equipment: "Crane CR-301",
                inspector: "Mike Wilson",
                status: "in-progress",
                date: "2024-01-13"
              }
            ].map((inspection) => (
              <div key={inspection.id} className="flex items-center justify-between p-3 rounded-[var(--radius-field)] bg-[var(--color-base-200)]">
                <div className="flex items-center space-x-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-[var(--color-base-content)]">
                      {inspection.equipment}
                    </span>
                    <span className="text-xs text-[var(--color-base-content)]/70">
                      {inspection.id} • {inspection.inspector}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant={inspection.status === 'completed' ? 'default' : 'secondary'}
                    className={`
                      rounded-[var(--radius-selector)] text-xs
                      ${inspection.status === 'completed' ? 'bg-[var(--color-success)] text-[var(--color-success-content)]' : ''}
                      ${inspection.status === 'pending' ? 'bg-[var(--color-warning)] text-[var(--color-warning-content)]' : ''}
                      ${inspection.status === 'in-progress' ? 'bg-[var(--color-info)] text-[var(--color-info-content)]' : ''}
                    `}
                  >
                    {inspection.status}
                  </Badge>
                  <span className="text-xs text-[var(--color-base-content)]/70">
                    {inspection.date}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="col-span-3 bg-[var(--color-base-100)] border-[var(--border)] rounded-[var(--radius-box)]">
          <CardHeader>
            <CardTitle className="text-[var(--color-base-content)]">Quick Actions</CardTitle>
            <CardDescription className="text-[var(--color-base-content)]/70">
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full justify-start bg-[var(--color-primary)] text-[var(--color-primary-content)] hover:bg-[var(--color-primary)]/90 rounded-[var(--radius-field)]"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Inspection
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start border-[var(--border)] text-[var(--color-base-content)] hover:bg-[var(--color-base-200)] rounded-[var(--radius-field)]"
            >
              <Users className="mr-2 h-4 w-4" />
              Manage Inspectors
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start border-[var(--border)] text-[var(--color-base-content)] hover:bg-[var(--color-base-200)] rounded-[var(--radius-field)]"
            >
              <Wrench className="mr-2 h-4 w-4" />
              Equipment Status
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start border-[var(--border)] text-[var(--color-base-content)] hover:bg-[var(--color-base-200)] rounded-[var(--radius-field)]"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              View Reports
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card className="bg-[var(--color-base-100)] border-[var(--border)] rounded-[var(--radius-box)]">
        <CardHeader>
          <CardTitle className="text-[var(--color-base-content)]">System Status</CardTitle>
          <CardDescription className="text-[var(--color-base-content)]/70">
            Current system health and performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-[var(--color-success)]" />
              <div>
                <p className="text-sm font-medium text-[var(--color-base-content)]">Database</p>
                <p className="text-xs text-[var(--color-base-content)]/70">Operational</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-[var(--color-success)]" />
              <div>
                <p className="text-sm font-medium text-[var(--color-base-content)]">API Services</p>
                <p className="text-xs text-[var(--color-base-content)]/70">Healthy</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-[var(--color-warning)]" />
              <div>
                <p className="text-sm font-medium text-[var(--color-base-content)]">Backup System</p>
                <p className="text-xs text-[var(--color-base-content)]/70">Maintenance</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-[var(--color-success)]" />
              <div>
                <p className="text-sm font-medium text-[var(--color-base-content)]">File Storage</p>
                <p className="text-xs text-[var(--color-base-content)]/70">Available</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}