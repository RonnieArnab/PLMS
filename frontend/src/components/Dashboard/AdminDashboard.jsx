import React, { useState } from "react";
import {
  Users,
  FileText,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
  Check,
  X,
} from "lucide-react";
import { Card } from "../UI/Card";
import { Button } from "../UI/Button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

export const AdminDashboard = () => {
  const [selectedApplication, setSelectedApplication] = useState(null);

  // Mock data
  const stats = [
    {
      title: "Total Applications",
      value: "1,247",
      change: "+12%",
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      title: "Active Customers",
      value: "892",
      change: "+8%",
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      title: "Total Loans Disbursed",
      value: "$12.4M",
      change: "+18%",
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
    },
    {
      title: "Approval Rate",
      value: "78%",
      change: "+3%",
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
    },
  ];

  const pendingApplications = [
    {
      id: "1",
      applicantName: "Dr. Sarah Johnson",
      profession: "Doctor",
      loanAmount: 150000,
      purpose: "Practice Equipment",
      creditScore: 785,
      submittedAt: "2024-01-22",
      monthlyIncome: 25000,
      riskLevel: "low",
    },
    {
      id: "2",
      applicantName: "John Smith, Esq.",
      profession: "Lawyer",
      loanAmount: 200000,
      purpose: "Office Purchase",
      creditScore: 720,
      submittedAt: "2024-01-21",
      monthlyIncome: 18000,
      riskLevel: "medium",
    },
    {
      id: "3",
      applicantName: "Dr. Michael Chen",
      profession: "Engineer",
      loanAmount: 75000,
      purpose: "Working Capital",
      creditScore: 680,
      submittedAt: "2024-01-20",
      monthlyIncome: 12000,
      riskLevel: "high",
    },
  ];

  const monthlyData = [
    { month: "Jan", applications: 98, approvals: 76, disbursements: 4200000 },
    { month: "Feb", applications: 125, approvals: 95, disbursements: 5100000 },
    { month: "Mar", applications: 110, approvals: 88, disbursements: 4800000 },
    { month: "Apr", applications: 135, approvals: 105, disbursements: 5500000 },
    { month: "May", applications: 142, approvals: 110, disbursements: 5800000 },
    { month: "Jun", applications: 128, approvals: 98, disbursements: 5200000 },
  ];

  const professionData = [
    { profession: "Doctors", applications: 425, approvals: 355 },
    { profession: "Lawyers", applications: 312, approvals: 245 },
    { profession: "Engineers", applications: 289, approvals: 198 },
    { profession: "Architects", applications: 156, approvals: 118 },
    { profession: "Others", applications: 65, approvals: 42 },
  ];

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case "low":
        return "text-green-600 bg-green-100 dark:bg-green-900/20";
      case "medium":
        return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20";
      case "high":
        return "text-red-600 bg-red-100 dark:bg-red-900/20";
      default:
        return "text-gray-600 bg-gray-100 dark:bg-gray-900/20";
    }
  };

  const getRiskIcon = (riskLevel) => {
    switch (riskLevel) {
      case "low":
        return CheckCircle;
      case "medium":
        return Clock;
      case "high":
        return AlertTriangle;
      default:
        return FileText;
    }
  };

  const handleApprove = (applicationId) => {
    console.log("Approving application:", applicationId);
    // Handle approval logic
  };

  const handleReject = (applicationId) => {
    console.log("Rejecting application:", applicationId);
    // Handle rejection logic
  };

  const handleViewDetails = (applicationId) => {
    setSelectedApplication(applicationId);
    // Handle view details logic
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage loan applications and monitor performance
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {stat.change} from last month
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Applications Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Monthly Application Trends
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value, name) => [
                  value,
                  name === "applications" ? "Applications" : "Approvals",
                ]}
                labelStyle={{ color: "#374151" }}
              />
              <Line
                type="monotone"
                dataKey="applications"
                stroke="#3B82F6"
                strokeWidth={3}
                name="applications"
              />
              <Line
                type="monotone"
                dataKey="approvals"
                stroke="#10B981"
                strokeWidth={3}
                name="approvals"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Applications by Profession */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Applications by Profession
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={professionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="profession" />
              <YAxis />
              <Tooltip
                formatter={(value, name) => [
                  value,
                  name === "applications" ? "Total Applications" : "Approved",
                ]}
                labelStyle={{ color: "#374151" }}
              />
              <Bar dataKey="applications" fill="#E5E7EB" name="applications" />
              <Bar dataKey="approvals" fill="#3B82F6" name="approvals" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Pending Applications */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Pending Applications ({pendingApplications.length})
          </h3>
          <Button variant="outline" size="sm">
            View All Applications
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                  Applicant
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                  Amount
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                  Purpose
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                  Credit Score
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                  Risk Level
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                  Submitted
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {pendingApplications.map((application) => {
                const RiskIcon = getRiskIcon(application.riskLevel);
                return (
                  <tr
                    key={application.id}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {application.applicantName}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {application.profession}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-medium text-gray-900 dark:text-white">
                      ${application.loanAmount.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-gray-600 dark:text-gray-400">
                      {application.purpose}
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {application.creditScore}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskColor(
                          application.riskLevel
                        )}`}>
                        <RiskIcon className="w-3 h-3 mr-1" />
                        {application.riskLevel.charAt(0).toUpperCase() +
                          application.riskLevel.slice(1)}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-600 dark:text-gray-400">
                      {new Date(application.submittedAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(application.id)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleApprove(application.id)}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20">
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReject(application.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20">
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Recent Activity */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Activity
        </h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Dr. Sarah Johnson's</span> loan
              application was approved
              <span className="text-gray-500"> • 2 hours ago</span>
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              New loan application from{" "}
              <span className="font-medium">Michael Chen</span>
              <span className="text-gray-500"> • 4 hours ago</span>
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Document verification pending for{" "}
              <span className="font-medium">John Smith</span>
              <span className="text-gray-500"> • 6 hours ago</span>
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Monthly disbursement of <span className="font-medium">$5.8M</span>{" "}
              completed
              <span className="text-gray-500"> • 1 day ago</span>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
