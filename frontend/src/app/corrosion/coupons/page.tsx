'use client';

import { useState, useEffect } from "react";
import { fetchCoupons } from "@/api/corrosion-coupon";
import { CorrosionCoupon, CouponStatus } from "@/components/corrosion/types";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Filter } from "lucide-react";
import Link from "next/link";

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<CorrosionCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function loadCoupons() {
      try {
        setLoading(true);
        const data = await fetchCoupons();
        setCoupons(data);
        setError(null);
      } catch (err) {
        console.error("Failed to load coupons:", err);
        setError("Failed to load coupons. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    
    loadCoupons();
  }, []);

  // Get status badge style
  const getStatusBadge = (status: CouponStatus) => {
    switch (status) {
      case "Installed":
        return <Badge variant="outline" className="bg-green-100 text-green-800">Installed</Badge>;
      case "Removed":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Removed</Badge>;
      case "Analyzed":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Analyzed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Filter coupons based on status and search term
  const filteredCoupons = coupons.filter(coupon => {
    const matchesStatus = statusFilter === "all" || coupon.status === statusFilter;
    const matchesSearch = 
      searchTerm === "" || 
      coupon.coupon_id.toLowerCase().includes(searchTerm.toLowerCase()) || 
      coupon.location_id.toLowerCase().includes(searchTerm.toLowerCase()) || 
      coupon.material_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Corrosion Coupons</h1>
        <Button asChild>
          <Link href="/corrosion/coupons/new">
            <Plus className="mr-2 h-4 w-4" />
            Install New Coupon
          </Link>
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filter Coupons</CardTitle>
          <CardDescription>Filter the list by status or search for specific coupons</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-1/3">
              <label className="text-sm font-medium mb-1 block">Status</label>
              <Select 
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Installed">Installed</SelectItem>
                  <SelectItem value="Removed">Removed</SelectItem>
                  <SelectItem value="Analyzed">Analyzed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-2/3">
              <label className="text-sm font-medium mb-1 block">Search</label>
              <div className="relative">
                <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by ID, location, or material..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading coupons...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <p className="text-red-700">{error}</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Coupon ID</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Installation Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCoupons.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        No coupons found matching your criteria
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCoupons.map((coupon) => (
                      <TableRow key={coupon.coupon_id}>
                        <TableCell>{coupon.coupon_id}</TableCell>
                        <TableCell>{coupon.location_id}</TableCell>
                        <TableCell>{coupon.material_type}</TableCell>
                        <TableCell>{coupon.coupon_type}</TableCell>
                        <TableCell>
                          {new Date(coupon.installation_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{getStatusBadge(coupon.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/corrosion/coupons/${coupon.coupon_id}`}>
                                View
                              </Link>
                            </Button>
                            {coupon.status === "Installed" && (
                              <Button variant="destructive" size="sm" asChild>
                                <Link href={`/corrosion/coupons/${coupon.coupon_id}/remove`}>
                                  Remove
                                </Link>
                              </Button>
                            )}
                            {coupon.status === "Removed" && (
                              <Button variant="default" size="sm" asChild>
                                <Link href={`/corrosion/analysis/new?coupon=${coupon.coupon_id}`}>
                                  Analyze
                                </Link>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}