'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FaShieldAlt,
  FaPlus,
  FaEdit,
  FaTrash,
  FaTimes,
  FaSave,
  FaSearch,
  FaExclamationTriangle,
  FaLock,
} from 'react-icons/fa';
import AppShell from '../../components/AppShell';
import { useTranslation } from '../../components/LanguageProvider';
import { getStoredUser, getToken, isAdminRole } from '../../libs/auth';

const EMPTY_FORM = {
  name: '',
  description: '',
  permission_ids: [],
};

export default function RolesManagementPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [authorized, setAuthorized] = useState(false);
  const [roles, setRoles] = useState([]);
  const [permissionGroups, setPermissionGroups] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    const storedUser = getStoredUser();
    if (!isAdminRole(storedUser?.role)) {
      router.replace(storedUser ? '/home' : '/login');
      return;
    }
    setAuthorized(true);
  }, [router]);

  useEffect(() => {
    if (authorized) {
      loadData();
    }
  }, [authorized]);

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  });

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [rolesRes, permissionsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/roles`, { headers: authHeaders() }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/permissions`, { headers: authHeaders() }),
      ]);
      const rolesData = await rolesRes.json();
      const permissionsData = await permissionsRes.json();
      if (!rolesRes.ok) throw new Error(rolesData.message || t('roles.loadFailed'));
      if (!permissionsRes.ok) throw new Error(permissionsData.message || t('roles.loadPermissionsFailed'));
      setRoles(rolesData.roles || []);
      setPermissionGroups(permissionsData.groups || {});
    } catch (err) {
      showNotification('error', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRoles = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return roles;
    return roles.filter(
      (role) =>
        role.name?.toLowerCase().includes(term) ||
        role.description?.toLowerCase().includes(term)
    );
  }, [roles, searchTerm]);

  const totalItems = filteredRoles.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedRoles = filteredRoles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const allPermissionIds = useMemo(
    () => Object.values(permissionGroups).flat().map((p) => p.id),
    [permissionGroups]
  );

  const togglePermission = (permissionId, target, setter) => {
    const ids = target.permission_ids || [];
    const next = ids.includes(permissionId)
      ? ids.filter((id) => id !== permissionId)
      : [...ids, permissionId];
    setter({ ...target, permission_ids: next });
  };

  const toggleGroup = (groupKey, target, setter) => {
    const groupIds = (permissionGroups[groupKey] || []).map((p) => p.id);
    const ids = new Set(target.permission_ids || []);
    const allSelected = groupIds.every((id) => ids.has(id));
    if (allSelected) {
      groupIds.forEach((id) => ids.delete(id));
    } else {
      groupIds.forEach((id) => ids.add(id));
    }
    setter({ ...target, permission_ids: [...ids] });
  };

  const selectAllPermissions = (target, setter) => {
    const ids = target.permission_ids || [];
    const allSelected = allPermissionIds.length > 0 && allPermissionIds.every((id) => ids.includes(id));
    setter({
      ...target,
      permission_ids: allSelected ? [] : [...allPermissionIds],
    });
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!formData.name.trim()) {
      return showNotification('error', t('roles.nameRequired'));
    }

    setIsSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/roles`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          permission_ids: formData.permission_ids,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || t('roles.createFailed'));
      setFormData(EMPTY_FORM);
      showNotification('success', t('roles.created'));
      loadData();
    } catch (err) {
      showNotification('error', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (!editingRole?.name?.trim()) {
      return showNotification('error', t('roles.nameRequired'));
    }

    setIsSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/roles/${editingRole.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
          name: editingRole.name,
          description: editingRole.description || '',
          permission_ids: editingRole.permission_ids || [],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || t('roles.updateFailed'));
      setEditingRole(null);
      showNotification('success', t('roles.updated'));
      loadData();
    } catch (err) {
      showNotification('error', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/roles/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || t('roles.deleteFailed'));
      setDeleteTarget(null);
      showNotification('success', t('roles.deleted'));
      loadData();
    } catch (err) {
      showNotification('error', err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const openEdit = (role) => {
    setEditingRole({
      ...role,
      permission_ids: [...(role.permission_ids || [])],
      description: role.description || '',
    });
  };

  const PermissionMatrix = ({ target, setter, compact = false }) => {
    const groupKeys = Object.keys(permissionGroups).sort();
    if (groupKeys.length === 0) {
      return <p className="text-sm text-slate-500">{t('roles.noPermissions')}</p>;
    }

    return (
      <div className={`space-y-3 ${compact ? '' : 'max-h-72 overflow-y-auto pr-1'}`}>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => selectAllPermissions(target, setter)}
            className="text-xs font-semibold text-[#233e90] hover:underline dark:text-sky-400"
          >
            {t('roles.toggleAll')}
          </button>
        </div>
        {groupKeys.map((groupKey) => {
          const perms = permissionGroups[groupKey] || [];
          const selectedCount = perms.filter((p) => (target.permission_ids || []).includes(p.id)).length;
          return (
            <div
              key={groupKey}
              className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-600 dark:bg-slate-900/50"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => toggleGroup(groupKey, target, setter)}
                  className="text-xs font-bold uppercase tracking-wide text-slate-600 hover:text-[#233e90] dark:text-slate-300"
                >
                  {groupKey}
                  <span className="ml-2 font-medium text-slate-400">
                    ({selectedCount}/{perms.length})
                  </span>
                </button>
              </div>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {perms.map((permission) => {
                  const checked = (target.permission_ids || []).includes(permission.id);
                  return (
                    <label
                      key={permission.id}
                      className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-white dark:hover:bg-slate-800"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => togglePermission(permission.id, target, setter)}
                        className="mt-0.5 rounded border-slate-300 text-[#233e90] focus:ring-[#233e90]"
                      />
                      <span className="min-w-0">
                        <span className="block font-medium text-slate-700 dark:text-slate-200">
                          {permission.action}
                        </span>
                        {permission.description && (
                          <span className="block text-xs text-slate-500 dark:text-slate-400">
                            {permission.description}
                          </span>
                        )}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (!authorized) {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-200 border-t-sky-600 dark:border-slate-700 dark:border-t-sky-400" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="py-8">
        {notification && (
          <div
            className={`mb-4 rounded-xl border px-4 py-3 text-sm font-medium ${
              notification.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300'
            }`}
          >
            {notification.message}
          </div>
        )}

        <div className="mb-6">
          <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-800 dark:text-slate-100 sm:text-3xl">
            <FaShieldAlt className="text-sky-600" />
            {t('roles.title')}
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t('roles.description')}</p>
        </div>

        <section className="mb-6 rounded-xl border border-sky-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <FaPlus className="text-sky-600" />
            {t('roles.createRole')}
          </h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t('roles.roleName')}
                </label>
                <input
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                  placeholder={t('roles.roleNamePlaceholder')}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t('roles.roleDescription')}
                </label>
                <input
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                  placeholder={t('roles.roleDescriptionPlaceholder')}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t('roles.permissions')}
              </label>
              <PermissionMatrix
                target={formData}
                setter={(next) => setFormData(next)}
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#233e90] px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-70"
              >
                <FaPlus />
                {isSaving ? t('common.saving') : t('roles.createRoleBtn')}
              </button>
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-xl border border-sky-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('roles.existingRoles')}</h2>
            <div className="relative w-full sm:w-72">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={t('roles.searchPlaceholder')}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="max-h-[600px] overflow-x-auto overflow-y-auto">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
              <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900/60">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="bg-slate-50 px-4 py-3 dark:bg-slate-900/60">{t('roles.roleName')}</th>
                  <th className="bg-slate-50 px-4 py-3 dark:bg-slate-900/60">{t('roles.roleDescription')}</th>
                  <th className="bg-slate-50 px-4 py-3 dark:bg-slate-900/60">{t('roles.permissions')}</th>
                  <th className="bg-slate-50 px-4 py-3 dark:bg-slate-900/60">{t('roles.users')}</th>
                  <th className="bg-slate-50 px-4 py-3 text-right dark:bg-slate-900/60">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                      {t('roles.loading')}
                    </td>
                  </tr>
                ) : paginatedRoles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                      {t('roles.noRolesFound')}
                    </td>
                  </tr>
                ) : (
                  paginatedRoles.map((role) => (
                    <tr key={role.id} className="text-sm text-slate-700 dark:text-slate-200">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 font-medium">
                          {role.name}
                          {role.is_system && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                              <FaLock className="text-[8px]" />
                              {t('roles.system')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="max-w-xs truncate px-4 py-3 text-slate-500 dark:text-slate-400">
                        {role.description || '—'}
                      </td>
                      <td className="px-4 py-3">{role.permission_count ?? 0}</td>
                      <td className="px-4 py-3">{role.user_count ?? 0}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(role)}
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                            title={t('roles.editRole')}
                          >
                            <FaEdit />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(role)}
                            disabled={role.is_system || (role.user_count || 0) > 0}
                            className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-800 dark:hover:bg-red-950/40"
                            title={t('roles.deleteRole')}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalItems > 0 && (
            <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 p-4 dark:border-slate-700 sm:flex-row">
              <p className="text-xs text-slate-500">
                {t('roles.showingRoles')
                  .replace('{from}', String((currentPage - 1) * itemsPerPage + 1))
                  .replace('{to}', String(Math.min(currentPage * itemsPerPage, totalItems)))
                  .replace('{total}', String(totalItems))}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold disabled:opacity-40 dark:border-slate-600"
                >
                  {t('common.previous')}
                </button>
                <span className="text-xs text-slate-500">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold disabled:opacity-40 dark:border-slate-600"
                >
                  {t('common.next')}
                </button>
              </div>
            </div>
          )}
        </section>

        {editingRole && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-800 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{t('roles.editRole')}</h3>
                <button
                  type="button"
                  onClick={() => setEditingRole(null)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <FaTimes />
                </button>
              </div>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {t('roles.roleName')}
                    </label>
                    <input
                      value={editingRole.name}
                      onChange={(e) => setEditingRole((prev) => ({ ...prev, name: e.target.value }))}
                      disabled={editingRole.is_system}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                      required
                    />
                    {editingRole.is_system && (
                      <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">{t('roles.systemNameLocked')}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {t('roles.roleDescription')}
                    </label>
                    <input
                      value={editingRole.description || ''}
                      onChange={(e) => setEditingRole((prev) => ({ ...prev, description: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {t('roles.permissions')}
                  </label>
                  <PermissionMatrix
                    target={editingRole}
                    setter={(next) => setEditingRole(next)}
                    compact
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingRole(null)}
                    className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 dark:border-slate-600 dark:text-slate-300"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#233e90] px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-70"
                  >
                    <FaSave />
                    {isSaving ? t('common.saving') : t('roles.saveChanges')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-800 sm:p-6">
              <div className="mb-3 flex items-center gap-2 text-red-600">
                <FaExclamationTriangle />
                <h3 className="text-lg font-bold">{t('roles.deleteRoleTitle')}</h3>
              </div>
              <p className="mb-5 text-sm text-slate-600 dark:text-slate-300">
                {t('roles.deleteRoleDesc').replace('{name}', deleteTarget.name)}
              </p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 dark:border-slate-600 dark:text-slate-300"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-70"
                >
                  {isDeleting ? t('common.deleting') : t('roles.deleteRole')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
