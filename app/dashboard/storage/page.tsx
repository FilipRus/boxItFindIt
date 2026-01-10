"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import Link from "next/link";

interface StorageRoom {
  id: string;
  name: string;
  _count: {
    boxes: number;
  };
}

export default function StorageRoomsPage() {
  const router = useRouter();
  const [storageRooms, setStorageRooms] = useState<StorageRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewRoomModal, setShowNewRoomModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [editingRoom, setEditingRoom] = useState<StorageRoom | null>(null);
  const [editRoomName, setEditRoomName] = useState("");
  const [showEditRoomModal, setShowEditRoomModal] = useState(false);
  const [updatingRoom, setUpdatingRoom] = useState(false);

  useEffect(() => {
    fetchStorageRooms();
  }, []);

  const fetchStorageRooms = async () => {
    try {
      const response = await fetch("/api/storage-rooms");

      if (response.status === 401) {
        router.push("/auth/signin");
        return;
      }

      const data = await response.json();
      setStorageRooms(data.storageRooms || []);
    } catch (error) {
      console.error("Error fetching storage rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const createStorageRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingRoom(true);

    try {
      const response = await fetch("/api/storage-rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newRoomName }),
      });

      if (response.ok) {
        const data = await response.json();
        setStorageRooms([data.storageRoom, ...storageRooms]);
        setNewRoomName("");
        setShowNewRoomModal(false);
      }
    } catch (error) {
      console.error("Error creating storage room:", error);
    } finally {
      setCreatingRoom(false);
    }
  };

  const startEditRoom = (room: StorageRoom) => {
    setEditingRoom(room);
    setEditRoomName(room.name);
    setShowEditRoomModal(true);
  };

  const renameStorageRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom) return;
    setUpdatingRoom(true);

    try {
      const response = await fetch(`/api/storage-rooms/${editingRoom.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: editRoomName }),
      });

      if (response.ok) {
        const data = await response.json();
        setStorageRooms(storageRooms.map((room) => room.id === editingRoom.id ? data.storageRoom : room));
        setEditRoomName("");
        setEditingRoom(null);
        setShowEditRoomModal(false);
      }
    } catch (error) {
      console.error("Error renaming storage room:", error);
    } finally {
      setUpdatingRoom(false);
    }
  };

  const deleteStorageRoom = async (id: string) => {
    if (!confirm("Are you sure you want to delete this storage room? All boxes and items inside will be deleted.")) return;

    try {
      const response = await fetch(`/api/storage-rooms/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setStorageRooms(storageRooms.filter((room) => room.id !== id));
      }
    } catch (error) {
      console.error("Error deleting storage room:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">BoxIT - Storage Rooms</h1>
            <button
              onClick={() => signOut({ callbackUrl: "/auth/signin" })}
              className="text-gray-600 hover:text-gray-900"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {!loading && storageRooms.length > 0 && (
          <div className="mb-6 sm:mb-8 flex justify-end">
            <button
              onClick={() => setShowNewRoomModal(true)}
              className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium shadow-lg text-base"
            >
              New Storage Room
            </button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading storage rooms...</p>
          </div>
        ) : storageRooms.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-700 mb-4">No storage rooms yet</p>
            <button
              onClick={() => setShowNewRoomModal(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Create Your First Storage Room
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {storageRooms.map((room) => (
              <Link
                key={room.id}
                href={`/dashboard/storage/${room.id}`}
                className="bg-white rounded-lg shadow hover:shadow-lg transition p-4 sm:p-6 cursor-pointer block"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {room.name}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        startEditRoom(room);
                      }}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        deleteStorageRoom(room.id);
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="text-gray-600">{room._count?.boxes || 0} boxes</p>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Create Storage Room Modal */}
      {showNewRoomModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white rounded-none sm:rounded-lg w-full h-full sm:h-auto sm:max-w-md sm:w-full p-6 flex flex-col justify-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Create New Storage Room</h2>
            <form onSubmit={createStorageRoom}>
              <div className="mb-4">
                <label
                  htmlFor="roomName"
                  className="block text-sm font-medium text-gray-900 mb-2"
                >
                  Storage Room Name
                </label>
                <input
                  id="roomName"
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                  placeholder="e.g., Basement, Garage, Attic"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewRoomModal(false);
                    setNewRoomName("");
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingRoom}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
                >
                  {creatingRoom ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Storage Room Modal */}
      {showEditRoomModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white rounded-none sm:rounded-lg w-full h-full sm:h-auto sm:max-w-md sm:w-full p-6 flex flex-col justify-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Rename Storage Room</h2>
            <form onSubmit={renameStorageRoom}>
              <div className="mb-4">
                <label
                  htmlFor="editRoomName"
                  className="block text-sm font-medium text-gray-900 mb-2"
                >
                  Storage Room Name
                </label>
                <input
                  id="editRoomName"
                  type="text"
                  value={editRoomName}
                  onChange={(e) => setEditRoomName(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                  placeholder="e.g., Basement, Garage, Attic"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditRoomModal(false);
                    setEditRoomName("");
                    setEditingRoom(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingRoom}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
                >
                  {updatingRoom ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
