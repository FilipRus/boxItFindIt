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
  category: string | null;
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
    }, 150); // Reduced from 300ms to 150ms

    return () => clearTimeout(timer);
  }, [searchQuery]);

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

  const getMatchBadges = (item: SearchItem, query: string): string[] => {
    const badges: string[] = [];
    const lowerQuery = query.toLowerCase();

    if (item.name.toLowerCase().includes(lowerQuery)) {
      badges.push("Name");
    }
    if (item.description?.toLowerCase().includes(lowerQuery)) {
      badges.push("Description");
    }
    if (item.category?.toLowerCase().includes(lowerQuery)) {
      badges.push("Category");
    }
    if (item.labels?.some(il => il.label.name.toLowerCase().includes(lowerQuery))) {
      badges.push("Label");
    }

    return badges;
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
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, label, category, or description..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500 text-base"
                  />
                  {searchQuery && (
                    <div className="absolute right-3 top-3 flex items-center gap-1 text-xs text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Searching...
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowNewRoomModal(true)}
                className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium shadow-lg text-base"
              >
                New Storage Room
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading storage rooms...</p>
          </div>
        ) : searchQuery && searchResults ? (
          <div>
            {searching && (
              <div className="text-center py-4 text-gray-600">
                <p>Searching...</p>
              </div>
            )}

            {!searching && (searchResults.items.length === 0 && searchResults.boxes.length === 0 && searchResults.storageRooms.length === 0) && (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-700 mb-2">No results found for &quot;{searchQuery}&quot;</p>
                <p className="text-gray-500 text-sm mb-4">Try a different search term</p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Clear Search
                </button>
              </div>
            )}

            {!searching && (searchResults.items.length > 0 || searchResults.boxes.length > 0 || searchResults.storageRooms.length > 0) && (
              <div className="space-y-6">
                {/* Items Results */}
                {searchResults.items.length > 0 && (
                  <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Items ({searchResults.items.length})</h2>
                    <div className="space-y-3">
                      {searchResults.items.map((item) => {
                        const matchBadges = getMatchBadges(item, searchQuery);
                        return (
                          <Link
                            key={item.id}
                            href={`/dashboard/box/${item.box.id}`}
                            className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap mb-2">
                                  <h3 className="font-semibold text-gray-900">{item.name}</h3>
                                  {matchBadges.map((badge) => (
                                    <span
                                      key={badge}
                                      className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      Matched: {badge}
                                    </span>
                                  ))}
                                </div>
                                {item.description && (
                                  <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                                )}
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {item.category && (
                                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                      Category: {item.category}
                                    </span>
                                  )}
                                  {item.labels && item.labels.length > 0 && (
                                    <>
                                      {item.labels.map((itemLabel) => (
                                        <span
                                          key={itemLabel.label.id}
                                          className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded"
                                        >
                                          🏷️ {itemLabel.label.name}
                                        </span>
                                      ))}
                                    </>
                                  )}
                                </div>
                                <div className="mt-2 text-sm text-gray-500">
                                  📦 {item.box.name} → 🏠 {item.box.storageRoom.name}
                                </div>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Boxes Results */}
                {searchResults.boxes.length > 0 && (
                  <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Boxes ({searchResults.boxes.length})</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {searchResults.boxes.map((box) => (
                        <Link
                          key={box.id}
                          href={`/dashboard/box/${box.id}`}
                          className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
                        >
                          <h3 className="font-semibold text-gray-900">{box.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{box._count.items} items</p>
                          <div className="mt-2 text-sm text-gray-500">
                            🏠 {box.storageRoom.name}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Storage Rooms Results */}
                {searchResults.storageRooms.length > 0 && (
                  <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Storage Rooms ({searchResults.storageRooms.length})</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {searchResults.storageRooms.map((room) => (
                        <Link
                          key={room.id}
                          href={`/dashboard/storage/${room.id}`}
                          className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
                        >
                          <h3 className="font-semibold text-gray-900">{room.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{room._count.boxes} boxes</p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
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
