import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  AlertTriangle,
  CheckCircle,
  Search,
  Copy,
  Users,
  Eye,
  Merge,
  X
} from 'lucide-react';
import { Button } from '@/components/atoms/Button/Button';
import { Input } from '@/components/atoms/Input/Input';
import { Badge } from '@/components/atoms/Badge/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/molecules/Card/Card';
import {
  checkForDuplicates,
  getDuplicateSuggestions,
  mergeDuplicates
} from '@/store/slices/crmSlice';
import type { RootState, AppDispatch } from '@/store';
import type { DuplicateCheckResult } from '@/types';

interface DuplicateDetectionProps {
  onClose?: () => void;
  prefilledData?: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
  };
}

export const DuplicateDetection: React.FC<DuplicateDetectionProps> = ({
  onClose,
  prefilledData
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { duplicateCheck, duplicateSuggestions, isLoading } = useSelector(
    (state: RootState) => state.crm
  );

  const [searchData, setSearchData] = useState({
    email: prefilledData?.email || '',
    phone: prefilledData?.phone || '',
    firstName: prefilledData?.firstName || '',
    lastName: prefilledData?.lastName || ''
  });

  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSearch = async () => {
    await dispatch(checkForDuplicates(searchData));
    await dispatch(getDuplicateSuggestions(searchData));
    setShowSuggestions(true);
  };

  const handleMerge = async (targetCustomerId: string) => {
    try {
      await dispatch(mergeDuplicates({
        targetId: targetCustomerId,
        sourceId: searchData.email // Using email as source identifier
      })).unwrap();
      onClose?.();
    } catch (error) {
      console.error('Failed to merge duplicates:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Duplicate Detection</h2>
          <p className="text-gray-600">Find and merge duplicate customer records</p>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search for Duplicates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={searchData.firstName}
              onChange={(e) => setSearchData({...searchData, firstName: e.target.value})}
              placeholder="Enter first name"
            />
            <Input
              label="Last Name"
              value={searchData.lastName}
              onChange={(e) => setSearchData({...searchData, lastName: e.target.value})}
              placeholder="Enter last name"
            />
            <Input
              label="Email"
              type="email"
              value={searchData.email}
              onChange={(e) => setSearchData({...searchData, email: e.target.value})}
              placeholder="Enter email address"
            />
            <Input
              label="Phone"
              value={searchData.phone}
              onChange={(e) => setSearchData({...searchData, phone: e.target.value})}
              placeholder="Enter phone number"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="primary" onClick={handleSearch} disabled={isLoading}>
              <Search className="h-4 w-4 mr-2" />
              Search for Duplicates
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Duplicate Check Results */}
      {duplicateCheck && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {duplicateCheck.isDuplicate ? (
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}
              Duplicate Check Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {duplicateCheck.isDuplicate ? (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-800 mb-2">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="font-medium">Potential Duplicate Found</span>
                    <Badge variant="warning">
                      {duplicateCheck.confidence}% confidence
                    </Badge>
                  </div>
                  {duplicateCheck.existingCustomer && (
                    <div className="text-sm text-yellow-700">
                      <p className="font-medium">Existing Customer:</p>
                      <p>{duplicateCheck.existingCustomer.firstName} {duplicateCheck.existingCustomer.lastName}</p>
                      <p>{duplicateCheck.existingCustomer.email}</p>
                      <p>{duplicateCheck.existingCustomer.phone}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">No duplicates found</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Duplicate Suggestions */}
      {showSuggestions && duplicateSuggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Similar Customers ({duplicateSuggestions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {duplicateSuggestions.map((suggestion, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">
                        {suggestion.customer.firstName} {suggestion.customer.lastName}
                      </h4>
                      <Badge variant="info">
                        {suggestion.confidence}% match
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>{suggestion.customer.email}</div>
                      {suggestion.customer.phone && <div>{suggestion.customer.phone}</div>}
                      <div className="text-xs text-gray-500">
                        Match reason: {suggestion.matchReason}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMerge(suggestion.customer.id)}
                    >
                      <Merge className="h-4 w-4 mr-1" />
                      Merge
                    </Button>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Merge Confirmation Modal */}
      {/* This would be implemented as a separate modal component */}
    </div>
  );
};
