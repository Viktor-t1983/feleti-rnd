/**
 * Calendar Service
 * Business logic for calendar events (project deadlines)
 */

import { prisma } from '../../lib/prisma';

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  color: string;
  textColor: string;
  extendedProps: {
    code: string;
    stage: string;
    status: string;
    budget: number;
    spent: number;
    creator: string;
    isOverdue: boolean;
    daysLeft: number;
    progress: number;
  };
}

export class CalendarService {
  /**
   * Get calendar events for projects
   * Admin sees all non-cancelled projects
   * Regular users see their own projects and projects they're members of
   */
  async getEvents(userId: string): Promise<CalendarEvent[]> {
    // Get user role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: { select: { name: true } } },
    });

    const isAdmin = user?.role.name === 'Admin';

    // Build filter based on role
    const filter = isAdmin
      ? { status: { not: 'CANCELLED' as const } }
      : {
          status: { not: 'CANCELLED' as const },
          OR: [{ ownerId: userId }, { members: { some: { userId } } }],
        };

    // Get projects with owner info
    const projects = await prisma.project.findMany({
      where: filter,
      include: {
        owner: { select: { fullName: true } },
      },
      orderBy: { targetDate: 'asc' },
    });

    const now = new Date();

    return projects
      .filter((p) => p.targetDate !== null)
      .map((project) => {
        const targetDate = new Date(project.targetDate!);
        const startDate = project.startDate
          ? new Date(project.startDate)
          : new Date(project.createdAt);

        // Format dates to YYYY-MM-DD
        const startDateStr = startDate.toISOString().split('T')[0] ?? '';
        const targetDateStr = targetDate.toISOString().split('T')[0] ?? '';

        // Calculate days left
        const daysLeft = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        const isOverdue = daysLeft < 0 && project.status !== 'COMPLETED';
        const isUrgent = daysLeft >= 0 && daysLeft <= 7;
        const isWarning = daysLeft > 7 && daysLeft <= 30;

        // Calculate progress
        const budget = Number(project.budget) || 0;
        const spent = Number(project.spent) || 0;
        const progress = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;

        // Determine color based on status and deadline
        let color = '#3b82f6'; // blue - normal
        if (project.status === 'COMPLETED') {
          color = '#6b7280'; // gray
        } else if (isOverdue) {
          color = '#ef4444'; // red
        } else if (isUrgent) {
          color = '#f59e0b'; // orange
        } else if (isWarning) {
          color = '#8b5cf6'; // purple
        } else if (project.status === 'ON_HOLD') {
          color = '#6b7280'; // gray
        }

        return {
          id: project.id,
          title: `${project.code}: ${project.name}`,
          start: startDateStr,
          end: targetDateStr,
          color,
          textColor: '#ffffff',
          extendedProps: {
            code: project.code,
            stage: project.stage,
            status: project.status,
            budget,
            spent,
            creator: project.owner.fullName,
            isOverdue,
            daysLeft,
            progress,
          },
        } as CalendarEvent;
      });
  }
}
