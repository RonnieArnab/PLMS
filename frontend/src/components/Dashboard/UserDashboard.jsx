import React from "react";
import {
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  CreditCard,
  TrendingUp,
} from "lucide-react";
import { Card } from "../UI/Card";
import { Button } from "../UI/Button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export const UserDashboard = ({ onNavigate }) => {
  // Mock data
  const stats = [
    {
      title: "Active Loans",
      value: "2",
      icon: DollarSign,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      title: "Pending Applications",
      value: "1",
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100 dark:bg-yellow-900/20",
    },
    {
      title: "Total Borrowed",
      value: "$125,000",
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      title: "Credit Score",
      value: "785",
      icon: CheckCircle,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
    },
  ];

  const loanApplications = [
    {
      id: "1",
      amount: 50000,
      purpose: "Practice Equipment",
      status: "approved",
      submittedAt: "2024-01-15",
      interestRate: 7.5,
    },
    {
      id: "2",
      amount: 75000,
      purpose: "Office Setup",
      status: "under-review",
      submittedAt: "2024-01-20",
      interestRate: null,
    },
    {
      id: "3",
      amount: 100000,
      purpose: "Clinic Purchase",
      status: "pending",
      submittedAt: "2024-01-22",
      interestRate: null,
    },
  ];

  const paymentHistory = [
    { month: "Jan", amount: 2500 },
    { month: "Feb", amount: 2500 },
    { month: "Mar", amount: 2500 },
    { month: "Apr", amount: 2500 },
    { month: "May", amount: 2500 },
    { month: "Jun", amount: 2500 },
  ];

  const loanBreakdown = [
    { name: "Equipment Loan", value: 50000, color: "#3B82F6" },
    { name: "Office Setup", value: 75000, color: "#10B981" },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "text-green-600 bg-green-100 dark:bg-green-900/20";
      case "under-review":
        return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20";
      case "pending":
        return "text-blue-600 bg-blue-100 dark:bg-blue-900/20";
      case "rejected":
        return "text-red-600 bg-red-100 dark:bg-red-900/20";
      default:
        return "text-gray-600 bg-gray-100 dark:bg-gray-900/20";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return CheckCircle;
      case "under-review":
        return Clock;
      case "pending":
        return AlertCircle;
      default:
        return FileText;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Here's an overview of your loan portfolio
          </p>
        </div>
        <Button onClick={() => onNavigate("apply")}>Apply for New Loan</Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment History Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Payment History
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={paymentHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value) => [`$${value}`, "Payment Amount"]}
                labelStyle={{ color: "#374151" }}
              />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Loan Breakdown */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Loan Portfolio Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={loanBreakdown}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value">
                {loanBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [`$${value.toLocaleString()}`, ""]}
                labelStyle={{ color: "#374151" }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {loanBreakdown.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {item.name}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  ${item.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Applications */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Loan Applications
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate("my-loans")}>
            View All
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                  Amount
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                  Purpose
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                  Status
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                  Date
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                  Interest Rate
                </th>
              </tr>
            </thead>
            <tbody>
              {loanApplications.map((application) => {
                const StatusIcon = getStatusIcon(application.status);
                return (
                  <tr
                    key={application.id}
                    className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                      ${application.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {application.purpose}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          application.status
                        )}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {application.status.charAt(0).toUpperCase() +
                          application.status.slice(1).replace("-", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {application.interestRate
                        ? `${application.interestRate}%`
                        : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="outline"
            className="flex items-center justify-center p-4 h-auto"
            onClick={() => onNavigate("payments")}>
            <CreditCard className="w-5 h-5 mr-2" />
            Make Payment
          </Button>
          <Button
            variant="outline"
            className="flex items-center justify-center p-4 h-auto"
            onClick={() => onNavigate("my-loans")}>
            <FileText className="w-5 h-5 mr-2" />
            View Statements
          </Button>
          <Button
            variant="outline"
            className="flex items-center justify-center p-4 h-auto"
            onClick={() => onNavigate("apply")}>
            <DollarSign className="w-5 h-5 mr-2" />
            New Application
          </Button>
        </div>
      </Card>
    </div>
  );
};
