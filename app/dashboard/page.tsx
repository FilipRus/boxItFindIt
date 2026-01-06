"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import Link from "next/link";

interface Item {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  imagePath: string | null;
}

interface Box {
  id: string;
  name: string;
  qrCode: string;
  items: Item[];
  _count: {
    items: number;
  };
}

export default function Dashboard() {
  const router = useRouter();
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewBoxModal, setShowNewBoxModal] = useState(false);
  const [newBoxName, setNewBoxName] = useState("");
  const [creatingBox, setCreatingBox] = useState(false);
  const [editingBox, setEditingBox] = useState<Box | null>(null);
  const [editBoxName, setEditBoxName] = useState("");
  const [showEditBoxModal, setShowEditBoxModal] = useState(false);
  const [updatingBox, setUpdatingBox] = useState(false);

  useEffect(() => {
    fetchBoxes();
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchBoxes(searchQuery || undefined);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBoxes(searchQuery || undefined);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchBoxes = async (search?: string) => {
    try {
      const url = search
        ? `/api/boxes?search=${encodeURIComponent(search)}`
        : "/api/boxes";
      const response = await fetch(url);

      if (response.status === 401) {
        router.push("/auth/signin");
        return;
      }

      const data = await response.json();
      setBoxes(data.boxes || []);
    } catch (error) {
      console.error("Error fetching boxes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBoxes(searchQuery);
  };

  const createBox = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingBox(true);

    try {
      const response = await fetch("/api/boxes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newBoxName }),
      });

      if (response.ok) {
        const data = await response.json();
        setBoxes([data.box, ...boxes]);
        setNewBoxName("");
        setShowNewBoxModal(false);
      }
    } catch (error) {
      console.error("Error creating box:", error);
    } finally {
      setCreatingBox(false);
    }
  };

  const startEditBox = (box: Box) => {
    setEditingBox(box);
    setEditBoxName(box.name);
    setShowEditBoxModal(true);
  };

  const renameBox = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBox) return;
    setUpdatingBox(true);

    try {
      const response = await fetch(`/api/boxes/${editingBox.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: editBoxName }),
      });

      if (response.ok) {
        const data = await response.json();
        setBoxes(boxes.map((box) => box.id === editingBox.id ? data.box : box));
        setEditBoxName("");
        setEditingBox(null);
        setShowEditBoxModal(false);
      }
    } catch (error) {
      console.error("Error renaming box:", error);
    } finally {
      setUpdatingBox(false);
    }
  };

  const deleteBox = async (id: string) => {
    if (!confirm("Are you sure you want to delete this box?")) return;

    try {
      const response = await fetch(`/api/boxes/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setBoxes(boxes.filter((box) => box.id !== id));
      }
    } catch (error) {
      console.error("Error deleting box:", error);
    }
  };

  const totalBoxes = boxes.length;
  const totalItems = boxes.reduce((sum, box) => sum + (box._count?.items || box.items?.length || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">BoxIT</h1>
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
        {/* Search and New Box button at top - only show when boxes exist */}
        {!loading && boxes.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <form onSubmit={handleSearch} className="flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search boxes and items..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500 text-base"
                />
              </form>
              <button
                onClick={() => setShowNewBoxModal(true)}
                className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium shadow-lg text-base"
              >
                New Box
              </button>
            </div>
          </div>
        )}

        {/* Boxes grid or empty state */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading boxes...</p>
          </div>
        ) : boxes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-700 mb-4">No boxes yet</p>
            <button
              onClick={() => setShowNewBoxModal(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Create Your First Box
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {boxes.map((box) => (
              <Link
                key={box.id}
                href={`/dashboard/box/${box.id}`}
                className="bg-white rounded-lg shadow hover:shadow-lg transition p-4 sm:p-6 cursor-pointer block"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {box.name}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        startEditBox(box);
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
                        deleteBox(box.id);
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
                <p className="text-gray-600">{box._count?.items || box.items?.length || 0} items</p>
              </Link>
            ))}
          </div>
        )}

        {/* Stats at bottom */}
        {!loading && boxes.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
              <h3 className="text-gray-500 text-xs sm:text-sm font-medium">Total Boxes</h3>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{totalBoxes}</p>
            </div>
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
              <h3 className="text-gray-500 text-xs sm:text-sm font-medium">Total Items</h3>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{totalItems}</p>
            </div>
          </div>
        )}
      </main>

      {showNewBoxModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white rounded-none sm:rounded-lg w-full h-full sm:h-auto sm:max-w-md sm:w-full p-6 flex flex-col justify-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Create New Box</h2>
            <form onSubmit={createBox}>
              <div className="mb-4">
                <label
                  htmlFor="boxName"
                  className="block text-sm font-medium text-gray-900 mb-2"
                >
                  Box Name
                </label>
                <input
                  id="boxName"
                  type="text"
                  value={newBoxName}
                  onChange={(e) => setNewBoxName(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                  placeholder="e.g., Kitchen Items, Winter Clothes"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewBoxModal(false);
                    setNewBoxName("");
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingBox}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
                >
                  {creatingBox ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditBoxModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white rounded-none sm:rounded-lg w-full h-full sm:h-auto sm:max-w-md sm:w-full p-6 flex flex-col justify-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Rename Box</h2>
            <form onSubmit={renameBox}>
              <div className="mb-4">
                <label
                  htmlFor="editBoxName"
                  className="block text-sm font-medium text-gray-900 mb-2"
                >
                  Box Name
                </label>
                <input
                  id="editBoxName"
                  type="text"
                  value={editBoxName}
                  onChange={(e) => setEditBoxName(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                  placeholder="e.g., Kitchen Items, Winter Clothes"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditBoxModal(false);
                    setEditBoxName("");
                    setEditingBox(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingBox}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
                >
                  {updatingBox ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
