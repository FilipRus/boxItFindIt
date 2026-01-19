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
        // Clear form but keep modal open
        setItemName("");
        setItemDescription("");
        setItemImage(null);
        setItemLabels([]);
        setLabelInput("");

        // Show success message
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);

        // Reset file input
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = '';

        // Refresh available labels
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
          // Remove from current box
          setBox((prev) =>
            prev ? { ...prev, items: prev.items.filter((item) => item.id !== editingItem.id) } : null
          );

          // Show success message and close modal after 2 seconds
          setMoveSuccessMessage(true);
          setTimeout(() => {
            setMoveSuccessMessage(false);
            closeModal();
          }, 2000);
        } else {
          // Update in current box
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

          // Close modal immediately
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
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!box) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/dashboard" className="text-blue-600 hover:text-blue-700">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{box.name}</h1>
            {/* Show action buttons only when items exist */}
            {box.items.length > 0 && (
              <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2 sm:gap-3">
                <button
                  onClick={generateQRCode}
                  className="w-full sm:w-auto bg-green-600 text-white px-5 py-3 rounded-lg hover:bg-green-700 transition font-medium shadow-md text-base"
                >
                  Generate QR Code
                </button>
                <button
                  onClick={() => setShowAddItemModal(true)}
                  className="w-full sm:w-auto bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700 transition font-medium shadow-md text-base"
                >
                  Add Item
                </button>
              </div>
            )}
          </div>

          {/* Show item count and view toggle only when items exist */}
          {box.items.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
              <p className="text-sm sm:text-base text-gray-600">{box.items.length} items in this box</p>
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-4 sm:px-5 py-2.5 rounded-md transition ${
                    viewMode === "grid"
                      ? "bg-white text-blue-600 shadow"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-4 sm:px-5 py-2.5 rounded-md transition ${
                    viewMode === "list"
                      ? "bg-white text-blue-600 shadow"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {box.items.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-700 mb-4">No items in this box yet</p>
            <button
              onClick={() => setShowAddItemModal(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Add Your First Item
            </button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
                    <h3 className="text-lg font-semibold text-gray-900">
                      {item.name}
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteItem(item.id);
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
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {box.items.map((item) => (
              <div
                key={item.id}
                onClick={() => startEditItem(item)}
                className="bg-white rounded-lg shadow hover:shadow-lg transition p-4 flex gap-4 cursor-pointer"
              >
                {item.imagePath && (
                  <div className="relative w-24 h-24 flex-shrink-0 bg-gray-200 rounded-lg overflow-hidden">
                    <Image
                      src={item.imagePath}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteItem(item.id);
                        }}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    {item.labels && item.labels.length > 0 && (
                      <>
                        {item.labels.map((itemLabel) => (
                          <span
                            key={itemLabel.label.id}
                            className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded"
                          >
                            {itemLabel.label.name}
                          </span>
                        ))}
                      </>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-gray-600 text-sm mt-2">{item.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {(showAddItemModal || showEditItemModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-0 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-none sm:rounded-lg w-full h-full sm:h-auto sm:max-w-md sm:w-full p-6 sm:my-8 overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {showEditItemModal ? "Edit Item" : "Add New Item"}
            </h2>
            {moveSuccessMessage && showEditItemModal && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Item moved successfully!</span>
              </div>
            )}
            {showSuccessMessage && showAddItemModal && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Item added! Add another or close when done.</span>
              </div>
            )}
            <form onSubmit={showEditItemModal ? updateItem : addItem}>
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

                  {/* Display current labels */}
                  {itemLabels.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {itemLabels.map((label) => (
                        <span
                          key={label}
                          className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                        >
                          {label}
                          <button
                            type="button"
                            onClick={() => removeLabel(label)}
                            className="hover:text-blue-600"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Label input with autocomplete */}
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

                    {/* Autocomplete suggestions */}
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

                {showEditItemModal && availableBoxes.length > 0 && (
                  <div>
                    <label
                      htmlFor="destinationBox"
                      className="block text-sm font-medium text-gray-900 mb-2"
                    >
                      Move to Different Box
                    </label>
                    <select
                      id="destinationBox"
                      value={selectedDestinationBoxId}
                      onChange={(e) => setSelectedDestinationBoxId(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    >
                      <option value="">Keep in current box</option>
                      {availableBoxes.map((box) => (
                        <option key={box.id} value={box.id}>
                          {box.name}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      Select a box to move this item to a different location
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Photo
                  </label>

                  {showEditItemModal && editingItem?.imagePath && !itemImage && (
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

                  <div className="relative">
                    <input
                      id="itemImage"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) =>
                        setItemImage(e.target.files?.[0] || null)
                      }
                      className="hidden"
                    />
                    <label
                      htmlFor="itemImage"
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition cursor-pointer text-gray-700 hover:text-blue-600"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
                >
                  {submitting ? "Saving..." : showEditItemModal ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showQRModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white rounded-none sm:rounded-lg w-full h-full sm:h-auto sm:max-w-md sm:w-full p-6 flex flex-col justify-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">QR Code for {box.name}</h2>
            <div className="flex justify-center mb-4">
              {qrCodeImage && (
                <Image
                  src={qrCodeImage}
                  alt="QR Code"
                  width={200}
                  height={200}
                />
              )}
            </div>
            <p className="text-sm text-gray-700 mb-4 text-center">
              Scan this code to view box contents
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowQRModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium text-gray-900"
              >
                Close
              </button>
              <button
                onClick={downloadQRCode}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
