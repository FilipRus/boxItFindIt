"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "@/app/components/ThemeToggle";

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
  items: Item[];
}

export default function BoxDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [box, setBox] = useState<Box | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showEditItemModal, setShowEditItemModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeImage, setQrCodeImage] = useState("");
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  const [itemName, setItemName] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemImage, setItemImage] = useState<File | null>(null);
  const [itemLabels, setItemLabels] = useState<string[]>([]);
  const [labelInput, setLabelInput] = useState("");
  const [availableLabels, setAvailableLabels] = useState<Label[]>([]);
  const [showLabelSuggestions, setShowLabelSuggestions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [availableBoxes, setAvailableBoxes] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedDestinationBoxId, setSelectedDestinationBoxId] = useState<string>("");
  const [moveSuccessMessage, setMoveSuccessMessage] = useState(false);

  useEffect(() => {
    fetchBox();
  }, [id]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchBox();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [id]);

  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showQRModal) {
          setShowQRModal(false);
        } else if (showEditItemModal || showAddItemModal) {
          closeModal();
        }
      }
    };

    if (showQRModal || showEditItemModal || showAddItemModal) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [showQRModal, showEditItemModal, showAddItemModal]);

  const fetchBox = async () => {
    try {
      const response = await fetch(`/api/boxes/${id}`);

      if (response.status === 401) {
        router.push("/auth/signin");
        return;
      }

      if (response.status === 404) {
        router.push("/dashboard");
        return;
      }

      const data = await response.json();
      setBox(data.box);
    } catch (error) {
      console.error("Error fetching box:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableBoxes = async () => {
    try {
      const response = await fetch('/api/boxes');
      if (response.ok) {
        const data = await response.json();
        const otherBoxes = data.boxes
          .filter((b: { id: string; name: string }) => b.id !== id)
          .map((b: { id: string; name: string }) => ({ id: b.id, name: b.name }));
        setAvailableBoxes(otherBoxes);
      }
    } catch (error) {
      console.error("Error fetching boxes:", error);
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

  const generateQRCode = async () => {
    if (!box) return;

    try {
      const response = await fetch("/api/qr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ qrCode: box.qrCode }),
      });

      const data = await response.json();
      setQrCodeImage(data.qrCodeImage);
      setShowQRModal(true);
    } catch (error) {
      console.error("Error generating QR code:", error);
    }
  };

  const downloadQRCode = () => {
    const link = document.createElement("a");
    link.href = qrCodeImage;
    link.download = `${box?.name}-qr-code.png`;
    link.click();
  };

  const printQRCode = () => {
    if (!box || !qrCodeImage) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${box.name}</title>
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
            <p>${box.name}</p>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("name", itemName);
      if (itemDescription) formData.append("description", itemDescription);
      if (itemImage) formData.append("image", itemImage);
      formData.append("labels", JSON.stringify(itemLabels));

      const response = await fetch(`/api/boxes/${id}/items`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setBox((prev) =>
          prev ? { ...prev, items: [data.item, ...prev.items] } : null
        );
        setItemName("");
        setItemDescription("");
        setItemImage(null);
        setItemLabels([]);
        setLabelInput("");

        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);

        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = '';

        fetchAvailableLabels();
      }
    } catch (error) {
      console.error("Error adding item:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const startEditItem = (item: Item) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemDescription(item.description || "");
    setItemLabels(item.labels?.map(il => il.label.name) || []);
    setLabelInput("");
    setSelectedDestinationBoxId("");
    fetchAvailableBoxes();
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
      if (selectedDestinationBoxId) formData.append("destinationBoxId", selectedDestinationBoxId);
      formData.append("labels", JSON.stringify(itemLabels));

      const response = await fetch(`/api/items/${editingItem.id}`, {
        method: "PATCH",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();

        if (data.moved) {
          setBox((prev) =>
            prev ? { ...prev, items: prev.items.filter((item) => item.id !== editingItem.id) } : null
          );

          setMoveSuccessMessage(true);
          setTimeout(() => {
            setMoveSuccessMessage(false);
            closeModal();
          }, 2000);
        } else {
          setBox((prev) =>
            prev
              ? {
                  ...prev,
                  items: prev.items.map((item) =>
                    item.id === editingItem.id ? data.item : item
                  ),
                }
              : null
          );

          setItemName("");
          setItemDescription("");
          setItemImage(null);
          setEditingItem(null);
          setSelectedDestinationBoxId("");
          setShowEditItemModal(false);
        }
      } else {
        const error = await response.json();
        alert(error.error || "Failed to update item");
      }
    } catch (error) {
      console.error("Error updating item:", error);
      alert("Failed to update item. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setBox((prev) =>
          prev
            ? { ...prev, items: prev.items.filter((item) => item.id !== itemId) }
            : null
        );
      }
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const closeModal = () => {
    setShowAddItemModal(false);
    setShowEditItemModal(false);
    setEditingItem(null);
    setItemName("");
    setItemDescription("");
    setItemImage(null);
    setItemLabels([]);
    setLabelInput("");
    setShowLabelSuggestions(false);
    setShowSuccessMessage(false);
    setSelectedDestinationBoxId("");
    setMoveSuccessMessage(false);
    setAvailableBoxes([]);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-14">
              <div className="animate-skeleton h-4 w-32"></div>
              <ThemeToggle />
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="animate-skeleton h-7 w-48 mb-6"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                <div className="animate-skeleton h-40 w-full rounded-none"></div>
                <div className="p-4">
                  <div className="animate-skeleton h-5 w-24 mb-2"></div>
                  <div className="animate-skeleton h-4 w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!box) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <Link href="/dashboard/storage" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition">
              &larr; Back to Dashboard
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100">{box.name}</h1>
            {box.items.length > 0 && (
              <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
                <button
                  onClick={generateQRCode}
                  className="w-full sm:w-auto border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition font-medium text-sm"
                >
                  QR Code
                </button>
                <button
                  onClick={() => setShowAddItemModal(true)}
                  className="w-full sm:w-auto bg-indigo-600 text-white dark:bg-indigo-500 px-5 py-2.5 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-400 transition font-medium text-sm"
                >
                  Add Item
                </button>
              </div>
            )}
          </div>

          {box.items.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <p className="text-sm text-gray-400 dark:text-gray-500">{box.items.length} items</p>
              <div className="flex gap-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-1.5 rounded-md transition text-sm ${
                    viewMode === "grid"
                      ? "bg-indigo-600 text-white dark:bg-indigo-500"
                      : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-1.5 rounded-md transition text-sm ${
                    viewMode === "list"
                      ? "bg-indigo-600 text-white dark:bg-indigo-500"
                      : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {box.items.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
            <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-gray-900 dark:text-gray-100 mb-1">No items yet</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mb-5">Add your first item to this box</p>
            <button
              onClick={() => setShowAddItemModal(true)}
              className="bg-indigo-600 text-white dark:bg-indigo-500 px-5 py-2 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-400 transition font-medium text-sm"
            >
              Add Item
            </button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {box.items.map((item) => (
              <div
                key={item.id}
                onClick={() => startEditItem(item)}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-sm transition overflow-hidden cursor-pointer"
              >
                {item.imagePath && (
                  <div className="relative w-full h-40 bg-gray-100 dark:bg-gray-800">
                    <Image src={item.imagePath} alt={item.name} fill className="object-cover" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm">{item.name}</h3>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                      className="text-red-400 hover:text-red-500 p-0.5 transition"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  {item.labels && item.labels.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-1">
                      {item.labels.map((itemLabel) => (
                        <span key={itemLabel.label.id} className="inline-block bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs px-1.5 py-0.5 rounded">
                          {itemLabel.label.name}
                        </span>
                      ))}
                    </div>
                  )}
                  {item.description && (
                    <p className="text-gray-400 dark:text-gray-500 text-xs">{item.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {box.items.map((item) => (
              <div
                key={item.id}
                onClick={() => startEditItem(item)}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-300 dark:hover:border-gray-700 transition p-4 flex gap-4 cursor-pointer"
              >
                {item.imagePath && (
                  <div className="relative w-20 h-20 flex-shrink-0 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                    <Image src={item.imagePath} alt={item.name} fill className="object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm">{item.name}</h3>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                      className="text-red-400 hover:text-red-500 p-0.5 flex-shrink-0 transition"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  {item.labels && item.labels.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-1">
                      {item.labels.map((itemLabel) => (
                        <span key={itemLabel.label.id} className="inline-block bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs px-1.5 py-0.5 rounded">
                          {itemLabel.label.name}
                        </span>
                      ))}
                    </div>
                  )}
                  {item.description && (
                    <p className="text-gray-400 dark:text-gray-500 text-xs">{item.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {(showAddItemModal || showEditItemModal) && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-0 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 rounded-none sm:rounded-lg w-full h-full sm:h-auto sm:max-w-md sm:w-full p-6 sm:my-8 overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {showEditItemModal ? "Edit Item" : "Add Item"}
            </h2>
            {moveSuccessMessage && showEditItemModal && (
              <div className="mb-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded text-sm">
                Item moved successfully!
              </div>
            )}
            {showSuccessMessage && showAddItemModal && (
              <div className="mb-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded text-sm">
                Item added! Add another or close when done.
              </div>
            )}
            <form onSubmit={showEditItemModal ? updateItem : addItem}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="itemName" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Name</label>
                  <input
                    id="itemName"
                    type="text"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 bg-white dark:bg-gray-800"
                    placeholder="e.g., Coffee Maker"
                  />
                </div>

                <div>
                  <label htmlFor="itemDescription" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Description</label>
                  <textarea
                    id="itemDescription"
                    value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 bg-white dark:bg-gray-800"
                    placeholder="Optional description"
                  />
                </div>

                <div>
                  <label htmlFor="itemLabels" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Labels</label>
                  {itemLabels.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {itemLabels.map((label) => (
                        <span key={label} className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2.5 py-1 rounded-full text-xs">
                          {label}
                          <button type="button" onClick={() => removeLabel(label)} className="hover:text-red-500 dark:hover:text-red-400">
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
                      className="w-full px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 bg-white dark:bg-gray-800"
                      placeholder="Type and press Enter to add"
                    />
                    {showLabelSuggestions && filteredLabelSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm max-h-48 overflow-y-auto">
                        {filteredLabelSuggestions.map((label) => (
                          <button
                            key={label.id}
                            type="button"
                            onClick={() => addLabel(label.name)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                          >
                            {label.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {showEditItemModal && availableBoxes.length > 0 && (
                  <div>
                    <label htmlFor="destinationBox" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Move to Different Box</label>
                    <select
                      id="destinationBox"
                      value={selectedDestinationBoxId}
                      onChange={(e) => setSelectedDestinationBoxId(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                    >
                      <option value="">Keep in current box</option>
                      {availableBoxes.map((box) => (
                        <option key={box.id} value={box.id}>{box.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Photo</label>
                  {showEditItemModal && editingItem?.imagePath && !itemImage && (
                    <div className="mb-3">
                      <div className="relative w-full h-40 bg-gray-50 dark:bg-gray-950 rounded-lg overflow-hidden">
                        <Image src={editingItem.imagePath} alt="Current item photo" fill className="object-cover" />
                      </div>
                    </div>
                  )}
                  <div className="relative">
                    <input
                      id="itemImage"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => setItemImage(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <label
                      htmlFor="itemImage"
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition cursor-pointer text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="font-medium">
                        {itemImage ? itemImage.name : showEditItemModal && editingItem?.imagePath ? "Replace Photo" : "Take Photo or Choose File"}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition font-medium text-gray-700 dark:text-gray-300 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-indigo-600 text-white dark:bg-indigo-500 px-4 py-2 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-400 transition font-medium disabled:opacity-50 text-sm"
                >
                  {submitting ? "Saving..." : showEditItemModal ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showQRModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-sm w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">QR Code</h2>
              <button
                onClick={() => setShowQRModal(false)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex flex-col items-center">
              {qrCodeImage && (
                <Image src={qrCodeImage} alt="QR Code" width={192} height={192} className="mb-3" />
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{box.name}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Scan to view box contents</p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowQRModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition font-medium text-gray-700 dark:text-gray-300 text-sm"
                >
                  Close
                </button>
                <button
                  onClick={downloadQRCode}
                  className="flex-1 bg-indigo-600 text-white dark:bg-indigo-500 px-4 py-2 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-400 transition font-medium text-sm"
                >
                  Download
                </button>
                <button
                  onClick={printQRCode}
                  className="flex-1 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition font-medium text-sm"
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
