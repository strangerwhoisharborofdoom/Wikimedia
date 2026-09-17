import React, { useState } from 'react';
import { X, Upload, CheckCircle, AlertTriangle, FileText } from 'lucide-react';
import { apiClient } from '../services/apiClient.js';

interface DatasetImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const DatasetImportModal: React.FC<DatasetImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  if (!isOpen) return null;

  const [jsonInput, setJsonInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonInput(content);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    setStatusMessage(null);
    if (!jsonInput.trim()) {
      setStatusMessage({ type: 'error', text: 'Please provide valid JSON content.' });
      return;
    }

    try {
      const parsed = JSON.parse(jsonInput);
      setLoading(true);

      const res = await apiClient.importArticle(parsed);

      setStatusMessage({ type: 'success', text: res.message });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to import article' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl max-w-xl w-full border border-stone-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Wikimedia Structured Dataset
            </span>
            <h2 className="text-lg font-serif font-bold text-stone-900">
              Ingest Custom Article Record
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-stone-400 hover:text-stone-600 hover:bg-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-stone-600 leading-relaxed">
            Ingest an authentic article record conforming to the Wikimedia Enterprise Structured Contents schema (including recursive infobox parts and section paragraphs).
          </p>

          <div className="border-2 border-dashed border-stone-300 rounded-lg p-4 text-center hover:border-stone-400 transition-colors bg-stone-50">
            <Upload className="w-6 h-6 text-stone-400 mx-auto mb-1.5" />
            <label className="cursor-pointer text-xs font-medium text-stone-900 hover:underline">
              <span>Choose a .json file to upload</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <p className="text-[11px] text-stone-500 mt-1">
              Supports standard single-article Wikimedia JSON format
            </p>
          </div>

          <div>
            <label htmlFor="json-payload" className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
              Or Paste JSON Payload Directly
            </label>
            <textarea
              id="json-payload"
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              rows={7}
              placeholder={`{\n  "identifier": 999999,\n  "name": "Custom Sample Article",\n  "abstract": "...",\n  "infobox": [...],\n  "article_sections": [...]\n}`}
              className="w-full text-xs font-mono rounded-lg border border-stone-300 p-2.5 text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-stone-900 focus:border-stone-900"
            />
          </div>

          {statusMessage && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                  : 'bg-rose-50 text-rose-800 border border-rose-300'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-white bg-stone-900 rounded-lg hover:bg-stone-800 transition-colors disabled:opacity-50 shadow-xs"
            >
              {loading ? 'Ingesting...' : 'Ingest into Dataset'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
