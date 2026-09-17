import React from 'react';
import { ExternalLink, Trash2, Clock, CheckCircle, PlayCircle, Folder, Search } from 'lucide-react';
import clsx from 'clsx';

const ResourceCard = ({ resource, onUpdateStatus, onDelete }) => {
  const { _id, title, description, url, platform, category, status, dateAdded, timestamp } = resource;

  const StatusIcon = {
    'To-Do': Clock,
    'In Progress': PlayCircle,
    'Completed': CheckCircle
  }[status];

  let finalUrl = url;
  if (timestamp && platform === 'YouTube') {
    let t = timestamp;
    if (t.includes(':')) {
      const parts = t.split(':');
      if (parts.length === 2) t = `${parts[0]}m${parts[1]}s`;
      else if (parts.length === 3) t = `${parts[0]}h${parts[1]}m${parts[2]}s`;
    }
    finalUrl = url + (url.includes('?') ? '&t=' : '?t=') + t;
  }

  return (
    <div className="bg-surface/30 border border-white/5 rounded-2xl p-5 hover:bg-surface/50 transition-colors group relative">
      <div className="absolute top-5 right-5 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <a 
          href={finalUrl} 
          target="_blank" 
          rel="noreferrer"
          className="p-1.5 bg-background/50 text-textMuted hover:text-white rounded-lg transition-colors border border-white/5 hover:border-white/20"
          title="Open Link"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
        <button 
          onClick={() => onDelete(_id)}
          className="p-1.5 bg-background/50 text-textMuted hover:text-danger rounded-lg transition-colors border border-white/5 hover:border-danger/30"
          title="Delete Resource"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="mb-4 pr-16">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="px-2.5 py-1 text-xs font-medium bg-primary/10 text-primary border border-primary/20 rounded-md">
            {platform || 'Link'}
          </span>
          <span className="px-2.5 py-1 text-xs font-medium bg-surface text-textMuted border border-white/10 rounded-md flex items-center gap-1">
            <Folder className="w-3 h-3" /> {category}
          </span>
          {timestamp && (
            <span className="px-2.5 py-1 text-xs font-medium bg-secondary/10 text-text border border-secondary/20 rounded-md flex items-center gap-1">
              <Clock className="w-3 h-3" /> {timestamp}
            </span>
          )}
        </div>
        <h3 className="text-lg font-semibold text-white mb-1 line-clamp-1" title={title}>{title}</h3>
        {description && (
          <p className="text-sm text-textMuted line-clamp-2">{description}</p>
        )}
      </div>

      <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
        <div className="flex items-center gap-2 text-xs text-textMuted">
          <span className="flex items-center gap-1">
            Added {new Date(dateAdded).toLocaleDateString()}
          </span>
        </div>
        
        <div className="flex items-center gap-1 bg-background/50 p-1 rounded-lg border border-white/5">
          {['To-Do', 'In Progress', 'Completed'].map((s) => {
            const Icon = s === 'To-Do' ? Clock : s === 'In Progress' ? PlayCircle : CheckCircle;
            const isActive = status === s;
            return (
              <button
                key={s}
                onClick={() => onUpdateStatus(_id, s)}
                className={clsx(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5",
                  isActive 
                    ? s === 'Completed' ? "bg-success/20 text-success" 
                      : s === 'In Progress' ? "bg-warning/20 text-warning"
                      : "bg-secondary/20 text-text"
                    : "text-textMuted hover:bg-surface"
                )}
              >
                <Icon className={clsx("w-3.5 h-3.5", isActive ? "" : "opacity-50")} />
                {s}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  );
};

const ResourceList = ({ resources, onUpdateStatus, onDelete }) => {
  const [filter, setFilter] = React.useState('All');
  
  const categories = ['All', ...new Set(resources.map(r => r.category))];
  
  const filteredResources = filter === 'All' 
    ? resources 
    : resources.filter(r => r.category === filter);

  return (
    <div className="glass-panel p-6 rounded-2xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          Your Resources
          <span className="px-2 py-0.5 rounded-full bg-surface text-xs font-medium text-textMuted border border-white/10">
            {filteredResources.length}
          </span>
        </h2>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={clsx(
                "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border",
                filter === cat
                  ? "bg-primary text-white border-primary"
                  : "bg-surface/50 text-textMuted border-white/5 hover:border-white/20 hover:text-white"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filteredResources.length === 0 ? (
        <div className="text-center py-16 px-4 bg-surface/20 rounded-xl border border-white/5 border-dashed">
          <div className="w-16 h-16 bg-surface/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-textMuted/50" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No resources found</h3>
          <p className="text-textMuted text-sm">
            {filter === 'All' 
              ? "You haven't added any resources yet. Use the form to add one!" 
              : `No resources found in the "${filter}" category.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filteredResources.map(resource => (
            <ResourceCard 
              key={resource._id} 
              resource={resource} 
              onUpdateStatus={onUpdateStatus}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ResourceList;
