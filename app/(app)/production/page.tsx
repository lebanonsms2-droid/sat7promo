'use client';

import { STATUSES, PROMO_TYPES, PRIORITIES, type PromoStatus } from '@/lib/types';
import { getProjects, getChannels, getPrograms } from '@/lib/queries';
import { updateProjectStatusAction } from '@/app/actions';
import { StatusBadge, PriorityBadge, Pipeline } from '@/components/ui';
import { useState, useEffect } from 'react';

interface KanbanColumn {
  status: PromoStatus;
  title: string;
  projects: any[];
}

export default function ProductionBoard() {
  const [projects, setProjects] = useState<any[]>([]);
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [draggingProject, setDraggingProject] = useState<any | null>(null);

  useEffect(() => {
    async function loadData() {
      const allProjects = await getProjects();
      setProjects(allProjects);

      // Build columns from pipeline statuses
      const statusColumns: KanbanColumn[] = STATUSES.map((status) => ({
        status,
        title: status,
        projects: allProjects.filter((p: any) => p.status === status),
      }));
      setColumns(statusColumns);
    }
    loadData();
  }, []);

  const handleStatusChange = async (projectId: string, newStatus: PromoStatus) => {
    try {
      await updateProjectStatusAction(projectId, newStatus);

      // Refresh data
      setProjects(prev => prev.map((p) => p.id === projectId ? { ...p, status: newStatus } : p));
      setColumns(prev =>
        prev.map((col) => {
          const newProjects = col.projects.map((p: any) =>
            p.id === projectId ? { ...p, status: newStatus } : p
          );
          return {
            ...col,
            projects: newProjects.filter((p: any) => p.status === col.status),
          };
        })
      );
    } catch (err) {
      console.error('Status change error:', err);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-display font-bold mb-6">Production Board</h1>

      {/* Kanban Columns */}
      <div className="grid gap-4">
        {columns.map((column) => (
          <div
            key={column.status}
            className="bg-surface rounded-lg p-6 h-[500px] overflow-y-auto"
          >
            <h2 className="text-sm uppercase tracking-wide font-semibold text-text-dim mb-3">
              {column.title.charAt(0).toUpperCase() + column.title.slice(1)}
            </h2>
            {column.projects.length === 0 && (
              <p className="text-text-faint text-sm text-center py-8">
                No projects in this status
              </p>
            )}
            {column.projects.map((project) => (
              <div
                key={project.id}
                className="bg-surface-2 rounded p-4 mb-2 cursor-pointer hover:bg-surface transition-colors"
                onClick={() => {
                  // Would navigate to project details
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium">{project.project_code}</span>
                  <StatusBadge status={project.status} />
                </div>
                <p className="text-xs text-text-faint mb-1">{project.title || project.project_code}</p>
                <p className="text-caption text-text-dim">
                  {project.due_date || 'No due date'} •
                  {project.priority} priority
                </p>
                <Pipeline status={project.status} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}