'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaUpload, FaFileExcel } from 'react-icons/fa';
import AppShell from '../../components/AppShell';

export default function UploadDividend() {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage('Please select an Excel file.');
      return;
    }

    setIsUploading(true);
    setMessage('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('../api/dividendupload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Upload failed');
      }

      setMessage(`✅ Success! ${result.count} records processed and users created.`);
      setFile(null); // Reset input
    } catch (err) {
      setMessage(`❌ Error: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-green-700 to-green-600 px-6 py-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <FaFileExcel className="mr-2" /> Upload Shareholder Dividend Data
            </h3>
          </div>

          <div className="p-6">
            <p className="text-gray-600 mb-6">
              Upload an Excel file (<code>.xlsx</code> or <code>.xls</code>) containing shareholder dividend information. 
              This will populate the <code>sh_dividend</code> table and create corresponding <code>users</code> accounts with the default system password.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50 hover:bg-gray-100 transition-colors">
                <FaUpload className="text-4xl text-gray-400 mb-3" />
                <label htmlFor="file-upload" className="cursor-pointer text-blue-600 font-medium hover:text-blue-800">
                  {file ? 'Change File' : 'Click to select Excel file'}
                </label>
                <input
                  id="file-upload"
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {file && (
                  <p className="mt-2 text-sm text-gray-600">
                    Selected: <span className="font-semibold">{file.name}</span>
                  </p>
                )}
              </div>

              {message && (
                <div className={`p-3 rounded-lg text-sm ${message.includes('✅') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={!file || isUploading}
                className={`w-full py-3 px-4 rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all flex justify-center items-center ${
                  !file || isUploading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isUploading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Upload and Process File'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </AppShell>
  );
}