// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = "your-cloud-name"; // Replace with your actual cloud name
const CLOUDINARY_UPLOAD_PRESET = "Pictures-for-Dormies"; // Using the preset from your configuration
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

// Array to store uploaded image URLs
let uploadedImages = [];

// Function to handle image upload to Cloudinary
async function uploadToCloudinary(file) {
  // Create form data
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  
  try {
    // Show loading state
    showNotice("Uploading image...", "info");
    
    // Upload to Cloudinary
    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    const data = await response.json();
    
    // Add the secure URL to our array
    uploadedImages.push(data.secure_url);
    
    // Show success message
    showNotice("Image uploaded successfully!", "success");
    
    // Return the image data
    return data;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    showNotice("Failed to upload image. Please try again.", "error");
    return null;
  }
}

// Function to display notice messages
function showNotice(message, type = "info") {
  const noticeBox = document.getElementById('noticeBox');
  const noticeText = document.getElementById('noticeText');
  
  noticeText.textContent = message;
  
  // Remove all classes and add appropriate one
  noticeBox.className = "notice";
  noticeBox.classList.add(type);
  
  // Show the notice
  noticeBox.classList.remove('hide');
  
  // Hide after 3 seconds
  setTimeout(() => {
    noticeBox.classList.add('hide');
  }, 3000);
}

// Function to handle image upload event
function uploadImages(event) {
  const files = event.target.files;
  const imagePreview = document.getElementById('image-preview');
  
  if (files.length === 0) return;
  
  // Process each file
  Array.from(files).forEach(file => {
    // Check if file is an image
    if (!file.type.match('image.*')) {
      showNotice("Please select only image files", "error");
      return;
    }
    
    // Create a preview element
    const previewContainer = document.createElement('div');
    previewContainer.className = 'preview-item';
    
    // Create loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    previewContainer.appendChild(loadingIndicator);
    
    // Add to preview area
    imagePreview.appendChild(previewContainer);
    
    // Create file reader for preview
    const reader = new FileReader();
    reader.onload = function(e) {
      // Upload to Cloudinary
      uploadToCloudinary(file).then(data => {
        if (data) {
          // Remove loading indicator
          previewContainer.removeChild(loadingIndicator);
          
          // Create image element
          const img = document.createElement('img');
          img.src = e.target.result;
          previewContainer.appendChild(img);
          
          // Add delete button
          const deleteBtn = document.createElement('button');
          deleteBtn.className = 'delete-image';
          deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
          deleteBtn.addEventListener('click', function() {
            // Remove from array
            const index = uploadedImages.indexOf(data.secure_url);
            if (index > -1) {
              uploadedImages.splice(index, 1);
            }
            // Remove from preview
            imagePreview.removeChild(previewContainer);
          });
          previewContainer.appendChild(deleteBtn);
          
          // Add hidden input with Cloudinary URL
          const hiddenInput = document.createElement('input');
          hiddenInput.type = 'hidden';
          hiddenInput.name = 'listing-images[]';
          hiddenInput.value = data.secure_url;
          previewContainer.appendChild(hiddenInput);
        } else {
          // Remove the preview container if upload failed
          imagePreview.removeChild(previewContainer);
        }
      });
    };
    
    // Read the image file as a data URL
    reader.readAsDataURL(file);
  });
}

// Add event listener to the save button to include uploaded images
document.addEventListener('DOMContentLoaded', function() {
  const saveListingBtn = document.getElementById('save-listing-btn');
  
  if (saveListingBtn) {
    saveListingBtn.addEventListener('click', function() {
      // Add the image URLs to your form submission
      // This depends on how you're handling the form submission
      
      console.log('Uploaded images:', uploadedImages);
      
      // If you're using Firebase as mentioned in your HTML:
      // You can add this array to your listing data before saving
      
      // Example:
      // const listingData = {
      //   title: document.getElementById('listing-title').value,
      //   // ... other fields
      //   images: uploadedImages
      // };
      
      // Then save the data to Firebase or your backend
    });
  }
});

// Make the uploadImages function globally available
window.uploadImages = uploadImages;