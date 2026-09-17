import React, { useState } from 'react';
import { Plus, Link as LinkIcon, Type, Folder, FileText, Clock } from 'lucide-react';

const AddResourceForm = ({ onAdd }) => {
  const [formData, setFormData] = useState({
    url: '',
    title: '',
    description: '',
    category: '',
    timestamp: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.url || !formData.title || !formData.category) return;
    
    setIsSubmitting(true);
    await onAdd(formData);
    setFormData({ url: '', title: '', description: '', category: '', timestamp: '' });
    setIsSubmitting(false);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-blue-400"></div>
      
      <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
        <Plus className="w-5 h-5 text-primary" />
        Add New Resource
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-textMuted mb-1.5 ml-1">URL <span className="text-danger">*</span></label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <LinkIcon className="w-4 h-4 text-textMuted" />
            </div>
            <input 
              type="url" 
              name="url"
              value={formData.url}
              onChange={handleChange}
              required
              className="w-full bg-surface/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-textMuted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
              placeholder="https://example.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-textMuted mb-1.5 ml-1">Title <span className="text-danger">*</span></label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Type className="w-4 h-4 text-textMuted" />
            </div>
            <input 
              type="text" 
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full bg-surface/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-textMuted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
              placeholder="React Context API Tutorial"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-textMuted mb-1.5 ml-1">Category / Tag <span className="text-danger">*</span></label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Folder className="w-4 h-4 text-textMuted" />
            </div>
            <input 
              type="text" 
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="w-full bg-surface/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-textMuted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
              placeholder="Web Dev, DSA, etc."
            />
          </div>
        </div>

        { (formData.url.includes('youtube.com') || formData.url.includes('youtu.be')) && (
          <div>
            <label className="block text-sm font-medium text-textMuted mb-1.5 ml-1">Timestamp (Optional)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Clock className="w-4 h-4 text-textMuted" />
              </div>
              <input 
                type="text" 
                name="timestamp"
                value={formData.timestamp}
                onChange={handleChange}
                className="w-full bg-surface/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-textMuted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                placeholder="e.g., 1m24s or 1:24"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-textMuted mb-1.5 ml-1">Description</label>
          <div className="relative">
            <div className="absolute top-3 left-0 pl-3 pointer-events-none">
              <FileText className="w-4 h-4 text-textMuted" />
            </div>
            <textarea 
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full bg-surface/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-textMuted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all resize-none"
              placeholder="Brief notes about this resource..."
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-primary hover:bg-blue-600 text-white font-medium py-2.5 px-4 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background flex justify-center items-center gap-2 mt-2"
        >
          {isSubmitting ? (
            <span className="animate-pulse">Adding...</span>
          ) : (
            <>Add Resource <Plus className="w-4 h-4" /></>
          )}
        </button>
      </form>
    </div>
  );
};

export default AddResourceForm;
