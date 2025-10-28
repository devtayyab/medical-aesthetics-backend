import { useState } from "react";
import { crmAPI } from "@/services/api";

export default function LeadForm() {
    const [formData, setFormData] = useState({
        source: "facebook_ads",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        status: "new",
        notes: "",
        assignedSalesId: "",
        metadata: {},
        estimatedValue: 0,
    });

    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setSuccessMsg("");
        setErrorMsg("");

        try {
            const response = await crmAPI.createLead(formData);
            console.log("✅ Lead created:", response.data);
            setSuccessMsg("🎉 Lead created successfully!");

            // Reset form
            setFormData({
                source: "facebook_ads",
                firstName: "",
                lastName: "",
                email: "",
                phone: "",
                status: "new",
                notes: "",
                assignedSalesId: "",
                metadata: {},
                estimatedValue: 0,
            });
        } catch (error: any) {
            console.error("❌ Error creating lead:", error.response?.data || error.message);
            setErrorMsg("⚠️ Failed to create lead. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-md border border-gray-100">
                <h2 className="text-2xl font-bold text-center text-indigo-600 mb-6">
                    Create New Lead
                </h2>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        placeholder="First Name"
                        required
                        className="w-full border rounded-lg p-2.5"
                    />
                    <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        placeholder="Last Name"
                        required
                        className="w-full border rounded-lg p-2.5"
                    />
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Email Address"
                        required
                        className="w-full border rounded-lg p-2.5"
                    />
                    <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+971501234567"
                        required
                        className="w-full border rounded-lg p-2.5"
                    />
                    <input
                        type="text"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        placeholder="Status (e.g., new)"
                        required
                        className="w-full border rounded-lg p-2.5"
                    />
                    <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        placeholder="Additional Notes"
                        className="w-full border rounded-lg p-2.5"
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className={`mt-4 py-2.5 rounded-lg font-semibold text-white transition-all ${loading
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-indigo-600 hover:bg-indigo-700"
                            }`}
                    >
                        {loading ? "Submitting..." : "Create Lead"}
                    </button>
                </form>

                {successMsg && (
                    <p className="text-green-600 text-sm font-medium mt-4 text-center">
                        {successMsg}
                    </p>
                )}
                {errorMsg && (
                    <p className="text-red-500 text-sm font-medium mt-4 text-center">
                        {errorMsg}
                    </p>
                )}
            </div>
        </div>
    );
}
