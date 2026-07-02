import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import api, { BACKEND_URL } from '../services/api';
import { 
  Save, UploadCloud, User, MapPin, Briefcase, FileText, 
  Code, Award, CheckCircle2, AlertCircle, Plus, Trash2, X
} from 'lucide-react';
import { Heading3, Heading4, Body, Label } from '../design-system/Typography';
import Card from '../design-system/Card';
import Input, { Textarea, Select } from '../design-system/Input';
import Button from '../design-system/Button';
import Avatar from '../design-system/Avatar';

// Animation variants
const fadeUp = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

export default function CandidateDashboard() {
  const { user } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [metrics, setMetrics] = useState({ completionPercentage: 0, completedSections: [], missingSections: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error' | null

  // Local form state
  const [formData, setFormData] = useState({
    phone: '', location: '', profilePhotoUrl: '',
    professionalTitle: '', yearsOfExperience: 0, currentCompany: '', currentRole: '',
    technicalSkills: [], softSkills: [],
    education: [], projects: [], experience: [], certifications: [],
    links: { github: '', linkedin: '', portfolio: '', leetcode: '', hackerrank: '' },
    preferences: { preferredRoles: [], preferredLocations: [], remotePreference: 'Any', expectedSalary: '', employmentType: 'Any' },
    resume: { uploaded: false, fileUrl: '', originalFileName: '', parsed: false, parsedText: '', parserVersion: '' }
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/profile/candidate');
      if (res.data.success) {
        setProfile(res.data.profile);
        setMetrics(res.data.metrics);
        // Merge fetched data with default state to prevent uncontrolled inputs
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
      const res = await api.put('/profile/candidate', formData);
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

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const form = new FormData();
    form.append('file', file);
    form.append('type', type);

    try {
      const res = await api.post('/profile/candidate/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setProfile(res.data.profile);
        setMetrics(res.data.metrics);
        setFormData(prev => ({ ...prev, ...res.data.profile }));
      }
    } catch (err) {
      console.error('File upload failed', err);
      alert('File upload failed');
    }
  };

  const handleChange = (e, section, index, field) => {
    const value = e.target.value;
    if (section && index !== undefined && field) {
      // Array of objects (e.g., experience)
      const newArray = [...formData[section]];
      newArray[index][field] = value;
      setFormData({ ...formData, [section]: newArray });
    } else if (section) {
      // Nested object (e.g., links.github)
      setFormData({ ...formData, [section]: { ...formData[section], [e.target.name]: value } });
    } else {
      // Top level
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

  // Tech Skill Chip Handlers
  const [techSkillInput, setTechSkillInput] = useState({ name: '', proficiency: 'Beginner', yearsOfExperience: 0 });
  const addTechSkill = () => {
    if (!techSkillInput.name) return;
    setFormData(prev => ({ ...prev, technicalSkills: [...prev.technicalSkills, techSkillInput] }));
    setTechSkillInput({ name: '', proficiency: 'Beginner', yearsOfExperience: 0 });
  };

  // Soft Skill Chip Handlers
  const [softSkillInput, setSoftSkillInput] = useState('');
  const addSoftSkill = (e) => {
    if (e.key === 'Enter' && softSkillInput) {
      e.preventDefault();
      setFormData(prev => ({ ...prev, softSkills: [...prev.softSkills, softSkillInput] }));
      setSoftSkillInput('');
    }
  };
  const removeSoftSkill = (index) => {
    const newSkills = [...formData.softSkills];
    newSkills.splice(index, 1);
    setFormData({ ...formData, softSkills: newSkills });
  };

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
          <Heading3>My Profile</Heading3>
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

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column (Sticky Sidebar-ish) */}
        <div className="xl:col-span-1 space-y-6 xl:sticky xl:top-36 self-start">
          <Card className="flex flex-col items-center text-center">
            <div className="relative group mb-4">
              <Avatar name={user?.fullName} size="xl" src={formData.profilePhotoUrl ? `${BACKEND_URL}${formData.profilePhotoUrl}` : null} />
              <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm border-2 border-dashed border-gold/50">
                <UploadCloud size={20} className="text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'avatar')} />
              </label>
            </div>
            <Heading4>{user?.fullName}</Heading4>
            <p className="text-sm text-text-secondary mt-1">{user?.email}</p>
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

          <Card hover={false}>
            <Card.Header className="mb-4">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-gold" />
                <Heading4>Resume</Heading4>
              </div>
            </Card.Header>
            {formData.resume?.uploaded ? (
              <div className="p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl mb-4">
                <p className="text-sm font-bold text-white truncate mb-1">{formData.resume.originalFileName}</p>
                <p className="text-[10px] text-success uppercase tracking-wider font-semibold">Uploaded</p>
              </div>
            ) : (
              <p className="text-sm text-text-secondary mb-4">No resume uploaded.</p>
            )}
            <label className="block w-full">
              <div className="w-full py-2.5 px-4 rounded-xl border border-dashed border-white/20 bg-black/40 hover:bg-white/[0.02] hover:border-gold/50 transition-all text-center cursor-pointer flex items-center justify-center gap-2">
                <UploadCloud size={16} className="text-text-muted" />
                <span className="text-sm font-semibold text-white">Upload PDF</span>
              </div>
              <input type="file" accept="application/pdf" className="hidden" onChange={(e) => handleFileUpload(e, 'resume')} />
            </label>
          </Card>
        </div>

        {/* Right Column (Form Sections) */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* Personal Info */}
          <Card hover={false}>
            <Card.Header className="mb-6"><Heading4>Personal Information</Heading4></Card.Header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} placeholder="+1 234 567 890" />
              <Input label="Location" name="location" value={formData.location} onChange={handleChange} placeholder="San Francisco, CA" />
              <Input label="Professional Title" name="professionalTitle" value={formData.professionalTitle} onChange={handleChange} placeholder="Senior Software Engineer" />
              <Input label="Years of Experience" name="yearsOfExperience" type="number" value={formData.yearsOfExperience} onChange={handleChange} />
              <Input label="Current Company" name="currentCompany" value={formData.currentCompany} onChange={handleChange} placeholder="Acme Corp" />
              <Input label="Current Role" name="currentRole" value={formData.currentRole} onChange={handleChange} placeholder="Frontend Developer" />
            </div>
          </Card>

          {/* Links */}
          <Card hover={false}>
            <Card.Header className="mb-6"><Heading4>Platform Links</Heading4></Card.Header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="LinkedIn URL" name="linkedin" value={formData.links.linkedin} onChange={(e) => handleChange(e, 'links')} placeholder="linkedin.com/in/username" />
              <Input label="GitHub URL" name="github" value={formData.links.github} onChange={(e) => handleChange(e, 'links')} placeholder="github.com/username" />
              <Input label="Portfolio URL" name="portfolio" value={formData.links.portfolio} onChange={(e) => handleChange(e, 'links')} placeholder="yourwebsite.com" />
              <Input label="LeetCode URL" name="leetcode" value={formData.links.leetcode} onChange={(e) => handleChange(e, 'links')} placeholder="leetcode.com/username" />
            </div>
          </Card>

          {/* Technical Skills */}
          <Card hover={false}>
            <Card.Header className="mb-6"><Heading4>Technical Skills</Heading4></Card.Header>
            <div className="flex items-end gap-3 mb-6 bg-black/20 p-4 rounded-xl border border-white/[0.04]">
              <Input label="Skill Name" value={techSkillInput.name} onChange={(e) => setTechSkillInput({...techSkillInput, name: e.target.value})} placeholder="e.g. React" className="flex-1" />
              <Select label="Proficiency" value={techSkillInput.proficiency} onChange={(e) => setTechSkillInput({...techSkillInput, proficiency: e.target.value})}>
                <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
              </Select>
              <Input label="Years" type="number" value={techSkillInput.yearsOfExperience} onChange={(e) => setTechSkillInput({...techSkillInput, yearsOfExperience: e.target.value})} className="w-20" />
              <Button type="button" onClick={addTechSkill} className="mb-[1px]">Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.technicalSkills.map((skill, i) => (
                <div key={i} className="flex items-center gap-2 bg-white/[0.04] border border-white/10 pl-3 pr-1 py-1 rounded-full shadow-inner group">
                  <span className="text-sm font-medium text-white">{skill.name}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${skill.proficiency === 'Advanced' ? 'bg-success/20 text-success' : skill.proficiency === 'Intermediate' ? 'bg-info/20 text-info' : 'bg-white/10 text-text-muted'}`}>{skill.proficiency}</span>
                  <span className="text-xs text-text-muted">{skill.yearsOfExperience}y</span>
                  <button onClick={() => removeArrayItem('technicalSkills', i)} className="p-1 rounded-full hover:bg-white/10 text-text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity"><X size={12}/></button>
                </div>
              ))}
            </div>
          </Card>

          {/* Soft Skills */}
          <Card hover={false}>
            <Card.Header className="mb-6"><Heading4>Soft Skills</Heading4></Card.Header>
            <Input 
              placeholder="Type a skill and press Enter..." 
              value={softSkillInput} 
              onChange={(e) => setSoftSkillInput(e.target.value)} 
              onKeyDown={addSoftSkill} 
              className="mb-4"
            />
            <div className="flex flex-wrap gap-2">
              {formData.softSkills.map((skill, i) => (
                <div key={i} className="flex items-center gap-2 bg-gold/10 border border-gold/20 pl-3 pr-2 py-1.5 rounded-full text-gold text-sm font-semibold">
                  {skill}
                  <button onClick={() => removeSoftSkill(i)} className="hover:text-white transition-colors"><X size={14}/></button>
                </div>
              ))}
            </div>
          </Card>

          {/* Work Experience */}
          <Card hover={false}>
            <Card.Header className="mb-6 flex justify-between items-center">
              <Heading4>Work Experience</Heading4>
              <Button size="sm" variant="outline" leftIcon={<Plus size={14}/>} onClick={() => addArrayItem('experience', { company: '', position: '', startDate: '', endDate: '', currentlyWorking: false, description: '' })}>
                Add Experience
              </Button>
            </Card.Header>
            <div className="space-y-6">
              {formData.experience.map((exp, i) => (
                <div key={i} className="p-6 rounded-xl bg-black/40 border border-white/[0.04] relative group">
                  <button onClick={() => removeArrayItem('experience', i)} className="absolute top-4 right-4 text-text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <Input label="Company" value={exp.company} onChange={(e) => handleChange(e, 'experience', i, 'company')} />
                    <Input label="Position" value={exp.position} onChange={(e) => handleChange(e, 'experience', i, 'position')} />
                    <Input label="Start Date" type="date" value={exp.startDate ? exp.startDate.split('T')[0] : ''} onChange={(e) => handleChange(e, 'experience', i, 'startDate')} />
                    <Input label="End Date" type="date" value={exp.endDate ? exp.endDate.split('T')[0] : ''} onChange={(e) => handleChange(e, 'experience', i, 'endDate')} disabled={exp.currentlyWorking} />
                  </div>
                  <label className="flex items-center gap-2 mb-4 cursor-pointer">
                    <input type="checkbox" checked={exp.currentlyWorking} onChange={(e) => {
                      const newArray = [...formData.experience];
                      newArray[i].currentlyWorking = e.target.checked;
                      setFormData({ ...formData, experience: newArray });
                    }} className="accent-gold" />
                    <span className="text-sm text-text-secondary">I currently work here</span>
                  </label>
                  <Textarea label="Description" rows={3} value={exp.description} onChange={(e) => handleChange(e, 'experience', i, 'description')} />
                </div>
              ))}
              {formData.experience.length === 0 && <p className="text-sm text-text-muted text-center py-4">No experience added yet.</p>}
            </div>
          </Card>

          {/* Projects */}
          <Card hover={false}>
            <Card.Header className="mb-6 flex justify-between items-center">
              <Heading4>Projects</Heading4>
              <Button size="sm" variant="outline" leftIcon={<Plus size={14}/>} onClick={() => addArrayItem('projects', { title: '', description: '', technologies: [], githubUrl: '', liveUrl: '', featured: false })}>
                Add Project
              </Button>
            </Card.Header>
            <div className="space-y-6">
              {formData.projects.map((proj, i) => (
                <div key={i} className="p-6 rounded-xl bg-black/40 border border-white/[0.04] relative group">
                  <button onClick={() => removeArrayItem('projects', i)} className="absolute top-4 right-4 text-text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
                  <div className="grid grid-cols-1 gap-4 mb-4">
                    <Input label="Project Title" value={proj.title} onChange={(e) => handleChange(e, 'projects', i, 'title')} />
                    <Textarea label="Description" rows={2} value={proj.description} onChange={(e) => handleChange(e, 'projects', i, 'description')} />
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="GitHub URL" value={proj.githubUrl} onChange={(e) => handleChange(e, 'projects', i, 'githubUrl')} />
                      <Input label="Live URL" value={proj.liveUrl} onChange={(e) => handleChange(e, 'projects', i, 'liveUrl')} />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={proj.featured} onChange={(e) => {
                      const newArray = [...formData.projects];
                      newArray[i].featured = e.target.checked;
                      setFormData({ ...formData, projects: newArray });
                    }} className="accent-gold" />
                    <span className="text-sm text-gold font-bold">Featured Project</span>
                  </label>
                </div>
              ))}
              {formData.projects.length === 0 && <p className="text-sm text-text-muted text-center py-4">No projects added yet.</p>}
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}
