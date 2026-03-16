"use client";

import { useState, useEffect, use } from "react";
import Image from "next/image";

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
  items: Item[];
}

export default function PublicBoxView({
  params,
}: {
  params: Promise<{ qrCode: string }>;
}) {
  const { qrCode } = use(params);
  const [box, setBox] = useState<Box | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  useEffect(() => {
    fetchBox();
  }, [qrCode]);

  const fetchBox = async () => {
    try {
      const response = await fetch(`/api/public/box/${qrCode}`);

      if (!response.ok) {
        setError(true);
        return;
      }

      const data = await response.json();
      setBox(data.box);
    } catch (error) {
      console.error("Error fetching box:", error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 sm:p-6">
          <div className="max-w-4xl mx-auto">
            <div className="animate-skeleton h-7 w-48 mx-auto mb-2"></div>
            <div className="animate-skeleton h-4 w-24 mx-auto"></div>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 flex gap-4">
                <div className="animate-skeleton w-20 h-20 rounded-lg flex-shrink-0"></div>
                <div className="flex-1">
                  <div className="animate-skeleton h-5 w-32 mb-2"></div>
                  <div className="animate-skeleton h-4 w-48"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !box) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
        <div className="text-center bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-8 max-w-md">
          <svg
            className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Box Not Found</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">This QR code doesn&apos;t match any box in our system.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <svg
              className="w-5 h-5 text-gray-400 dark:text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100">{box.name}</h1>
          </div>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            {box.items.length} {box.items.length === 1 ? "item" : "items"}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {box.items.length > 0 && (
          <div className="flex justify-center mb-4">
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

        {box.items.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-12 text-center">
            <svg
              className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
              This box is empty
            </h2>
            <p className="text-gray-400 dark:text-gray-500 text-sm">No items have been added yet.</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {box.items.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-sm transition overflow-hidden text-left"
              >
                {item.imagePath ? (
                  <div className="relative w-full h-40 bg-gray-100 dark:bg-gray-800">
                    <Image src={item.imagePath} alt={item.name} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="w-full h-40 bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                    <svg className="w-10 h-10 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                )}
                <div className="p-3">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm mb-1">{item.name}</h3>
                  {item.category && (
                    <span className="inline-block bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs px-1.5 py-0.5 rounded mb-1">
                      {item.category}
                    </span>
                  )}
                  {item.description && (
                    <p className="text-gray-400 dark:text-gray-500 text-xs line-clamp-2">{item.description}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {box.items.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-300 dark:hover:border-gray-700 transition p-4 flex gap-4 text-left"
              >
                {item.imagePath ? (
                  <div className="relative w-16 h-16 flex-shrink-0 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                    <Image src={item.imagePath} alt={item.name} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="w-16 h-16 flex-shrink-0 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm mb-0.5">{item.name}</h3>
                  {item.category && (
                    <span className="inline-block bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs px-1.5 py-0.5 rounded mb-0.5">
                      {item.category}
                    </span>
                  )}
                  {item.description && (
                    <p className="text-gray-400 dark:text-gray-500 text-xs line-clamp-2">{item.description}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedItem && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-0 sm:p-4 z-50"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-none sm:rounded-lg w-full h-full sm:h-auto sm:max-w-2xl sm:w-full max-h-full sm:max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedItem.imagePath && (
              <div className="relative w-full h-64 sm:h-96 bg-gray-100 dark:bg-gray-800">
                <Image
                  src={selectedItem.imagePath}
                  alt={selectedItem.name}
                  fill
                  className="object-contain"
                />
              </div>
            )}
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {selectedItem.name}
                </h2>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {selectedItem.category && (
                <span className="inline-block bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs px-2 py-1 rounded mb-3">
                  {selectedItem.category}
                </span>
              )}
              {selectedItem.description && (
                <div className="mt-3">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{selectedItem.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
