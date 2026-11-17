'use client';

import { useState, useEffect } from 'react';
import { getProjects, getChannels, getPrograms, getUsers } from '@/lib/queries';
import { PRIORITIES } from '@/lib/types';
import { StatusBadge, PriorityBadge, Pipeline } from '@/components/ui';
import { StatCard } from '@/components/ui/StatCard';
import { Input, Select, SelectItem, SelectTrigger, SelectContent, SelectValue, FormControl, Label } from '@/components/ui';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    programId: '',
    channelId: '',
    userId: '',
    priority: '',
  });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    async function loadData() {
      const allChannels = await getChannels();
      const allPrograms = await getPrograms();
      const allUsers = await getUsers();
      setChannels(allChannels);
      setPrograms(allPrograms);
      setUsers(allUsers);
      await loadProjects();
    }
    loadData();
  }, []);

  const loadProjects = async (f = filters) => {
    const result = await getProjects(f as any);
    setProjects(result);
  };

  const handleFilterChange = (field: keyof typeof filters, value: string) => {
    const next = { ...filters, [field]: value };
    setFilters(next);
    loadProjects(next);
  };

  const deleteProject = async (id: string) => {
    // Would implement deletion
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-display font-bold mb-6">Projects</h1>

      {/* Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Input
          placeholder="Search projects..."
          className="flex-1"
          onChange={(e) => handleFilterChange('search', e.target.value)}
        />
        <Select
          placeholder="Program"
          onValueChange={(v) => handleFilterChange('programId', v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {programs.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          placeholder="Channel"
          onValueChange={(v) => handleFilterChange('channelId', v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {channels.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          placeholder="Priority"
          onValueChange={(v) => handleFilterChange('priority', v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRIORITIES.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          placeholder="Assigned to"
          onValueChange={(v) => handleFilterChange('userId', v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {users.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button
          onClick={() => {}}
          className="btn btn-primary"
        >
          New Request
        </button>
      </div>

      {/* Projects table */}
      <div className="bg-surface rounded-lg overflow-hidden">
        <table className="w-full min-w-full">
          <thead>
            <tr>
              <th className="p-3 text-left text-xs font-semibold text-text-dim border-b">Project ID</th>
              <th className="p-3 text-left text-xs font-semibold text-text-dim border-b">Title</th>
              <th className="p-3 text-left text-xs font-semibold text-text-dim border-b">Program</th>
              <th className="p-3 text-left text-xs font-semibold text-text-dim border-b">Channels</th>
              <th className="p-3 text-left text-xs font-semibold text-text-dim border-b">Requester</th>
              <th className="p-3 text-left text-xs font-semibold text-text-dim border-b">Assigned</th>
              <th className="p-3 text-left text-xs font-semibold text-text-dim border-b">Priority</th>
              <th className="p-3 text-left text-xs font-semibold text-text-dim border-b">Status</th>
              <th className="p-3 text-left text-xs font-semibold text-text-dim border-b">Due Date</th>
              <th className="p-3 text-left text-xs font-semibold text-text-dim border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr key={project.id} className="border-b hover:bg-surface-2">
                <td className="p-3 font-medium">{project.project_code}</td>
                <td className="p-3">{project.title || project.project_code}</td>
                <td className="p-3">
                  {project.program?.name || '—'}
                </td>
                <td className="p-3">
                  {project.channels?.map((c: any) => (
                    <span key={c.id} className="text-xs mr-1">
                      {c.code}
                    </span>
                  )) || '—'}
                </td>
                <td className="p-3">{project.requester_email || '—'}</td>
                <td className="p-3">
                  {project.assigned_user_ids?.length
                    ? project.assigned_user_ids.map((u: string) => (
                        <span key={u} className="text-xs mr-1">
                          User
                        </span>
                      ))
                    : <span className="text-xs text-text-faint">Unassigned</span>}
                </td>
                <td className="p-3">
                  <PriorityBadge priority={project.priority} />
                </td>
                <td className="p-3">
                  <StatusBadge status={project.status} />
                </td>
                <td className="p-3">
                  {project.due_date || '—'}
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button className="text-sm text-blue-600 hover underline">View</button>
                    <button className="text-sm text-gray-600 hover underline">Edit</button>
                  </div>
                </td>
              </tr>
            ))}
            {projects.length === 0 && (
              <tr>
                <td colSpan={11} className="p-6 text-center text-text-faint">
                  No projects found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between">
        <span className="text-sm text-text-faint">
          Showing {Math.min((page - 1) * pageSize + 1, projects.length || 0)}-{Math.min(page * pageSize, projects.length || 0)} of {projects.length || 0} projects
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1 rounded hover:bg-surface-2"
          >
            Previous
          </button>
          <button
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 rounded hover:bg-surface-2"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}