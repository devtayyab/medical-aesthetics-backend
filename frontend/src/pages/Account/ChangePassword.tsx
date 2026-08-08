import React, { useState } from 'react';
import { Key, Save, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { userAPI } from '@/services/api';
import { Button } from '@/components/atoms/Button/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/atoms/Input/Input';

export const ChangePassword = () => {
 const [isLoading, setIsLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [success, setSuccess] = useState(false);
 const [formData, setFormData] = useState({
 currentPassword: '',
 newPassword: '',
 confirmPassword: ''
 });

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setError(null);
 setSuccess(false);

 if (formData.newPassword !== formData.confirmPassword) {
 setError('New passwords do not match');
 return;
 }

 if (formData.newPassword.length < 6) {
 setError('Password must be at least 6 characters long');
 return;
 }

 try {
 setIsLoading(true);
 await userAPI.changePassword({
 currentPassword: formData.currentPassword,
 newPassword: formData.newPassword
 });
 setSuccess(true);
 setFormData({
 currentPassword: '',
 newPassword: '',
 confirmPassword: ''
 });
 } catch (err: any) {
 console.error('Failed to change password:', err);
 setError(err.response?.data?.message || 'Failed to change password. Please check your current password.');
 } finally {
 setIsLoading(false);
 }
 };

  return (
  <div className="p-3 sm:p-6 pb-24 sm:pb-8 max-w-2xl mx-auto space-y-4 sm:space-y-6">
  <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
  <div className="p-2.5 sm:p-3 bg-[#CBFF38] rounded-xl sm:rounded-2xl shadow-lg shadow-[#CBFF38]/20 group hover:rotate-6 transition-transform shrink-0">
  <Key className="h-6 w-6 sm:h-8 sm:w-8 text-gray-900" />
  </div>
  <div>
  <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-gray-900">Security Settings</h1>
  <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">Update your account password to keep your account secure</p>
  </div>
  </div>

  <Card className="border-none shadow-lg overflow-hidden">
  <CardHeader className="bg-gray-50/50 border-b px-4 py-4 sm:px-6 sm:py-6">
  <CardTitle className="text-base sm:text-xl flex items-center gap-2">
  <Key className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
  Change Password
  </CardTitle>
  <CardDescription className="text-xs sm:text-sm">
  Enter your current password and choose a new strong password.
  </CardDescription>
  </CardHeader>
  <CardContent className="p-4 sm:p-6">
  <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
  {error && (
  <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl flex items-start animate-in fade-in slide-in-from-top-2">
  <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2.5 mt-0.5 flex-shrink-0" />
  <p className="text-xs sm:text-sm font-medium">{error}</p>
  </div>
  )}

  {success && (
  <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl flex items-start animate-in fade-in slide-in-from-top-2">
  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2.5 mt-0.5 flex-shrink-0" />
  <p className="text-xs sm:text-sm font-medium">Password changed successfully!</p>
  </div>
  )}

  <div className="space-y-3 sm:space-y-4">
  <Input
  label="Current Password"
  type="password"
  required
  value={formData.currentPassword}
  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
  placeholder="Enter current password"
  className="h-10 sm:h-12 bg-gray-50/50 border-gray-200 focus:bg-white transition-all text-xs sm:text-sm"
  />

  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 pt-1 sm:pt-2">
  <Input
  label="New Password"
  type="password"
  required
  value={formData.newPassword}
  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
  placeholder="Enter new password"
  className="h-10 sm:h-12 bg-gray-50/50 border-gray-200 focus:bg-white transition-all text-xs sm:text-sm"
  />

  <Input
  label="Confirm New Password"
  type="password"
  required
  value={formData.confirmPassword}
  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
  placeholder="Confirm new password"
  className="h-10 sm:h-12 bg-gray-50/50 border-gray-200 focus:bg-white transition-all text-xs sm:text-sm"
  />
  </div>
  </div>

  <div className="pt-2 sm:pt-4 flex justify-end">
  <Button 
  type="submit" 
  disabled={isLoading}
  className="w-full sm:w-auto bg-[#CBFF38] text-gray-900 hover:bg-[#B8EA32] h-11 sm:h-12 px-6 sm:px-8 font-bold shadow-lg shadow-[#CBFF38]/20 transition-all gap-2 text-xs sm:text-sm"
  >
  {isLoading ? (
  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
  ) : (
  <Save className="h-4 w-4 sm:h-5 sm:w-5" />
  )}
  Update Password
  </Button>
  </div>
  </form>
  </CardContent>
  </Card>

  <div className="bg-amber-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-amber-100">
  <h3 className="text-amber-900 font-bold mb-2 flex items-center gap-2 text-xs sm:text-sm">
  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
  Security Recommendations
  </h3>
  <ul className="text-amber-800 text-xs sm:text-sm space-y-1.5 list-disc list-inside font-medium opacity-90">
  <li>Use a password with at least 8 characters.</li>
  <li>Include a mix of letters, numbers, and special characters.</li>
  <li>Avoid using the same password for multiple accounts.</li>
  <li>Update your password every few months for maximum security.</li>
  </ul>
  </div>
  </div>
 );
};
