'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PRIORITIES } from '@/lib/types';
import { getChannels, getPrograms, getUsers, getDepartments } from '@/lib/queries';
import { createProjectAction } from '@/app/actions';
import { PriorityBadge, StatusBadge } from '@/components/ui';
import { StatCard } from '@/components/ui/StatCard';
import { Input, Select, SelectItem, SelectTrigger, SelectContent, SelectValue, FormControl, Label } from '@/components/ui';
import { Button } from '@/components/ui';

export default function NewRequestForm() {
  const [formData, setFormData] = useState({
    projectId: '',
    programCode: '',
    requestDate: new Date().toISOString().split('T')[0],
    requestedBy: '',
    requestingDept: 'Programming' as const,
    requesterEmail: '',
    requesterPhone: '',
    promoType: 'TV Promo' as const,
    priority: 'Normal' as const,
    deadline: '',
    notes: '',
    emailSubject: '',
    requestSource: 'Email' as const,
  });

  const [programs, setPrograms] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [depts, setDepts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [assignedUsers, setAssignedUsers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      const allPrograms = await getPrograms();
      const allChannels = await getChannels();
      const allDepts = getDepartments();
      const allUsers = await getUsers();
      setPrograms(allPrograms);
      setChannels(allChannels);
      setDepts(allDepts);
      setUsers(allUsers);
    }
    loadData();
  }, []);

  const handleChange = (e: React.ChangeEvent<any>) => {
    const { name, value, type, files } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? value : type === 'file' ? files[0]?.name || '' : value,
    });
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData({ ...formData, [name]: checked });
  };

  const handleProgramChange = (programId: string | null) => {
    setSelectedProgram(programId);
    // When program changes, could fetch related data
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      // Validate required fields
      if (!formData.requesterEmail) throw new Error('Requester email is required');
      if (!formData.requesterPhone) throw new Error('Requester phone is required');
      if (!selectedProgram) throw new Error('Select a program');
      if (selectedChannels.length === 0) throw new Error('Select at least one channel');
      if (!formData.deadline) throw new Error('Deadline is required');

      // Create the project server-side (RLS + auth enforced in the action)
      const created = await createProjectAction({
        program_id: selectedProgram,
        channel_ids: selectedChannels,
        promo_type: formData.promoType,
        priority: formData.priority,
        assigned_user_ids: assignedUsers,
        requested_by: formData.requestedBy,
        requesting_dept: formData.requestingDept,
        requester_email: formData.requesterEmail,
        requester_phone: formData.requesterPhone,
        request_date: formData.requestDate,
        due_date: formData.deadline,
        notes: formData.notes,
      });

      setSuccess(true);
      setSuccessMessage(`Project ${created.project_code} created successfully.`);
      setIsSubmitting(false);
      router.refresh();
      
      // Reset form
      setFormData({
        projectId: '',
        programCode: '',
        requestDate: new Date().toISOString().split('T')[0],
        requestedBy: '',
        requestingDept: 'Programming' as const,
        requesterEmail: '',
        requesterPhone: '',
        promoType: 'TV Promo' as const,
        priority: 'Normal' as const,
        deadline: '',
        notes: '',
        emailSubject: '',
        requestSource: 'Email' as const,
      });
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-display font-bold mb-6">New Promo Request</h1>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6">
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded mb-6">
          <p>
            {successMessage || 'Project created successfully!'}{' '}
            <a href="/projects" className="underline font-medium">
              View your projects
            </a>
          </p>
        </div>
      )}

      <form onSubmit={onSubmit} className="bg-surface rounded-lg p-6 max-w-2xl">
        {/* Section A: Request Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <Label>Project ID</Label>
            <Input
              name="projectId"
              value={formData.projectId}
              onChange={handleChange}
              disabled
              className="bg-transparent"
            />
          </div>
          <div>
            <Label>Request Date</Label>
            <Input
              name="requestDate"
              type="date"
              value={formData.requestDate}
              onChange={handleChange}
              className="bg-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <Label>Requested By</Label>
            <Input
              name="requestedBy"
              value={formData.requestedBy}
              onChange={handleChange}
              placeholder="John Doe"
              className="bg-transparent"
            />
          </div>
          <div>
            <Label>Dept</Label>
            <Select
              onValueChange={(v) => setFormData({ ...formData, requestingDept: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {depts.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Request Source</Label>
            <Select
              onValueChange={(v) => setFormData({ ...formData, requestSource: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Email">Email</SelectItem>
                <SelectItem value="Manual Entry">Manual Entry</SelectItem>
                <SelectItem value="Internal Communication">Internal Communication</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <Label>Requester Email</Label>
            <Input
              name="requesterEmail"
              type="email"
              value={formData.requesterEmail}
              onChange={handleChange}
              placeholder="requester@sat7.org"
              required
              className="bg-transparent"
            />
          </div>
          <div>
            <Label>Requester Phone</Label>
            <Input
              name="requesterPhone"
              type="tel"
              value={formData.requesterPhone}
              onChange={handleChange}
              placeholder="+212 5xx xxxxxxx"
              required
              className="bg-transparent"
            />
          </div>
          <div>
            <Label>Promo/Spot Type</Label>
            <Select
              onValueChange={(v) => setFormData({ ...formData, promoType: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TV Promo">TV Promo</SelectItem>
                <SelectItem value="TV Spot">TV Spot</SelectItem>
                <SelectItem value="Program Promo">Program Promo</SelectItem>
                <SelectItem value="Program Launch Promo">Program Launch Promo</SelectItem>
                <SelectItem value="Social/Channel Content">Social/Channel Content</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Priority</Label>
            <Select
              onValueChange={(v) => setFormData({ ...formData, priority: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Normal">Normal</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <Label>Deadline / Due Date</Label>
            <Input
              name="deadline"
              type="date"
              value={formData.deadline}
              onChange={handleChange}
              required
              className="bg-transparent"
            />
          </div>
          <div>
            <Label>Additional Notes</Label>
            <textarea
              name="notes"
              rows={3}
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any additional information..."
              className="bg-transparent w-full rounded p-2 text-input"
            />
          </div>
        </div>

        {/* Section B: Program Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <Label>Program</Label>
            <Select
              onValueChange={(v) => handleProgramChange(v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Select a program</SelectItem>
                {programs.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Program Code</Label>
            <Input
              name="programCode"
              value={formData.programCode || ''}
              onChange={handleChange}
              disabled
              className="bg-transparent"
            />
          </div>
        </div>

        {/* Section C: Channel Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <Label>Channel Selection</Label>
            <p className="text-sm text-text-faint mb-2">
              Select one or more channels for this promo
            </p>
            <Select
              multiple
              onValueChange={(v) => setSelectedChannels(v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {channels.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <div className="flex items-center gap-2">
                      <span>{c.name}</span>
                      <span className="text-xs text-text-faint">{c.code}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Assignment</Label>
            <p className="text-sm text-text-faint mb-2">
              Assign to team members
            </p>
            <Select
              multiple
              placeholder="Select team members"
              onValueChange={(v) => setAssignedUsers(v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {users.map((user: any) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name || user.email} ({user.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Section D: Submission */}
        <div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Submit Request'}
          </Button>
          {error && (
            <button
              type="button"
              onClick={() => setError(null)}
              className="mt-2 text-sm text-red-600 hover underline"
            >
              Clear error
            </button>
          )}
        </div>
      </form>
    </div>
  );
}