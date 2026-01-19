"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface Label {
  id: string;
  name: string;
}

interface ItemLabel {
  label: Label;
}

interface Item {
  id: string;
  name: string;
  description: string | null;
  imagePath: string | null;
  labels?: ItemLabel[];
}

interface Box {
  id: string;
  name: string;
  qrCode: string;
  _count: {
    items: number;
  };
  items?: Item[];
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
  const [editingBox, setEditingBox] = useState<Box | null>(null);
  const [editBoxName, setEditBoxName] = useState("");
  const [showEditBoxModal, setShowEditBoxModal] = useState(false);
  const [updatingBox, setUpdatingBox] = useState(false);
  const [expandedBoxId, setExpandedBoxId] = useState<string | null>(null);
  const [loadingItems, setLoadingItems] = useState<string | null>(null);

  // Item editing state
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [showEditItemModal, setShowEditItemModal] = useState(false);
  const [itemName, setItemName] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemImage, setItemImage] = useState<File | null>(null);
  const [itemLabels, setItemLabels] = useState<string[]>([]);
  const [labelInput, setLabelInput] = useState("");
  const [availableLabels, setAvailableLabels] = useState<Label[]>([]);
  const [showLabelSuggestions, setShowLabelSuggestions] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  const fetchBoxItems = async (boxId: string) => {
    setLoadingItems(boxId);
    try {
      const response = await fetch(`/api/boxes/${boxId}`);
      if (response.ok) {
        const data = await response.json();
        setBoxes(boxes.map(box =>
          box.id === boxId ? { ...box, items: data.box.items } : box
        ));
      }
    } catch (error) {
      console.error("Error fetching box items:", error);
    } finally {
      setLoadingItems(null);
    }
  };

  const toggleBox = async (boxId: string) => {
    if (expandedBoxId === boxId) {
      setExpandedBoxId(null);
    } else {
      setExpandedBoxId(boxId);
      const box = boxes.find(b => b.id === boxId);
      if (box && !box.items) {
        await fetchBoxItems(boxId);
      }
    }
  };

  const fetchAvailableLabels = async () => {
    try {
      const response = await fetch('/api/labels');
      if (response.ok) {
        const data = await response.json();
        setAvailableLabels(data.labels);
      }
    } catch (error) {
      console.error("Error fetching labels:", error);
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

  const startEditBox = (box: Box, e: React.MouseEvent) => {
    e.stopPropagation();
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
        setBoxes(boxes.map((box) => box.id === editingBox.id ? { ...box, name: data.box.name } : box));
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

  const deleteBox = async (boxId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this box? All items inside will be deleted.")) return;

    try {
      const response = await fetch(`/api/boxes/${boxId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setBoxes(boxes.filter((box) => box.id !== boxId));
        if (expandedBoxId === boxId) {
          setExpandedBoxId(null);
        }
      }
    } catch (error) {
      console.error("Error deleting box:", error);
    }
  };

  const startEditItem = (item: Item) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemDescription(item.description || "");
    setItemLabels(item.labels?.map(il => il.label.name) || []);
    setLabelInput("");
    fetchAvailableLabels();
    setShowEditItemModal(true);
  };

  const updateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("name", itemName);
      formData.append("description", itemDescription);
      if (itemImage) formData.append("image", itemImage);
      formData.append("labels", JSON.stringify(itemLabels));

      const response = await fetch(`/api/items/${editingItem.id}`, {
        method: "PATCH",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        // Update the item in the expanded box
        setBoxes(boxes.map(box => {
          if (box.items) {
            return {
              ...box,
              items: box.items.map(item =>
                item.id === editingItem.id ? data.item : item
              )
            };
          }
          return box;
        }));
        closeItemModal();
      }
    } catch (error) {
      console.error("Error updating item:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteItem = async (itemId: string, boxId: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setBoxes(boxes.map(box => {
          if (box.id === boxId && box.items) {
            return {
              ...box,
              items: box.items.filter(item => item.id !== itemId),
              _count: { items: box._count.items - 1 }
            };
          }
          return box;
        }));
      }
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const closeItemModal = () => {
    setShowEditItemModal(false);
    setEditingItem(null);
    setItemName("");
    setItemDescription("");
    setItemImage(null);
    setItemLabels([]);
    setLabelInput("");
    setShowLabelSuggestions(false);
  };

  const addLabel = (labelName: string) => {
    const trimmed = labelName.trim();
    if (trimmed && !itemLabels.includes(trimmed)) {
      setItemLabels([...itemLabels, trimmed]);
    }
    setLabelInput("");
    setShowLabelSuggestions(false);
  };

  const removeLabel = (labelName: string) => {
    setItemLabels(itemLabels.filter(l => l !== labelName));
  };

  const handleLabelInputChange = (value: string) => {
    setLabelInput(value);
    setShowLabelSuggestions(value.length > 0);
  };

  const handleLabelInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (labelInput.trim()) {
        addLabel(labelInput);
      }
    }
  };

  const filteredLabelSuggestions = availableLabels.filter(
    label =>
      label.name.toLowerCase().includes(labelInput.toLowerCase()) &&
      !itemLabels.includes(label.name)
  );

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
          <div className="space-y-4">
            {boxes.map((box) => (
              <div key={box.id} className="bg-white rounded-lg shadow">
                {/* Box Header */}
                <div
                  onClick={() => toggleBox(box.id)}
                  className="p-4 sm:p-6 cursor-pointer hover:bg-gray-50 transition"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {box.name}
                        </h3>
                        <span className="text-sm text-gray-500">
                          ({box._count?.items || 0} items)
                        </span>
                        <svg
                          className={`w-5 h-5 text-gray-400 transition-transform ${
                            expandedBoxId === box.id ? 'transform rotate-180' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => startEditBox(box, e)}
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
                        onClick={(e) => deleteBox(box.id, e)}
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
                      <Link
                        href={`/dashboard/box/${box.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-gray-500 hover:text-gray-700"
                        title="Open box page"
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
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Expanded Items */}
                {expandedBoxId === box.id && (
                  <div className="border-t border-gray-200 p-4 sm:p-6 bg-gray-50">
                    {loadingItems === box.id ? (
                      <p className="text-center py-4 text-gray-600">Loading items...</p>
                    ) : !box.items || box.items.length === 0 ? (
                      <p className="text-center py-4 text-gray-600">No items in this box yet</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {box.items.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => startEditItem(item)}
                            className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden cursor-pointer"
                          >
                            {item.imagePath && (
                              <div className="relative w-full h-48 bg-gray-200">
                                <Image
                                  src={item.imagePath}
                                  alt={item.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            )}
                            <div className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-semibold text-gray-900">{item.name}</h4>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteItem(item.id, box.id);
                                  }}
                                  className="text-red-500 hover:text-red-700 p-1"
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
                              {item.labels && item.labels.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {item.labels.map((itemLabel) => (
                                    <span
                                      key={itemLabel.label.id}
                                      className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded"
                                    >
                                      {itemLabel.label.name}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {item.description && (
                                <p className="text-gray-600 text-sm">{item.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
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

      {/* Edit Box Modal */}
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

      {/* Edit Item Modal */}
      {showEditItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-0 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-none sm:rounded-lg w-full h-full sm:h-auto sm:max-w-md sm:w-full p-6 sm:my-8 overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Edit Item</h2>
            <form onSubmit={updateItem}>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="itemName"
                    className="block text-sm font-medium text-gray-900 mb-2"
                  >
                    Item Name *
                  </label>
                  <input
                    id="itemName"
                    type="text"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                    placeholder="e.g., Coffee Maker"
                  />
                </div>

                <div>
                  <label
                    htmlFor="itemDescription"
                    className="block text-sm font-medium text-gray-900 mb-2"
                  >
                    Description
                  </label>
                  <textarea
                    id="itemDescription"
                    value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                    placeholder="Optional description"
                  />
                </div>

                <div>
                  <label
                    htmlFor="itemLabels"
                    className="block text-sm font-medium text-gray-900 mb-2"
                  >
                    Labels
                  </label>

                  {itemLabels.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {itemLabels.map((label) => (
                        <span
                          key={label}
                          className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                        >
                          {label}
                          <button
                            type="button"
                            onClick={() => removeLabel(label)}
                            className="hover:text-green-600"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="relative">
                    <input
                      id="itemLabels"
                      type="text"
                      value={labelInput}
                      onChange={(e) => handleLabelInputChange(e.target.value)}
                      onKeyDown={handleLabelInputKeyDown}
                      onFocus={() => fetchAvailableLabels()}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                      placeholder="e.g., kitchen, electronics (press Enter to add)"
                    />

                    {showLabelSuggestions && filteredLabelSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {filteredLabelSuggestions.map((label) => (
                          <button
                            key={label.id}
                            type="button"
                            onClick={() => addLabel(label.name)}
                            className="w-full text-left px-4 py-2 hover:bg-blue-50 text-gray-900 text-sm"
                          >
                            {label.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Add labels to help organize and find items easily
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Photo
                  </label>
                  {editingItem?.imagePath && !itemImage && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-600 mb-2">Current photo:</p>
                      <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                        <Image
                          src={editingItem.imagePath}
                          alt="Current item photo"
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setItemImage(e.target.files?.[0] || null)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Upload a new photo to replace the existing one
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeItemModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
