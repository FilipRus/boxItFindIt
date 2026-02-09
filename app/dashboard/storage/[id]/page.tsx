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

  // QR code state
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeImage, setQrCodeImage] = useState("");
  const [selectedBox, setSelectedBox] = useState<Box | null>(null);

  useEffect(() => {
    fetchStorageRoom();
    fetchBoxes();
  }, [id]);

  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showQRModal) {
          setShowQRModal(false);
          setSelectedBox(null);
          setQrCodeImage("");
        } else if (showEditItemModal) {
          closeItemModal();
        } else if (showNewBoxModal) {
          setShowNewBoxModal(false);
          setNewBoxName("");
        } else if (showEditBoxModal) {
          setShowEditBoxModal(false);
          setEditingBox(null);
          setEditBoxName("");
        }
      }
    };

    if (showQRModal || showEditItemModal || showNewBoxModal || showEditBoxModal) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [showQRModal, showEditItemModal, showNewBoxModal, showEditBoxModal]);

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

  const printQRCode = () => {
    if (!selectedBox || !qrCodeImage) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${selectedBox.name}</title>
          <style>
            @page { size: auto; margin: 10mm; }
            body { display: flex; justify-content: center; align-items: flex-start; padding-top: 10mm; font-family: sans-serif; }
            .qr-label { text-align: center; width: 50mm; }
            .qr-label img { width: 50mm; height: 50mm; }
            .qr-label p { margin: 4mm 0 0; font-size: 12pt; font-weight: bold; word-break: break-word; }
          </style>
        </head>
        <body>
          <div class="qr-label">
            <img src="${qrCodeImage}" alt="QR Code" />
            <p>${selectedBox.name}</p>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const generateQRCode = async (box: Box, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedBox(box);

    try {
      const response = await fetch("/api/qr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ qrCode: box.qrCode }),
      });

      if (response.ok) {
        const data = await response.json();
        setQrCodeImage(data.qrCodeImage);
        setShowQRModal(true);
      }
    } catch (error) {
      console.error("Error generating QR code:", error);
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
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-14">
            <Link href="/dashboard/storage" className="text-sm text-gray-500 hover:text-gray-900 transition">
              &larr; Back to Storage Rooms
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">{storageRoomName}</h1>
            {!loading && boxes.length > 0 && (
              <button
                onClick={() => setShowNewBoxModal(true)}
                className="w-full sm:w-auto bg-gray-900 text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 transition font-medium text-sm"
              >
                New Box
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg p-5">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="animate-skeleton h-5 w-32 mb-2"></div>
                    <div className="animate-skeleton h-4 w-16"></div>
                  </div>
                  <div className="animate-skeleton h-5 w-5 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : boxes.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-gray-900 mb-1">No boxes yet</p>
            <p className="text-gray-400 text-sm mb-5">Create your first box in this room</p>
            <button
              onClick={() => setShowNewBoxModal(true)}
              className="bg-gray-900 text-white px-5 py-2 rounded-lg hover:bg-gray-800 transition font-medium text-sm"
            >
              Create Box
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {boxes.map((box) => (
              <div key={box.id} className="bg-white border border-gray-200 rounded-lg">
                <div
                  onClick={() => toggleBox(box.id)}
                  className="p-4 sm:p-5 cursor-pointer hover:bg-gray-50 transition"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">{box.name}</h3>
                        <span className="text-sm text-gray-400">
                          {box._count?.items || 0} items
                        </span>
                        <svg
                          className={`w-4 h-4 text-gray-400 transition-transform ${
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
                    <div className="flex gap-1.5">
                      <button
                        onClick={(e) => generateQRCode(box, e)}
                        className="text-gray-400 hover:text-gray-600 p-1 transition"
                        title="Generate QR Code"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => startEditBox(box, e)}
                        className="text-gray-400 hover:text-gray-600 p-1 transition"
                        title="Edit box"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => deleteBox(box.id, e)}
                        className="text-gray-400 hover:text-red-500 p-1 transition"
                        title="Delete box"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      <Link
                        href={`/dashboard/box/${box.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-gray-400 hover:text-gray-600 p-1 transition"
                        title="Open box page"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>

                {expandedBoxId === box.id && (
                  <div className="border-t border-gray-100 p-4 sm:p-5">
                    {loadingItems === box.id ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[1, 2].map((i) => (
                          <div key={i} className="bg-gray-50 rounded-lg p-4">
                            <div className="animate-skeleton h-4 w-24 mb-2"></div>
                            <div className="animate-skeleton h-3 w-16"></div>
                          </div>
                        ))}
                      </div>
                    ) : !box.items || box.items.length === 0 ? (
                      <p className="text-center py-4 text-gray-400 text-sm">No items in this box</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {box.items.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => startEditItem(item)}
                            className="bg-white border border-gray-100 rounded-lg hover:border-gray-200 transition overflow-hidden cursor-pointer"
                          >
                            {item.imagePath && (
                              <div className="relative w-full h-40 bg-gray-100">
                                <Image
                                  src={item.imagePath}
                                  alt={item.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            )}
                            <div className="p-3">
                              <div className="flex justify-between items-start mb-1">
                                <h4 className="font-medium text-gray-900 text-sm">{item.name}</h4>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteItem(item.id, box.id);
                                  }}
                                  className="text-gray-400 hover:text-red-500 p-0.5 transition"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                              {item.labels && item.labels.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-1">
                                  {item.labels.map((itemLabel) => (
                                    <span
                                      key={itemLabel.label.id}
                                      className="inline-block bg-gray-100 text-gray-500 text-xs px-1.5 py-0.5 rounded"
                                    >
                                      {itemLabel.label.name}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {item.description && (
                                <p className="text-gray-400 text-xs">{item.description}</p>
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

      {showNewBoxModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white rounded-none sm:rounded-lg w-full h-full sm:h-auto sm:max-w-md sm:w-full p-6 flex flex-col justify-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">New Box</h2>
            <form onSubmit={createBox}>
              <div className="mb-4">
                <label htmlFor="boxName" className="block text-sm font-medium text-gray-900 mb-2">Name</label>
                <input
                  id="boxName"
                  type="text"
                  value={newBoxName}
                  onChange={(e) => setNewBoxName(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                  placeholder="e.g., Kitchen Items, Winter Clothes"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowNewBoxModal(false); setNewBoxName(""); }}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition font-medium text-gray-700 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingBox}
                  className="flex-1 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition font-medium disabled:opacity-50 text-sm"
                >
                  {creatingBox ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditBoxModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white rounded-none sm:rounded-lg w-full h-full sm:h-auto sm:max-w-md sm:w-full p-6 flex flex-col justify-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Rename Box</h2>
            <form onSubmit={renameBox}>
              <div className="mb-4">
                <label htmlFor="editBoxName" className="block text-sm font-medium text-gray-900 mb-2">Name</label>
                <input
                  id="editBoxName"
                  type="text"
                  value={editBoxName}
                  onChange={(e) => setEditBoxName(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                  placeholder="e.g., Kitchen Items, Winter Clothes"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowEditBoxModal(false); setEditBoxName(""); setEditingBox(null); }}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition font-medium text-gray-700 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingBox}
                  className="flex-1 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition font-medium disabled:opacity-50 text-sm"
                >
                  {updatingBox ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditItemModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-0 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-none sm:rounded-lg w-full h-full sm:h-auto sm:max-w-md sm:w-full p-6 sm:my-8 overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Edit Item</h2>
            <form onSubmit={updateItem}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="itemName" className="block text-sm font-medium text-gray-900 mb-2">Name</label>
                  <input
                    id="itemName"
                    type="text"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                    placeholder="e.g., Coffee Maker"
                  />
                </div>

                <div>
                  <label htmlFor="itemDescription" className="block text-sm font-medium text-gray-900 mb-2">Description</label>
                  <textarea
                    id="itemDescription"
                    value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                    placeholder="Optional description"
                  />
                </div>

                <div>
                  <label htmlFor="itemLabels" className="block text-sm font-medium text-gray-900 mb-2">Labels</label>
                  {itemLabels.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {itemLabels.map((label) => (
                        <span key={label} className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full text-xs">
                          {label}
                          <button type="button" onClick={() => removeLabel(label)} className="hover:text-gray-900">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                      placeholder="Type and press Enter to add"
                    />
                    {showLabelSuggestions && filteredLabelSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-sm max-h-48 overflow-y-auto">
                        {filteredLabelSuggestions.map((label) => (
                          <button
                            key={label.id}
                            type="button"
                            onClick={() => addLabel(label.name)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-900 text-sm"
                          >
                            {label.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Photo</label>
                  {editingItem?.imagePath && !itemImage && (
                    <div className="mb-3">
                      <div className="relative w-full h-40 bg-gray-50 rounded-lg overflow-hidden">
                        <Image src={editingItem.imagePath} alt="Current item photo" fill className="object-cover" />
                      </div>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setItemImage(e.target.files?.[0] || null)}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border file:border-gray-200 file:text-sm file:font-medium file:bg-white file:text-gray-700 hover:file:bg-gray-50"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeItemModal}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition font-medium text-gray-700 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition font-medium disabled:opacity-50 text-sm"
                >
                  {submitting ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showQRModal && selectedBox && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-sm w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                QR Code
              </h2>
              <button
                onClick={() => { setShowQRModal(false); setSelectedBox(null); setQrCodeImage(""); }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex flex-col items-center">
              <img src={qrCodeImage} alt="QR Code" className="w-48 h-48 mb-3" />
              <p className="text-sm text-gray-500 text-center mb-1">{selectedBox.name}</p>
              <p className="text-xs text-gray-400 text-center mb-4">Scan to view box contents</p>
              <div className="flex gap-3 w-full">
                <a
                  href={qrCodeImage}
                  download={`${selectedBox.name}-qr-code.png`}
                  className="flex-1 bg-gray-900 text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition font-medium text-center text-sm"
                >
                  Download
                </a>
                <button
                  onClick={printQRCode}
                  className="flex-1 border border-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition font-medium text-sm"
                >
                  Print
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
