import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { 
  Save, UploadCloud, Building2, MapPin, Briefcase, 
  Users, CheckCircle2, AlertCircle, Plus, Trash2, X, Globe, Mail, Phone
} from 'lucide-react';
import { Heading3, Heading4, Body, Label } from '../design-system/Typography';
import Card from '../design-system/Card';
import Input, { Textarea, Select } from '../design-system/Input';
import Button from '../design-system/Button';
import Avatar from '../design-system/Avatar';

const fadeUp = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

export default function RecruiterProfile() {
  const { user } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [metrics, setMetrics] = useState({ completionPercentage: 0, completedSections: [], missingSections: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  const [formData, setFormData] = useState({
    companyName: '', companyLogo: '', industry: '', companySize: '', foundedYear: '', 
    website: '', headquarters: '', description: '', companyEmail: '', companyPhone: '',
    recruitmentEmail: '', recruitmentWebsite: '',
    jobTitle: '', phone: '',
    hiringPreferences: { departments: [], experienceLevels: [], employmentTypes: [], preferredSkills: [], preferredLocations: [], remotePolicy: 'Any', salaryBudget: '' },
    team: [],
    links: { linkedin: '', twitter: '' }
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/recruiter-profile');
      if (res.data.success) {
        setProfile(res.data.profile);
        setMetrics(res.data.metrics);
        setFormData(prev => ({ ...prev, ...res.data.profile }));
      }
    } catch (err) {
      console.error('Failed to fetch profile', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveStatus(null);
      const res = await api.put('/recruiter-profile', formData);
      if (res.data.success) {
        setProfile(res.data.profile);
        setMetrics(res.data.metrics);
        setSaveStatus('success');
        setTimeout(() => setSaveStatus(null), 3000);
      }
    } catch (err) {
      console.error('Save failed', err);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    const form = new FormData();
    form.append('file', file);

    try {
      const res = await api.post('/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        // Since the upload is generic, we just get a URL back and update our local form state
        setFormData(prev => ({ ...prev, [field]: res.data.fileUrl }));
      }
    } catch (err) {
      console.error('File upload failed', err);
      alert('File upload failed');
    }
  };

  const handleChange = (e, section, index, field) => {
    const value = e.target.value;
    if (section && index !== undefined && field) {
      const newArray = [...formData[section]];
      newArray[index][field] = value;
      setFormData({ ...formData, [section]: newArray });
    } else if (section) {
      setFormData({ ...formData, [section]: { ...formData[section], [e.target.name]: value } });
    } else {
      setFormData({ ...formData, [e.target.name]: value });
    }
  };

  const addArrayItem = (section, template) => {
    setFormData({ ...formData, [section]: [...formData[section], template] });
  };
  const removeArrayItem = (section, index) => {
    const newArray = [...formData[section]];
    newArray.splice(index, 1);
    setFormData({ ...formData, [section]: newArray });
  };

  // Chips handlers
  const handleChipAdd = (e, arrayPath, stateInput, setStateInput) => {
    if (e.key === 'Enter' && stateInput) {
      e.preventDefault();
      setFormData(prev => {
        const nested = { ...prev[arrayPath.parent] };
        nested[arrayPath.field] = [...nested[arrayPath.field], stateInput];
        return { ...prev, [arrayPath.parent]: nested };
      });
      setStateInput('');
    }
  };
  const handleChipRemove = (arrayPath, index) => {
    setFormData(prev => {
      const nested = { ...prev[arrayPath.parent] };
      const newArr = [...nested[arrayPath.field]];
      newArr.splice(index, 1);
      nested[arrayPath.field] = newArr;
      return { ...prev, [arrayPath.parent]: nested };
    });
  };

  const [deptInput, setDeptInput] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [locInput, setLocInput] = useState('');

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-page-in max-w-5xl mx-auto pb-24">
      
      {/* Header & Progress */}
      <div className="border-b border-white/[0.04] pb-4 pt-4 flex justify-between items-end">
        <div>
          <Heading3>Company Profile</Heading3>
          <div className="flex items-center gap-4 mt-2">
            <div className="w-48 h-2 bg-black/40 rounded-full overflow-hidden shadow-inner border border-white/[0.04]">
              <motion.div 
                initial={{ width: 0 }} 
                animate={{ width: `${metrics.completionPercentage}%` }} 
                className="h-full bg-gradient-to-r from-gold-dark to-gold"
              />
            </div>
            <span className="text-sm font-bold text-white">{metrics.completionPercentage}% Complete</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <AnimatePresence>
            {saveStatus === 'success' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-success bg-success/10 px-3 py-1.5 rounded-lg border border-success/20">
                <CheckCircle2 size={16} /> <span className="text-sm font-bold">Saved</span>
              </motion.div>
            )}
            {saveStatus === 'error' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-danger bg-danger/10 px-3 py-1.5 rounded-lg border border-danger/20">
                <AlertCircle size={16} /> <span className="text-sm font-bold">Error</span>
              </motion.div>
            )}
          </AnimatePresence>
          <Button onClick={handleSave} loading={isSaving} leftIcon={<Save size={16} />} className="shadow-gold">
            Save Profile
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column (Sticky Sidebar-ish) */}
        <div className="xl:col-span-1 space-y-6 xl:sticky xl:top-36 self-start">
          <Card className="flex flex-col items-center text-center">
            <div className="relative group mb-4">
              <div className="w-32 h-32 rounded-2xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center shadow-lg relative">
                {formData.companyLogo ? (
                  <img src={`http://localhost:5000${formData.companyLogo}`} alt="Company Logo" className="w-full h-full object-cover" />
                ) : (
                  <Building2 size={40} className="text-white/20" />
                )}
                <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm border-2 border-dashed border-gold/50">
                  <UploadCloud size={20} className="text-white" />
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'companyLogo')} />
                </label>
              </div>
            </div>
            <Heading4>{formData.companyName || 'Your Company'}</Heading4>
            <p className="text-sm text-text-secondary mt-1">{formData.industry || 'Industry'}</p>
          </Card>

          <Card hover={false}>
            <Card.Header className="mb-4"><Heading4>Missing Sections</Heading4></Card.Header>
            {metrics.missingSections.length === 0 ? (
              <p className="text-sm text-success font-medium flex items-center gap-2"><CheckCircle2 size={16}/> All sections complete!</p>
            ) : (
              <ul className="space-y-2">
                {metrics.missingSections.map(sec => (
                  <li key={sec} className="text-sm text-warning flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-warning" /> {sec}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Right Column (Form Sections) */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* Company Info */}
          <Card hover={false}>
            <Card.Header className="mb-6"><Heading4>Company Information</Heading4></Card.Header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Input label="Company Name" name="companyName" value={formData.companyName} onChange={handleChange} />
              <Input label="Industry" name="industry" value={formData.industry} onChange={handleChange} />
              <Input label="Company Size" name="companySize" value={formData.companySize} onChange={handleChange} placeholder="e.g. 50-200" />
              <Input label="Founded Year" name="foundedYear" value={formData.foundedYear} onChange={handleChange} />
              <Input label="Headquarters" name="headquarters" value={formData.headquarters} onChange={handleChange} leftIcon={<MapPin size={16}/>} />
              <Input label="Website" name="website" value={formData.website} onChange={handleChange} leftIcon={<Globe size={16}/>} />
            </div>
            <Textarea label="Company Description" name="description" value={formData.description} onChange={handleChange} rows={4} />
          </Card>

          {/* Contact Details */}
          <Card hover={false}>
            <Card.Header className="mb-6"><Heading4>Contact & Social</Heading4></Card.Header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Recruitment Email" name="recruitmentEmail" value={formData.recruitmentEmail} onChange={handleChange} leftIcon={<Mail size={16}/>} />
              <Input label="Company Phone" name="companyPhone" value={formData.companyPhone} onChange={handleChange} leftIcon={<Phone size={16}/>} />
              <Input label="LinkedIn URL" name="linkedin" value={formData.links.linkedin} onChange={(e) => handleChange(e, 'links')} />
              <Input label="Twitter URL" name="twitter" value={formData.links.twitter} onChange={(e) => handleChange(e, 'links')} />
            </div>
          </Card>

          {/* Hiring Preferences */}
          <Card hover={false}>
            <Card.Header className="mb-6"><Heading4>Hiring Preferences</Heading4></Card.Header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Select label="Remote Policy" name="remotePolicy" value={formData.hiringPreferences.remotePolicy} onChange={(e) => handleChange(e, 'hiringPreferences')}>
                <option>Any</option><option>Remote</option><option>Hybrid</option><option>On-site</option>
              </Select>
              <Input label="Salary Budget Range" name="salaryBudget" value={formData.hiringPreferences.salaryBudget} onChange={(e) => handleChange(e, 'hiringPreferences')} placeholder="$100k - $150k" />
            </div>

            {/* Arrays via Chips */}
            <div className="space-y-6">
              <div>
                <Label className="block mb-2">Hiring Departments</Label>
                <Input placeholder="Type and press Enter..." value={deptInput} onChange={(e) => setDeptInput(e.target.value)} onKeyDown={(e) => handleChipAdd(e, {parent: 'hiringPreferences', field: 'departments'}, deptInput, setDeptInput)} />
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.hiringPreferences.departments.map((dept, i) => (
                    <div key={i} className="flex items-center gap-2 bg-gold/10 border border-gold/20 pl-3 pr-2 py-1.5 rounded-full text-gold text-sm font-semibold">
                      {dept} <button onClick={() => handleChipRemove({parent: 'hiringPreferences', field: 'departments'}, i)} className="hover:text-white transition-colors"><X size={14}/></button>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <Label className="block mb-2">Preferred Skills</Label>
                <Input placeholder="Type and press Enter..." value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => handleChipAdd(e, {parent: 'hiringPreferences', field: 'preferredSkills'}, skillInput, setSkillInput)} />
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.hiringPreferences.preferredSkills.map((skill, i) => (
                    <div key={i} className="flex items-center gap-2 bg-info/10 border border-info/20 pl-3 pr-2 py-1.5 rounded-full text-info text-sm font-semibold">
                      {skill} <button onClick={() => handleChipRemove({parent: 'hiringPreferences', field: 'preferredSkills'}, i)} className="hover:text-white transition-colors"><X size={14}/></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Team */}
          <Card hover={false}>
            <Card.Header className="mb-6 flex justify-between items-center">
              <Heading4>Hiring Team</Heading4>
              <Button size="sm" variant="outline" leftIcon={<Plus size={14}/>} onClick={() => addArrayItem('team', { name: '', role: '', email: '' })}>
                Add Member
              </Button>
            </Card.Header>
            <div className="space-y-4">
              {formData.team.map((member, i) => (
                <div key={i} className="p-4 rounded-xl bg-black/40 border border-white/[0.04] relative group grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input label="Name" value={member.name} onChange={(e) => handleChange(e, 'team', i, 'name')} />
                  <Input label="Role" value={member.role} onChange={(e) => handleChange(e, 'team', i, 'role')} />
                  <Input label="Email" value={member.email} onChange={(e) => handleChange(e, 'team', i, 'email')} />
                  <button onClick={() => removeArrayItem('team', i)} className="absolute top-2 right-2 text-text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-md hover:bg-white/5"><Trash2 size={16}/></button>
                </div>
              ))}
              {formData.team.length === 0 && <p className="text-sm text-text-muted text-center py-4">No team members added yet.</p>}
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}
