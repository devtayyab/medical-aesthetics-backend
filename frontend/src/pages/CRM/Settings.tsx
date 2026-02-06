import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/molecules/Card/Card';
import { Button } from '@/components/atoms/Button/Button';
import { Input } from '@/components/atoms/Input/Input';
import { User, Mail, Phone, Shield, Edit2, Save, X } from 'lucide-react';
import type { RootState, AppDispatch } from '@/store';
import { updateProfile } from '@/store/slices/authSlice';

export const Settings: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { user, isLoading } = useSelector((state: RootState) => state.auth);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
    });

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
                phone: user.phone || '',
            });
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        try {
            await dispatch(updateProfile(formData)).unwrap();
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to update profile:', error);
            // You might want to show a toast notification here
        }
    };

    const handleCancel = () => {
        if (user) {
            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
                phone: user.phone || '',
            });
        }
        setIsEditing(false);
    };

    if (!user) {
        return <div>Loading user profile...</div>;
    }

    return (
        <div className="space-y-6 p-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-2xl font-bold flex items-center gap-2">
                        <User className="h-6 w-6 text-blue-600" />
                        My Profile
                    </CardTitle>
                    {!isEditing ? (
                        <Button
                            variant="outline"
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-2"
                        >
                            <Edit2 className="h-4 w-4" />
                            Edit Profile
                        </Button>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                onClick={handleCancel}
                                disabled={isLoading}
                                className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            >
                                <X className="h-4 w-4" />
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleSubmit}
                                disabled={isLoading}
                                className="flex items-center gap-2"
                            >
                                <Save className="h-4 w-4" />
                                {isLoading ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    )}
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">First Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                <Input
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className={`pl-10 ${!isEditing ? 'bg-gray-50' : ''}`}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Last Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                <Input
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className={`pl-10 ${!isEditing ? 'bg-gray-50' : ''}`}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                <Input
                                    name="email"
                                    value={formData.email}
                                    disabled
                                    title="Email cannot be changed"
                                    className="pl-10 bg-gray-50 cursor-not-allowed opacity-70"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Contact support to change email</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Phone Number</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                <Input
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className={`pl-10 ${!isEditing ? 'bg-gray-50' : ''}`}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Role</label>
                            <div className="relative">
                                <Shield className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                <Input
                                    value={user.role}
                                    disabled
                                    className="pl-10 bg-gray-50 capitalize cursor-not-allowed opacity-70"
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">Application Settings</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-500">Additional settings for notifications, theme, and language will be available here.</p>
                </CardContent>
            </Card>
        </div>
    );
};
