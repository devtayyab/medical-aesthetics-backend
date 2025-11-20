import React, { useState } from 'react';
import { BiX } from 'react-icons/bi';

interface BookingNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: string) => void;
}

const BookingNoteModal: React.FC<BookingNoteModalProps> = ({ isOpen, onClose, onSave }) => {
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
          onClick={onClose}
          aria-label="Close modal"
        >
          <BiX size={24} />
        </button>
        <h2 className="text-lg font-semibold mb-4">Add a booking note</h2>
        <label htmlFor="bookingNote" className="block text-sm mb-1">
          Note for the beauty doctors
        </label>
        <textarea
          id="bookingNote"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          rows={5}
          className="w-full rounded-md border border-gray-300 p-2 resize-none focus:outline-none focus:ring-2 focus:ring-lime-400"
          placeholder="Enter your note here..."
        />
        <div className="text-right text-xs text-gray-500 mt-1">
          {note.length}/500 characters
        </div>
        <button
          onClick={() => {
            onSave(note);
            setNote('');
            onClose();
          }}
          className="mt-4 w-full bg-lime-400 text-black font-semibold py-2 rounded hover:bg-lime-500 transition"
        >
          Add note
        </button>
      </div>
    </div>
  );
};

export default BookingNoteModal;
