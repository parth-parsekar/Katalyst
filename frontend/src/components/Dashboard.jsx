import React, { useState, useEffect } from 'react';
import axios from 'axios';
import StatsWidget from './StatsWidget';
import AddResourceForm from './AddResourceForm';
import ResourceList from './ResourceList';
import { Loader2, AlertCircle } from 'lucide-react';
import { getAuthHeaders } from '../utils/auth';

const API_URL = import.meta.env.VITE_API_URL || 'https://katalyst-fybi.onrender.com';

const Dashboard = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(API_URL, { headers: getAuthHeaders() });
      setResources(data);
      setError(null);
    } catch (err) {
      setError('Failed to load resources. Ensure the backend server is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleAddResource = async (newResource) => {
    try {
      const { data } = await axios.post(API_URL, newResource, { headers: getAuthHeaders() });
      setResources([data, ...resources]);
    } catch (err) {
      console.error('Error adding resource:', err);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const { data } = await axios.put(`${API_URL}/${id}`, { status }, { headers: getAuthHeaders() });
      setResources(resources.map(res => (res._id === id ? data : res)));
    } catch (err) {
      console.error('Error updating resource:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
      setResources(resources.filter(res => res._id !== id));
    } catch (err) {
      console.error('Error deleting resource:', err);
    }
  };

  if (loading && resources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-textMuted">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
      {/* Left Column - Form & Stats */}
      <div className="space-y-8 flex flex-col">
        {error && (
          <div className="bg-danger/10 border border-danger/20 text-danger p-4 rounded-xl flex items-start gap-3 glass-panel">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        <StatsWidget resources={resources} />
        
        <div className="relative lg:sticky top-28">
          <AddResourceForm onAdd={handleAddResource} />
        </div>
      </div>

      {/* Right Column - Lists */}
      <div className="lg:col-span-2 space-y-8">
        <ResourceList 
          resources={resources} 
          onUpdateStatus={handleUpdateStatus} 
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
};

export default Dashboard;
