import { prisma } from '../../lib/prisma';

interface SearchResults {
  projects: Array<{
    id: string;
    code: string;
    name: string;
    stage: string;
    status: string;
    description: string | null;
  }>;
  users: Array<{
    id: string;
    fullName: string;
    email: string;
    role: string;
  }>;
  total: number;
}

export class SearchService {
  /**
   * Выполняет глобальный поиск по проектам и пользователям
   * @param query - поисковый запрос (минимум 2 символа)
   * @param userId - ID текущего пользователя
   * @returns объект с результатами поиска
   */
  async search(query: string, userId: string): Promise<SearchResults> {
    // Минимум 2 символа для поиска
    if (!query || query.trim().length < 2) {
      return { projects: [], users: [], total: 0 };
    }

    const q = query.trim().toLowerCase();

    // Получаем роль пользователя
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: { select: { name: true } } },
    });

    const isAdmin = user?.role.name === 'Admin';

    // Фильтр доступа к проектам
    const projectFilter = isAdmin
      ? {}
      : {
          OR: [{ ownerId: userId }, { members: { some: { userId } } }],
        };

    // Ищем проекты
    const projects = await prisma.project.findMany({
      where: {
        ...projectFilter,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { code: { contains: q, mode: 'insensitive' } },
          {
            description: {
              contains: q,
              mode: 'insensitive',
            },
          },
        ],
        status: { not: 'CANCELLED' },
      },
      select: {
        id: true,
        code: true,
        name: true,
        stage: true,
        status: true,
        description: true,
      },
      take: 5,
      orderBy: { updatedAt: 'desc' },
    });

    // Ищем пользователей (только Admin)
    // Без фильтра isActive, так как это поле отсутствует в схеме
    const users = isAdmin
      ? await prisma.user.findMany({
          where: {
            OR: [
              {
                fullName: {
                  contains: q,
                  mode: 'insensitive',
                },
              },
              {
                email: {
                  contains: q,
                  mode: 'insensitive',
                },
              },
            ],
          },
          select: {
            id: true,
            fullName: true,
            email: true,
            role: { select: { name: true } },
          },
          take: 3,
        })
      : [];

    const formattedUsers = users.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      role: u.role.name,
    }));

    return {
      projects,
      users: formattedUsers,
      total: projects.length + formattedUsers.length,
    };
  }
}
