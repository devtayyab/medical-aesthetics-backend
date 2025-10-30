import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchClients } from '../../store/slices/clinicSlice';
import clinicApi from '../../services/api/clinicApi';
import { NotificationType, SendNotificationDto } from '../../types/clinic.types';
import { Bell, Send, Users, Mail, MessageSquare, Smartphone } from 'lucide-react';

const NotificationsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { clients } = useSelector((state: RootState) => state.clinic);

  const [notificationType, setNotificationType] = useState<NotificationType>(NotificationType.PUSH);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    dispatch(fetchClients());
  }, [dispatch]);

  const handleSend = async () => {
    if (!title || !message) {
      alert('Please fill in title and message');
      return;
    }

    if (selectedClients.length === 0) {
      alert('Please select at least one recipient');
      return;
    }

    setIsSending(true);
    try {
      if (selectedClients.length === 1) {
        await clinicApi.notifications.send({
          recipientId: selectedClients[0],
          type: notificationType,
          title,
          message,
        });
      } else {
        await clinicApi.notifications.sendBulk({
          recipientIds: selectedClients,
          type: notificationType,
          title,
          message,
        });
      }

      alert('Notification sent successfully!');
      setTitle('');
      setMessage('');
      setSelectedClients([]);
    } catch (error) {
      console.error('Failed to send notification:', error);
      alert('Failed to send notification. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const toggleClient = (clientId: string) => {
    setSelectedClients((prev) =>
      prev.includes(clientId) ? prev.filter((id) => id !== clientId) : [...prev, clientId]
    );
  };

  const selectAll = () => {
    setSelectedClients(clients.map((c) => c.id));
  };

  const deselectAll = () => {
    setSelectedClients([]);
  };

  const notificationTypes = [
    { value: NotificationType.PUSH, label: 'Push Notification', icon: <Bell className="w-5 h-5" /> },
    { value: NotificationType.EMAIL, label: 'Email', icon: <Mail className="w-5 h-5" /> },
    { value: NotificationType.SMS, label: 'SMS', icon: <MessageSquare className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Send Notifications</h1>
        <p className="text-gray-600 mt-2">Send messages to your clients</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compose Notification */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Compose Message</h2>

          {/* Notification Type */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Notification Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              {notificationTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setNotificationType(type.value)}
                  className={`flex items-center justify-center gap-2 p-4 border-2 rounded-lg transition-all ${
                    notificationType === type.value
                      ? 'border-lime-300 bg-[#CBFF38]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={notificationType === type.value ? 'text-[#33373F]' : 'text-gray-400'}>
                    {type.icon}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      notificationType === type.value ? 'text-[#33373F]' : 'text-gray-700'
                    }`}
                  >
                    {type.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter notification title"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Message */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message here..."
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              required
            />
            <p className="text-sm text-gray-500 mt-1">{message.length} characters</p>
          </div>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={isSending || selectedClients.length === 0}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#CBFF38] text-[#33373F] rounded-lg hover:bg-lime-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
            {isSending ? 'Sending...' : `Send to ${selectedClients.length} recipient(s)`}
          </button>
        </div>

        {/* Recipients Selection */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recipients</h2>
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Select All
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={deselectAll}
                className="text-sm text-gray-600 hover:text-gray-700 font-medium"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-900">
              <span className="font-semibold">{selectedClients.length}</span> of{' '}
              <span className="font-semibold">{clients.length}</span> clients selected
            </p>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {clients.map((client) => (
              <label
                key={client.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedClients.includes(client.id)}
                  onChange={() => toggleClient(client.id)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {client.firstName} {client.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{client.email}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
