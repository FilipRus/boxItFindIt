"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import Link from "next/link";
import ThemeToggle from "@/app/components/ThemeToggle";

interface StorageRoom {
  id: string;
  name: string;
  _count: {
    boxes: number;
  };
}

interface Label {
  id: string;
  name: string;
}

interface ItemLabel {
  label: Label;
}

interface SearchItem {
  id: string;
  name: string;
  description: string | null;
  labels?: ItemLabel[];
  box: {
    id: string;
    name: string;
    storageRoom: {
      id: string;
      name: string;
    };
  };
}

interface SearchBox {
  id: string;
  name: string;
  storageRoom: {
    id: string;
    name: string;
  };
  _count: {
    items: number;
  };
}

interface SearchResults {
  items: SearchItem[];
  boxes: SearchBox[];
  storageRooms: StorageRoom[];
}

export default function StorageRoomsPage() {
  const router = useRouter();
  const [storageRooms, setStorageRooms] = useState<StorageRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [searching, setSearching] = useState(false);
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

  useEffect(() => {
    // Show loading state immediately
    if (searchQuery) {
      setSearching(true);
    }

    const timer = setTimeout(() => {
      if (searchQuery) {
        performSearch(searchQuery);
      } else {
        setSearchResults(null);
        setSearching(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showEditRoomModal) {
          setShowEditRoomModal(false);
          setEditingRoom(null);
          setEditRoomName("");
        } else if (showNewRoomModal) {
          setShowNewRoomModal(false);
          setNewRoomName("");
        }
      }
    };

    if (showEditRoomModal || showNewRoomModal) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [showEditRoomModal, showNewRoomModal]);

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

  const performSearch = async (query: string) => {
    setSearching(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      }
    } catch (error) {
      console.error("Error searching:", error);
    } finally {
      setSearching(false);
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">BoxIT</h1>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {!loading && storageRooms.length > 0 && (
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search items, boxes, or rooms..."
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 text-sm bg-white dark:bg-gray-800"
                />
              </div>
              <button
                onClick={() => setShowNewRoomModal(true)}
                className="w-full sm:w-auto bg-indigo-600 text-white dark:bg-indigo-500 px-5 py-2.5 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-400 transition font-medium text-sm"
              >
                New Room
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
                <div className="animate-skeleton h-5 w-32 mb-3"></div>
                <div className="animate-skeleton h-4 w-16"></div>
              </div>
            ))}
          </div>
        ) : searchQuery && searchResults ? (
          <div>
            {searching && (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
                    <div className="animate-skeleton h-5 w-48 mb-3"></div>
                    <div className="animate-skeleton h-4 w-24"></div>
                  </div>
                ))}
              </div>
            )}

            {!searching && (searchResults.items.length === 0 && searchResults.boxes.length === 0 && searchResults.storageRooms.length === 0) && (
              <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                <p className="text-gray-900 dark:text-gray-100 mb-1">No results found for &quot;{searchQuery}&quot;</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mb-4">Try a different search term</p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 underline transition"
                >
                  Clear search
                </button>
              </div>
            )}

            {!searching && (searchResults.items.length > 0 || searchResults.boxes.length > 0 || searchResults.storageRooms.length > 0) && (
              <div className="space-y-6">
                {searchResults.items.length > 0 && (
                  <div>
                    <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Items ({searchResults.items.length})</h2>
                    <div className="space-y-2">
                      {searchResults.items.map((item) => (
                        <Link
                          key={item.id}
                          href={`/dashboard/box/${item.box.id}`}
                          className="block p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-300 dark:hover:border-gray-700 transition"
                        >
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">{item.name}</h3>
                            {item.description && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{item.description}</p>
                            )}
                            {item.labels && item.labels.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mb-2">
                                {item.labels.map((itemLabel) => (
                                  <span
                                    key={itemLabel.label.id}
                                    className="inline-block bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs px-2 py-0.5 rounded"
                                  >
                                    {itemLabel.label.name}
                                  </span>
                                ))}
                              </div>
                            )}
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              {item.box.name} / {item.box.storageRoom.name}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {searchResults.boxes.length > 0 && (
                  <div>
                    <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Boxes ({searchResults.boxes.length})</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {searchResults.boxes.map((box) => (
                        <Link
                          key={box.id}
                          href={`/dashboard/box/${box.id}`}
                          className="block p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-300 dark:hover:border-gray-700 transition"
                        >
                          <h3 className="font-medium text-gray-900 dark:text-gray-100">{box.name}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{box._count.items} items</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {box.storageRoom.name}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {searchResults.storageRooms.length > 0 && (
                  <div>
                    <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Storage Rooms ({searchResults.storageRooms.length})</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {searchResults.storageRooms.map((room) => (
                        <Link
                          key={room.id}
                          href={`/dashboard/storage/${room.id}`}
                          className="block p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-300 dark:hover:border-gray-700 transition"
                        >
                          <h3 className="font-medium text-gray-900 dark:text-gray-100">{room.name}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{room._count.boxes} boxes</p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : storageRooms.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
            <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-gray-900 dark:text-gray-100 mb-1">No storage rooms yet</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mb-5">Create your first room to get started</p>
            <button
              onClick={() => setShowNewRoomModal(true)}
              className="bg-indigo-600 text-white dark:bg-indigo-500 px-5 py-2 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-400 transition font-medium text-sm"
            >
              Create Storage Room
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {storageRooms.map((room) => (
              <Link
                key={room.id}
                href={`/dashboard/storage/${room.id}`}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-sm transition p-5 cursor-pointer block"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">
                    {room.name}
                  </h3>
                  <div className="flex gap-1.5">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        startEditRoom(room);
                      }}
                      className="text-amber-400 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300 p-1 transition"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        deleteStorageRoom(room.id);
                      }}
                      className="text-gray-400 hover:text-red-500 p-1 transition"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-400 dark:text-gray-500">{room._count?.boxes || 0} boxes</p>
              </Link>
            ))}
          </div>
        )}
      </main>

      {showNewRoomModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-none sm:rounded-lg w-full h-full sm:h-auto sm:max-w-md sm:w-full p-6 flex flex-col justify-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">New Storage Room</h2>
            <form onSubmit={createStorageRoom}>
              <div className="mb-4">
                <label
                  htmlFor="roomName"
                  className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2"
                >
                  Name
                </label>
                <input
                  id="roomName"
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 bg-white dark:bg-gray-800"
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
                  className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition font-medium text-gray-700 dark:text-gray-300 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingRoom}
                  className="flex-1 bg-indigo-600 text-white dark:bg-indigo-500 px-4 py-2 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-400 transition font-medium disabled:opacity-50 text-sm"
                >
                  {creatingRoom ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditRoomModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-none sm:rounded-lg w-full h-full sm:h-auto sm:max-w-md sm:w-full p-6 flex flex-col justify-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Rename Storage Room</h2>
            <form onSubmit={renameStorageRoom}>
              <div className="mb-4">
                <label
                  htmlFor="editRoomName"
                  className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2"
                >
                  Name
                </label>
                <input
                  id="editRoomName"
                  type="text"
                  value={editRoomName}
                  onChange={(e) => setEditRoomName(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 bg-white dark:bg-gray-800"
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
                  className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition font-medium text-gray-700 dark:text-gray-300 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingRoom}
                  className="flex-1 bg-indigo-600 text-white dark:bg-indigo-500 px-4 py-2 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-400 transition font-medium disabled:opacity-50 text-sm"
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
