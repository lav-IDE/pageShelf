import * as pdfjsLib from 'pdfjs-dist';
import { db } from '../db';

// Set worker url
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

export async function uploadBook(file) {
  const fileUrl = URL.createObjectURL(file);
  
  const loadingTask = pdfjsLib.getDocument({ url: fileUrl });
  const pdf = await loadingTask.promise;
  
  let title = file.name.replace(/\.[^/.]+$/, "");
  let author = null;
  
  try {
    const metaData = await pdf.getMetadata();
    if (metaData && metaData.info) {
      if (metaData.info.Title) title = metaData.info.Title;
      if (metaData.info.Author) author = metaData.info.Author;
    }
  } catch (err) {
    console.warn("Could not read pdf metadata:", err);
  }
  
  // Extract thumbnail (first page)
  let thumbnailBlob = null;
  try {
    const page = await pdf.getPage(1);
    const scale = 0.5; // low res for thumbnail
    const viewport = page.getViewport({ scale });
    
    // Create an offscreen canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;
    
    thumbnailBlob = await new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.8);
    });
    
  } catch (err) {
    console.warn("Could not extract thumbnail:", err);
  }
  
  const bookEntry = {
    id: crypto.randomUUID(),
    title,
    author,
    fileType: file.name.endsWith('.epub') ? 'epub' : 'pdf',
    fileBlob: file,
    thumbnailBlob,
    totalPages: pdf.numPages,
    currentPage: 1,
    scrollOffset: 0,
    readingProgress: 0,
    lastReadAt: new Date(),
    addedAt: new Date()
  };
  
  await db.books.add(bookEntry);
  
  // clean up
  URL.revokeObjectURL(fileUrl);
  return bookEntry;
}

