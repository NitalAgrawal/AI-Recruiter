import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Save, Send, Eye, ArrowLeft, Plus, X } from 'lucide-react';
import { Heading3, Heading4, Label } from '../design-system/Typography';
import Card from '../design-system/Card';
import Input, { Select } from '../design-system/Input';
import Button from '../design-system/Button';
import RichTextEditor from '../components/RichTextEditor';

export default function CreateJob() {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '', department: '', employmentType: 'Full-time', workplaceType: 'Onsite', location: '',
    visibility: 'Public', description: '',
    requiredSkills: [], preferredSkills: [],
    requiredExperience: '', educationRequirement: '',
    salaryMin: '', salaryMax: '', currency: 'USD',
    openings: 1, applicationDeadline: '', hiringManager: '',
    applicationSettings: { maxApplications: 0, autoClose: false, allowResumeUpdate: true, allowCoverLetter: false },
    aiEnabled: true
  });

  const handleChange = (e, section) => {
    if (section) {
      setFormData(prev => ({ ...prev, [section]: { ...prev[section], [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value } }));
    } else {
      setFormData(prev => ({ ...prev, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
    }
  };

  const handleChipAdd = (e, field, inputState, setInputState) => {
    if (e.key === 'Enter' && inputState) {
      e.preventDefault();
      setFormData(prev => ({ ...prev, [field]: [...prev[field], inputState] }));
      setInputState('');
    }
  };
  const handleChipRemove = (field, index) => {
    setFormData(prev => {
      const arr = [...prev[field]];
      arr.splice(index, 1);
      return { ...prev, [field]: arr };
    });
  };

  const [reqSkillInput, setReqSkillInput] = useState('');
  const [prefSkillInput, setPrefSkillInput] = useState('');

  const saveJob = async (status) => {
    try {
      setIsSaving(true);
      const res = await api.post('/jobs', { ...formData, status });
      if (res.data.success) {
        navigate('/jobs');
      }
    } catch (err) {
      console.error('Failed to save job', err);
      alert(err.response?.data?.message || 'Failed to save job');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-24 animate-page-in">
      
      {/* Header */}
      <div className="sticky top-20 z-30 bg-primary/80 backdrop-blur-xl border-b border-white/[0.04] pb-4 pt-4 -mx-8 px-8 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/jobs')} className="p-2 hover:bg-white/5 rounded-full transition-colors text-text-muted hover:text-white">
            <ArrowLeft size={20} />
          </button>
          <Heading3>Create New Job</Heading3>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" leftIcon={<Save size={16}/>} onClick={() => saveJob('Draft')} loading={isSaving}>Save Draft</Button>
          <Button leftIcon={<Send size={16}/>} onClick={() => saveJob('Published')} loading={isSaving} className="shadow-gold">Publish Job</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column (Main Form) */}
        <div className="xl:col-span-2 space-y-8">
          
          <Card hover={false}>
            <Card.Header className="mb-6"><Heading4>Basic Information</Heading4></Card.Header>
            <div className="space-y-6">
              <Input label="Job Title" name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Senior Frontend Engineer" />
              
              <div className="grid grid-cols-2 gap-6">
                <Select label="Employment Type" name="employmentType" value={formData.employmentType} onChange={handleChange}>
                  <option>Full-time</option><option>Part-time</option><option>Internship</option>
                  <option>Contract</option><option>Freelance</option><option>Apprenticeship</option>
                </Select>
                <Select label="Workplace Type" name="workplaceType" value={formData.workplaceType} onChange={handleChange}>
                  <option>Onsite</option><option>Remote</option><option>Hybrid</option>
                </Select>
                <Input label="Location" name="location" value={formData.location} onChange={handleChange} placeholder="e.g. New York, NY" />
                <Input label="Department" name="department" value={formData.department} onChange={handleChange} placeholder="e.g. Engineering" />
              </div>
            </div>
          </Card>

          <Card hover={false}>
            <Card.Header className="mb-6"><Heading4>Job Description</Heading4></Card.Header>
            <Label className="block mb-2">Description & Responsibilities</Label>
            <RichTextEditor value={formData.description} onChange={(val) => setFormData({...formData, description: val})} />
          </Card>

          <Card hover={false}>
            <Card.Header className="mb-6"><Heading4>Skills & Requirements</Heading4></Card.Header>
            <div className="space-y-6">
              
              <div>
                <Label className="block mb-2">Required Skills</Label>
                <Input placeholder="Type and press Enter..." value={reqSkillInput} onChange={(e) => setReqSkillInput(e.target.value)} onKeyDown={(e) => handleChipAdd(e, 'requiredSkills', reqSkillInput, setReqSkillInput)} />
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.requiredSkills.map((skill, i) => (
                    <div key={i} className="flex items-center gap-2 bg-gold/10 border border-gold/20 pl-3 pr-2 py-1.5 rounded-full text-gold text-sm font-semibold">
                      {skill} <button onClick={() => handleChipRemove('requiredSkills', i)} className="hover:text-white transition-colors"><X size={14}/></button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="block mb-2">Preferred Skills</Label>
                <Input placeholder="Type and press Enter..." value={prefSkillInput} onChange={(e) => setPrefSkillInput(e.target.value)} onKeyDown={(e) => handleChipAdd(e, 'preferredSkills', prefSkillInput, setPrefSkillInput)} />
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.preferredSkills.map((skill, i) => (
                    <div key={i} className="flex items-center gap-2 bg-info/10 border border-info/20 pl-3 pr-2 py-1.5 rounded-full text-info text-sm font-semibold">
                      {skill} <button onClick={() => handleChipRemove('preferredSkills', i)} className="hover:text-white transition-colors"><X size={14}/></button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <Input label="Required Experience" name="requiredExperience" value={formData.requiredExperience} onChange={handleChange} placeholder="e.g. 3-5 Years" />
                <Input label="Education Requirement" name="educationRequirement" value={formData.educationRequirement} onChange={handleChange} placeholder="e.g. Bachelor's in CS" />
              </div>
            </div>
          </Card>

          <Card hover={false}>
            <Card.Header className="mb-6"><Heading4>Compensation</Heading4></Card.Header>
            <div className="grid grid-cols-3 gap-6">
              <Input label="Minimum Salary" name="salaryMin" type="number" value={formData.salaryMin} onChange={handleChange} placeholder="80000" />
              <Input label="Maximum Salary" name="salaryMax" type="number" value={formData.salaryMax} onChange={handleChange} placeholder="120000" />
              <Select label="Currency" name="currency" value={formData.currency} onChange={handleChange}>
                <option>USD</option><option>EUR</option><option>GBP</option><option>INR</option>
              </Select>
            </div>
          </Card>
        </div>

        {/* Right Column (Settings) */}
        <div className="xl:col-span-1 space-y-6">
          <Card hover={false}>
            <Card.Header className="mb-4"><Heading4>Hiring Settings</Heading4></Card.Header>
            <div className="space-y-4">
              <Select label="Visibility" name="visibility" value={formData.visibility} onChange={handleChange}>
                <option>Public</option><option>Private</option><option>Campus Only</option>
              </Select>
              <Input label="Number of Openings" name="openings" type="number" value={formData.openings} onChange={handleChange} />
              <Input label="Application Deadline" name="applicationDeadline" type="date" value={formData.applicationDeadline} onChange={handleChange} />
              <Input label="Hiring Manager" name="hiringManager" value={formData.hiringManager} onChange={handleChange} />
            </div>
          </Card>

          <Card hover={false}>
            <Card.Header className="mb-4"><Heading4>Application Rules</Heading4></Card.Header>
            <div className="space-y-4">
              <Input label="Max Applications (0 = No limit)" name="maxApplications" type="number" value={formData.applicationSettings.maxApplications} onChange={(e) => handleChange(e, 'applicationSettings')} />
              <label className="flex items-center gap-3 cursor-pointer p-3 border border-white/10 rounded-xl hover:bg-white/5 transition-colors">
                <input type="checkbox" name="allowCoverLetter" checked={formData.applicationSettings.allowCoverLetter} onChange={(e) => handleChange(e, 'applicationSettings')} className="accent-gold" />
                <span className="text-sm font-medium">Require Cover Letter</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer p-3 border border-white/10 rounded-xl hover:bg-white/5 transition-colors">
                <input type="checkbox" name="allowResumeUpdate" checked={formData.applicationSettings.allowResumeUpdate} onChange={(e) => handleChange(e, 'applicationSettings')} className="accent-gold" />
                <span className="text-sm font-medium">Allow Resume Updates</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer p-3 border border-white/10 rounded-xl hover:bg-white/5 transition-colors">
                <input type="checkbox" name="autoClose" checked={formData.applicationSettings.autoClose} onChange={(e) => handleChange(e, 'applicationSettings')} className="accent-gold" />
                <span className="text-sm font-medium">Auto-close on Deadline</span>
              </label>
            </div>
          </Card>

          <Card hover={false} className="border-gold/30 bg-gold/5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center">
                <span className="text-gold font-bold text-lg">AI</span>
              </div>
              <Heading4>AI Matching</Heading4>
            </div>
            <p className="text-sm text-text-secondary mb-4">Enable AI to automatically parse this job description and find semantic matches.</p>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="aiEnabled" checked={formData.aiEnabled} onChange={handleChange} className="accent-gold w-5 h-5" />
              <span className="font-bold text-white">Enable AI Processing</span>
            </label>
          </Card>

        </div>
      </div>
    </div>
  );
}
