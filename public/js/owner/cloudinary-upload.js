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
function handleFileUpload(event) {
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

// Initialize the upload functionality
document.addEventListener('DOMContentLoaded', function() {
  const uploadInput = document.getElementById('upload-photos');
  const saveListingBtn = document.getElementById('save-listing-btn');
  
  // Add event listener to file input
  if (uploadInput) {
    uploadInput.addEventListener('change', handleFileUpload);
  }
  
  // Add event listener to save button
  if (saveListingBtn) {
    saveListingBtn.addEventListener('click', function() {
      // Get all form values
      const listingData = {
        title: document.getElementById('listing-title').value,
        street: document.getElementById('street').value,
        blkNo: document.getElementById('blk-no').value,
        landmark: document.getElementById('landmark').value,
        description: document.getElementById('description').value,
        rentalSpace: document.getElementById('rental-space').value,
        furnishStatus: document.getElementById('furnish-status').value,
        roomType: document.getElementById('room-type').value,
        roomPrivacy: document.getElementById('room-privacy').value,
        bathroom: document.getElementById('bathroom').value,
        gender: document.getElementById('gender').value,
        rentAmount: document.getElementById('rent-amount').value,
        rentPeriod: document.getElementById('rent-period').value,
        rentMethod: document.getElementById('rent-method').value,
        advancePayment: document.getElementById('advance-payment').value,
        depositPayment: document.getElementById('deposit-payment').value,
        contractTerm: document.getElementById('contract-term').value,
        waterBill: document.getElementById('water-bill').value,
        electricBill: document.getElementById('electric-bill').value,
        wifiBill: document.getElementById('wifi-bill').value,
        images: uploadedImages
      };
      
      console.log('Listing data to save:', listingData);
      
      // Here you would integrate with your Firebase or backend service
      // For example, with Firebase:
      // saveListingToFirebase(listingData);
      
      showNotice("Listing saved successfully!", "success");
    });
  }
});

// Function to save listing to Firebase
// This is a placeholder - you'll need to integrate with your actual Firebase setup
function saveListingToFirebase(listingData) {
  // This function should be implemented based on your Firebase configuration
  // For example:
  // const db = firebase.firestore();
  // db.collection("listings").add(listingData)
  //   .then((docRef) => {
  //     console.log("Document written with ID: ", docRef.id);
  //     showNotice("Listing saved successfully!", "success");
  //   })
  //   .catch((error) => {
  //     console.error("Error adding document: ", error);
  //     showNotice("Error saving listing. Please try again.", "error");
  //   });
}