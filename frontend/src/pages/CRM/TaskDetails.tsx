import React from "react";
import { User } from "lucide-react";
import { Card, CardContent } from "@/components/molecules/Card/Card";
import type { Task } from "@/types";
import { CardHeader, CardTitle } from "@/components/molecules/Card/Card";
import { ClipboardList } from "lucide-react";
import { Calendar } from "lucide-react";
interface OneCustomerDetailProps {
    selectedTask: Task;
}
export const TaskDetails: React.FC<OneCustomerDetailProps> = ({
    selectedTask,
}) => {

    if (!selectedTask) {
        return (
            <div className="text-center py-12 text-gray-600">Tasks not found</div>
        );
    }


    const assignee = selectedTask.assignee;
    const email = assignee?.email || 'No email';

    return (
        <div className="space-y-8">




            {/* Assigned Salesperson */}

            {assignee && assignee.email && assignee.email !== 'No email' && <Card className="border border-gray-200 shadow-md">

                <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                                <User className="h-8 w-8 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-[1rem] font-bold">
                                    {email}
                                </h2>
                                <div className="flex items-center gap-4 text-gray-600 mt-1">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        {new Date(
                                            assignee.createdAt
                                        ).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-gray-500">Assigned to</div>
                            <div className="font-medium">
                                {assignee.firstName}{" "}
                                {assignee.lastName}

                                {assignee.role}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>}

            {/* Task Details */}
            <Card className="border border-gray-200 shadow-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg font-semibold mb-4">
                        <ClipboardList className="h-5 w-5 text-green-600 " />
                        Task Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                    <table className="min-w-full border border-gray-200 rounded-lg text-sm text-gray-700">
                        <tbody className="divide-y divide-gray-100">
                            <tr>
                                <td className="font-semibold px-4 py-2 bg-gray-50 w-40">Title</td>
                                <td className="px-4 py-2 capitalize">{selectedTask.title}</td>
                            </tr>
                            <tr>
                                <td className="font-semibold px-4 py-2 bg-gray-50">Description</td>
                                <td className="px-4 py-2">{selectedTask.description}</td>
                            </tr>
                            <tr>
                                <td className="font-semibold px-4 py-2 bg-gray-50">Type</td>
                                <td className="px-4 py-2 capitalize">{selectedTask.type}</td>
                            </tr>
                            <tr>
                                <td className="font-semibold px-4 py-2 bg-gray-50">Status</td>
                                <td className="px-4 py-2">
                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-medium ${selectedTask.status === 'completed'
                                            ? 'bg-green-100 text-green-700'
                                            : selectedTask.status === 'in_progress'
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-yellow-100 text-yellow-700'
                                            }`}
                                    >
                                        {selectedTask.status}
                                    </span>
                                </td>
                            </tr>
                            <tr>
                                <td className="font-semibold px-4 py-2 bg-gray-50">Due Date</td>
                                <td className="px-4 py-2">
                                    {new Date(selectedTask.dueDate).toLocaleDateString()}
                                </td>
                            </tr>
                            <tr>
                                <td className="font-semibold px-4 py-2 bg-gray-50">Created At</td>
                                <td className="px-4 py-2">
                                    {new Date(selectedTask.createdAt).toLocaleDateString()}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </CardContent>
            </Card>

        </div>
    );

};
