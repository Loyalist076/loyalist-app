const AnnualMeetingDocument = require('../models/AnnualMeetingDocument');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Upload annual meeting document
exports.uploadDocument = async (req, res) => {
  try {
    const { title, description, year, displayOrder } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'PDF file is required' });
    }

    if (!title || !year) {
      // Clean up uploaded file
      if (req.file && req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ message: 'Title and year are required' });
    }

    const tempFilePath = req.file.path;

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, '../uploads/annual-meeting-documents');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const uniqueFilename = `annual-meeting-${year}-${Date.now()}-${req.file.originalname}`;
    const permanentFilePath = path.join(uploadsDir, uniqueFilename);

    // Move file from temp location to permanent storage
    fs.renameSync(tempFilePath, permanentFilePath);

    // Save to database
    const newDocument = new AnnualMeetingDocument({
      title,
      description: description || '',
      year: parseInt(year),
      fileName: req.file.originalname,
      fileUrl: `/uploads/annual-meeting-documents/${uniqueFilename}`,
      fileSize: req.file.size,
      public_id: uniqueFilename, // Store filename for deletion
      displayOrder: displayOrder ? parseInt(displayOrder) : 0
    });

    await newDocument.save();

    res.status(201).json({
      message: 'Document uploaded successfully',
      document: newDocument
    });
  } catch (err) {
    console.error('Error uploading annual meeting document:', err);

    // Clean up file if it exists
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupErr) {
        console.error('Error cleaning up temp file:', cleanupErr);
      }
    }

    res.status(500).json({ message: 'Failed to upload document' });
  }
};

// Get all documents (optionally filter by year)
exports.getAllDocuments = async (req, res) => {
  try {
    const { year, active } = req.query;

    const query = {};
    if (year) {
      query.year = parseInt(year);
    }
    if (active !== undefined) {
      query.isActive = active === 'true';
    }

    const documents = await AnnualMeetingDocument.find(query)
      .sort({ year: -1, displayOrder: 1 })
      .lean();

    res.status(200).json(documents);
  } catch (err) {
    console.error('Error fetching annual meeting documents:', err);
    res.status(500).json({ message: 'Failed to fetch documents' });
  }
};

// Get documents grouped by year
exports.getDocumentsByYear = async (req, res) => {
  try {
    const documents = await AnnualMeetingDocument.find({ isActive: true })
      .sort({ year: -1, displayOrder: 1 })
      .lean();

    // Group by year
    const groupedByYear = documents.reduce((acc, doc) => {
      if (!acc[doc.year]) {
        acc[doc.year] = [];
      }
      acc[doc.year].push(doc);
      return acc;
    }, {});

    res.status(200).json(groupedByYear);
  } catch (err) {
    console.error('Error fetching documents by year:', err);
    res.status(500).json({ message: 'Failed to fetch documents' });
  }
};

// Get single document by ID
exports.getDocumentById = async (req, res) => {
  try {
    const document = await AnnualMeetingDocument.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    res.status(200).json(document);
  } catch (err) {
    console.error('Error fetching document:', err);
    res.status(500).json({ message: 'Failed to fetch document' });
  }
};

// Update document metadata (not the file)
exports.updateDocument = async (req, res) => {
  try {
    const { title, description, year, displayOrder, isActive } = req.body;

    const updateData = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (year) updateData.year = parseInt(year);
    if (displayOrder !== undefined) updateData.displayOrder = parseInt(displayOrder);
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedDocument = await AnnualMeetingDocument.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedDocument) {
      return res.status(404).json({ message: 'Document not found' });
    }

    res.status(200).json({
      message: 'Document updated successfully',
      document: updatedDocument
    });
  } catch (err) {
    console.error('Error updating document:', err);
    res.status(500).json({ message: 'Failed to update document' });
  }
};

// Delete document
exports.deleteDocument = async (req, res) => {
  try {
    const document = await AnnualMeetingDocument.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Delete from filesystem if file exists
    if (document.public_id) {
      try {
        const filePath = path.join(__dirname, '../uploads/annual-meeting-documents', document.public_id);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Deleted file: ${filePath}`);
        }
      } catch (fileErr) {
        console.error('Error deleting file:', fileErr);
        // Continue with database deletion even if file deletion fails
      }
    }

    // Delete from database
    await AnnualMeetingDocument.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Document deleted successfully' });
  } catch (err) {
    console.error('Error deleting document:', err);
    res.status(500).json({ message: 'Failed to delete document' });
  }
};

// Get available years
exports.getAvailableYears = async (req, res) => {
  try {
    const years = await AnnualMeetingDocument.distinct('year', { isActive: true });
    years.sort((a, b) => b - a); // Sort descending

    res.status(200).json(years);
  } catch (err) {
    console.error('Error fetching available years:', err);
    res.status(500).json({ message: 'Failed to fetch years' });
  }
};

// View PDF inline (serve from filesystem)
exports.viewDocument = async (req, res) => {
  try {
    const document = await AnnualMeetingDocument.findById(req.params.id);
    if (!document) {
      return res.status(404).send('Document not found.');
    }

    const filePath = path.join(__dirname, '../uploads/annual-meeting-documents', document.public_id);

    if (!fs.existsSync(filePath)) {
      return res.status(404).send('File not found on server.');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${document.fileName}"`);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (err) {
    console.error('Error viewing document:', err);
    res.status(500).send('Failed to display document.');
  }
};

// Download PDF (serve from filesystem)
exports.downloadDocument = async (req, res) => {
  try {
    const document = await AnnualMeetingDocument.findById(req.params.id);
    if (!document) {
      return res.status(404).send('Document not found.');
    }

    const filePath = path.join(__dirname, '../uploads/annual-meeting-documents', document.public_id);

    if (!fs.existsSync(filePath)) {
      return res.status(404).send('File not found on server.');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (err) {
    console.error('Error downloading document:', err);
    res.status(500).send('Failed to download document.');
  }
};
