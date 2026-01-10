"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Box {
  id: string;
  name: string;
  qrCode: string;
  _count: {
    items: number;
  };
}

export default function StorageRoomDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [storageRoomName, setStorageRoomName] = useState("");
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewBoxModal, setShowNewBoxModal] = useState(false);
  const [newBoxName, setNewBoxName] = useState("");
  const [creatingBox, setCreatingBox] = useState(false);

  useEffect(() => {
    fetchStorageRoom();
    fetchBoxes();
  }, [id]);

  const fetchStorageRoom = async () => {
    try {
      const response = await fetch(`/api/storage-rooms/${id}`);
      if (response.ok) {
        const data = await response.json();
        setStorageRoomName(data.storageRoom.name);
      }
    } catch (error) {
      console.error("Error fetching storage room:", error);
    }
  };

  const fetchBoxes = async () => {
    try {
      const response = await fetch(`/api/storage-rooms/${id}/boxes`);

      if (response.status === 401) {
        router.push("/auth/signin");
        return;
      }

      if (response.status === 404) {
        router.push("/dashboard/storage");
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

  const createBox = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingBox(true);

    try {
      const response = await fetch(`/api/storage-rooms/${id}/boxes`, {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/dashboard/storage" className="text-blue-600 hover:text-blue-700">
              ← Back to Storage Rooms
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{storageRoomName}</h1>
            {!loading && boxes.length > 0 && (
              <button
                onClick={() => setShowNewBoxModal(true)}
                className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium shadow-lg text-base"
              >
                New Box
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading boxes...</p>
          </div>
        ) : boxes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-700 mb-4">No boxes in this storage room yet</p>
            <button
              onClick={() => setShowNewBoxModal(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Create Your First Box
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
                </div>
                <p className="text-gray-600">{box._count?.items || 0} items</p>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Create Box Modal */}
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
    </div>
  );
}
