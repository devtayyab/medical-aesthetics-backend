import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Eye, Plus, Trash2
} from 'lucide-react';
import { Button } from '@/components/atoms/Button/Button';
import { Input } from '@/components/atoms/Input/Input';
import { Select } from '@/components/atoms/Select/Select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/molecules/Card/Card';
import {
  fetchActions,
  fetchPendingActions,
  // fetchOverdueActions,
  updateAction,
  deleteAction,
  createAction
} from '@/store/slices/crmSlice';
import type { RootState, AppDispatch } from '@/store';
import type { CrmAction } from '@/types';
import { ActionForm } from '@/components/organisms/ActionForm/ActionForm';
import { v4 as randomUUID } from 'uuid';

interface ActionsPageProps {
  salespersonId?: string;
  onViewAction?: (action: CrmAction) => void;
}

type FormData = {
  title: string;
  description: string;
  type: 'treatment_follow_up' | 'email_follow_up' | 'follow_up_call' | 'loyalty_reward' | 'appointment_reminder' | 'general';
  status: 'pending' | 'completed' | 'cancelled' | 'in_progress';
  dueDate: string;
  assigneeId: string;
  customerId?: string;
  metadata: Record<string, any>;
};

export const Actions: React.FC<ActionsPageProps> = ({ salespersonId, onViewAction }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { actions, isLoading, error, leads } = useSelector((state: RootState) => state.crm);
  const { user } = useSelector((state: RootState) => state.auth);

  console.log(user);
  const currentUserId = salespersonId || user?.id;
  const customerId = user?.role === 'client' ? user.id : 'c3ea86c1-f06a-47de-8928-5003e3e994b3';

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    type: 'follow_up_call',
    status: 'pending',
    dueDate: new Date().toISOString().slice(0, 16),
    customerId,
    assigneeId: user?.id || '',
    metadata: {}
  });

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'overdue'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (currentUserId) {
      dispatch(fetchActions({}));
      // dispatch(fetchPendingActions(currentUserId));
      // dispatch(fetchOverdueActions(currentUserId));
    }
  }, [dispatch, currentUserId]);

  const filteredActions = actions.filter(action =>
    searchTerm === '' ? true : action.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    action.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );
 
  const formatDate = (date?: string) =>
    date ? new Date(date).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }) : '-';

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Action Management</h2>
            <p className="text-gray-500 mt-1">Manage your actions and follow-ups</p>
          </div>
          <Button variant="primary" onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" /> New Action
          </Button>
        </div>
      </Card>

      {/* Action List */}
      <Card>
        <CardHeader><CardTitle>Actions ({filteredActions.length})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredActions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No actions found</div>
          ) : (
            <div className="space-y-10">
              {filteredActions.map(action => (
                <div key={action.id} className="p-4 border rounded-lg flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{action.title}</h3>
                    <p className="text-sm text-gray-500">{action.description}</p>
                    <p className="text-xs text-gray-400">Due: {formatDate(action.dueDate)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => onViewAction?.(action)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => dispatch(deleteAction(action.id))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Action Modal */}
      {showCreateForm && (
        <div className="bg-black bg-opacity-50 fixed inset-0 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Create New Action</h2>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
            <ActionForm 
              customerId={customerId || ''} 
              onSuccess={() => setShowCreateForm(false)}
              prefilledData={{ salespersonId: currentUserId }}
            />
          </div>
        </div>
      )}
    </div>
  );
};