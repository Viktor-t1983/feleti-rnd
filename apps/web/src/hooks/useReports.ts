/**
 * useReports hook
 * Handles PDF download functionality
 */

import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export function useReports() {
  const downloadProjectReport = async (projectId: string, projectCode: string) => {
    const toastId = toast.loading('Генерируем PDF...');

    try {
      const response = await api.get(`/api/reports/project/${projectId}`, { responseType: 'blob' });

      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: 'application/pdf' })
      );
      const link = document.createElement('a');
      link.href = url;
      link.download = `project-${projectCode}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.dismiss(toastId);
      toast.success('PDF скачан!');
    } catch {
      toast.dismiss(toastId);
      toast.error('Ошибка генерации PDF');
    }
  };

  const downloadDashboardReport = async () => {
    const toastId = toast.loading('Генерируем отчёт...');

    try {
      const response = await api.get('/api/reports/dashboard', { responseType: 'blob' });

      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: 'application/pdf' })
      );
      const link = document.createElement('a');
      link.href = url;
      link.download = `dashboard-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.dismiss(toastId);
      toast.success('Отчёт скачан!');
    } catch {
      toast.dismiss(toastId);
      toast.error('Ошибка генерации отчёта');
    }
  };

  return {
    downloadProjectReport,
    downloadDashboardReport,
  };
}
