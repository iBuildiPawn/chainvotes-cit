import { useState, useEffect } from 'react';
import { Campaign } from '@/lib/types/campaign';
import { Button } from '@/components/ui/Button';

interface CampaignFormProps {
  onSubmit: (campaign: Omit<Campaign, 'id' | 'positions' | 'candidates' | 'status' | 'isActive'>) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

function getMinStartDate(): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 5); // Add 5 minutes to current time
  return now.toISOString().slice(0, 16); // Format as YYYY-MM-DDTHH:mm
}

function getMinEndDate(startDate: string): string {
  const date = new Date(startDate);
  date.setMinutes(date.getMinutes() + 30); // Minimum 30 minutes after start
  return date.toISOString().slice(0, 16);
}

export default function CampaignForm({ onSubmit, onCancel, isSubmitting = false }: CampaignFormProps) {
  const minStartDate = getMinStartDate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: minStartDate,
    endDate: getMinEndDate(minStartDate),
    organizationName: '',
  });

  const handleStartDateChange = (newStartDate: string) => {
    setFormData(prev => ({
      ...prev,
      startDate: newStartDate,
      endDate: prev.endDate < newStartDate ? getMinEndDate(newStartDate) : prev.endDate
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert string dates to Date objects
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    
    // Additional validation
    if (endDate <= startDate) {
      alert('End date must be after start date');
      return;
    }

    const now = new Date();
    if (startDate <= now) {
      alert('Start date must be in the future');
      return;
    }
    
    onSubmit({
      ...formData,
      startDate,
      endDate
    });
  };

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit} className="space-y-6">
        <fieldset disabled={isSubmitting} className="space-y-6">
          <div className="form-group">
            <label htmlFor="title" className="required">
              Campaign Title
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="form-input"
              placeholder="Enter campaign title"
              required
              minLength={3}
              maxLength={100}
            />
          </div>
          <div className="form-group">
            <label htmlFor="description" className="required">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="form-input"
              placeholder="Describe your campaign"
              required
              minLength={10}
              maxLength={1000}
            />
          </div>
          <div className="field-group">
            <div className="form-group">
              <label htmlFor="startDate" className="required">
                Start Date
              </label>
              <input
                type="datetime-local"
                id="startDate"
                value={formData.startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="form-input"
                required
                min={minStartDate}
              />
            </div>
            <div className="form-group">
              <label htmlFor="endDate" className="required">
                End Date
              </label>
              <input
                type="datetime-local"
                id="endDate"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                className="form-input"
                required
                min={getMinEndDate(formData.startDate)}
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="organizationName" className="required">
              Organization Name
            </label>
            <input
              type="text"
              id="organizationName"
              value={formData.organizationName}
              onChange={(e) => setFormData(prev => ({ ...prev, organizationName: e.target.value }))}
              className="form-input"
              placeholder="Enter organization name"
              required
              minLength={2}
              maxLength={100}
            />
          </div>
        </fieldset>
        <div className="flex justify-end gap-x-3 pt-4 border-t border-border">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="text-primary-500 font-medium hover:text-primary-600"
            >
              Cancel
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="text-black font-semibold"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Campaign...
              </>
            ) : (
              'Create Campaign'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}