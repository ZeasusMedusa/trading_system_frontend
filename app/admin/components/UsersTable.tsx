'use client';

/**
 * UsersTable Component
 *
 * Displays and manages users (CRUD operations).
 */

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { User, CreateUserRequest } from '@/lib/api/types';

export default function UsersTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    is_admin: false,
    activated: true,
  });

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      const data = await api.admin.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
      alert('Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!formData.username || !formData.password) {
      alert('Username and password are required');
      return;
    }

    try {
      await api.admin.createUser(formData as CreateUserRequest);
      await loadUsers();
      setShowCreateModal(false);
      resetForm();
      alert('User created successfully');
    } catch (error) {
      console.error('Failed to create user:', error);
      alert('Failed to create user');
    }
  }

  async function handleUpdate() {
    if (!editingUser) return;

    try {
      const updateData: Record<string, unknown> = {
        username: formData.username,
        is_admin: formData.is_admin,
        activated: formData.activated,
      };

      if (formData.password) {
        updateData.password = formData.password;
      }

      await api.admin.updateUser(editingUser.id, updateData);
      await loadUsers();
      setEditingUser(null);
      resetForm();
      alert('User updated successfully');
    } catch (error) {
      console.error('Failed to update user:', error);
      alert('Failed to update user');
    }
  }

  async function handleDelete(userId: number, username: string) {
    if (!confirm(`Delete user "${username}"?`)) return;

    try {
      await api.admin.deleteUser(userId);
      await loadUsers();
      alert('User deleted successfully');
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user');
    }
  }

  function resetForm() {
    setFormData({
      username: '',
      password: '',
      is_admin: false,
      activated: true,
    });
  }

  function openEditModal(user: User) {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      is_admin: user.is_admin,
      activated: user.activated,
    });
  }

  if (loading) {
    return <div className="text-white text-center py-8">Loading users...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Users Management</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg transition-all"
        >
          + Create User
        </button>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-3 px-4 text-gray-400 font-semibold">ID</th>
              <th className="text-left py-3 px-4 text-gray-400 font-semibold">Username</th>
              <th className="text-left py-3 px-4 text-gray-400 font-semibold">Admin</th>
              <th className="text-left py-3 px-4 text-gray-400 font-semibold">Activated</th>
              <th className="text-left py-3 px-4 text-gray-400 font-semibold">Created</th>
              <th className="text-right py-3 px-4 text-gray-400 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-gray-700/50 hover:bg-gray-700/20">
                <td className="py-3 px-4 text-gray-300">{user.id}</td>
                <td className="py-3 px-4 text-white font-medium">{user.username}</td>
                <td className="py-3 px-4">
                  {user.is_admin ? (
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">Admin</span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded text-xs">User</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  {user.activated ? (
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">Active</span>
                  ) : (
                    <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">Inactive</span>
                  )}
                </td>
                <td className="py-3 px-4 text-gray-400 text-sm">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="py-3 px-4 text-right space-x-2">
                  <button
                    onClick={() => openEditModal(user)}
                    className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded text-sm transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(user.id, user.username)}
                    className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-sm transition-colors"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingUser) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">
              {editingUser ? 'Edit User' : 'Create User'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Password {editingUser && '(leave empty to keep current)'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_admin}
                    onChange={(e) => setFormData({ ...formData, is_admin: e.target.checked })}
                    className="w-4 h-4"
                  />
                  Is Admin
                </label>

                <label className="flex items-center gap-2 text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.activated}
                    onChange={(e) => setFormData({ ...formData, activated: e.target.checked })}
                    className="w-4 h-4"
                  />
                  Activated
                </label>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={editingUser ? handleUpdate : handleCreate}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg transition-all"
              >
                {editingUser ? 'Update' : 'Create'}
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingUser(null);
                  resetForm();
                }}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
