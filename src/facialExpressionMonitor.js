// Import TensorFlow.js
import * as tf from '@tensorflow/tfjs';
import { HfInference } from '@huggingface/inference'

const hf = new HfInference('');

// Define the library class
export default class FacialExpressionMonitor {
    constructor() {
        // Initialize video stream
        this.video = document.createElement('video');
        this.video.id='video-stream';
        this.video.width = 640; // Adjust these dimensions as needed
        this.video.height = 480; // Adjust these dimensions as needed
        this.video.autoplay = true;
        this.video.style.border = '1px solid #ccc';
        this.video.style.display = 'none'; // Hide the video element

        // Initialize camera control popup
        this.initCameraControl();
    }

    async processVideoStream() {
        // Wait for the video metadata to load
        await new Promise(resolve => {
            this.video.addEventListener('loadedmetadata', resolve);
        });
    
        // Process the video stream for facial expressions
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        console.log(this.video, 'this.video');
        canvas.width = this.video.videoWidth;
        canvas.height = this.video.videoHeight;
        context.drawImage(this.video, 0, 0, canvas.width, canvas.height);

        const pngDataUrl = canvas.toDataURL('image/png');
        const pngImageData = await fetch(pngDataUrl).then(response => response.blob());

        // Perform inference using Hugging Face Inference API
        const predictions = await hf.imageClassification({
            data: pngImageData,
            model: 'dima806/facial_emotions_image_detection'
        });
        console.log(predictions, '==predictions here==');
        return predictions;
    }

    initCameraControl() {
        // Create icon for camera control
        const icon = document.createElement('img');
        icon.id = 'cameraIcon';
        icon.src = 'https://cdn-icons-png.flaticon.com/512/3570/3570159.png';
        icon.style.position = 'fixed';
        icon.style.zIndex=999;
        icon.style.bottom = '20px';
        icon.style.right = '20px';
        icon.style.width = '50px';
        icon.style.height = '50px';
        icon.style.cursor = 'pointer';
        icon.onclick = this.openCameraControlPopup.bind(this);
        document.body.appendChild(icon); // Append icon to the body

        // Create popup for camera control
        this.popup = document.createElement('div');
        this.popup.id = 'cameraPopup';
        this.popup.style.position = 'fixed';
        this.popup.style.bottom = '80px';
        this.popup.style.right = '20px';
        this.popup.style.background = '#fff';
        this.popup.style.padding = '10px';
        this.popup.style.border = '1px solid #ccc';
        this.popup.style.display = 'none';

        // Add options to turn camera on/off
        const cameraToggle = document.createElement('input');
        cameraToggle.type = 'checkbox';
        cameraToggle.checked = false; // Default: camera is off
        cameraToggle.onchange = () => {
            if (cameraToggle.checked) {
                // If camera toggle is checked, ask for user consent
                if (confirm('Would you mind if we access your camera to monitor your facial expressions?')) {
                    // If user consents, turn on the camera
                    this.turnOnCamera();
                } else {
                    // If user declines, uncheck the camera toggle
                    cameraToggle.checked = false;
                }
            } else {
                // If camera toggle is unchecked, turn off the camera
                this.turnOffCamera();
            }
        };
        const cameraLabel = document.createElement('label');
        cameraLabel.textContent = 'Turn Camera On/Off';
        this.popup.appendChild(cameraToggle);
        this.popup.appendChild(cameraLabel);

        document.body.appendChild(this.popup);

        // Close popup when clicking outside of it
        document.body.addEventListener('click', (event) => {
            const cameraPopup = document.getElementById('cameraPopup');
            const isClickedInsidePopup = cameraPopup.contains(event.target);
            const isClickedOnCameraIcon = event.target.id === 'cameraIcon';
            if (!isClickedInsidePopup && !isClickedOnCameraIcon) {
                cameraPopup.style.display = 'none';
            }
        });
    }

    turnOnCamera() {
        // Prompt the user for camera access
        navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
            console.log(stream, 'stream');
            // Show video stream
            this.video.srcObject = stream;
            this.video.style.width = '150px';
            this.video.style.height = '113px';
            this.video.style.position = 'fixed';
            this.video.style.top = '0px';
            this.video.style.right = '0px';
            this.video.style.zIndex = 9999; // Ensure video appears on top of other elements
            this.video.style.display = 'block'; // Display the video stream

            this.predictedExpression.position='fixed';
            this.predictedExpression.top='500px';
            this.predictedExpression.style.right = '30px';

            document.body.appendChild(this.video);
            document.body.appendChild(this.predictedExpression);

            console.log(this.video, 'this.video here');
            
            // Start processing the video stream recursively with a delay of 1 second
            const processVideoRecursive = () => {
                this.processVideoStream()
                    .then((result) => {
                        console.log(result, 'result here');
                        this.predictedExpression.innerHTML = result[0].label;
                        this.predictedExpression.style.display = 'block';
                        
                        // Schedule the next invocation after a delay of 1 second
                        setTimeout(processVideoRecursive, 1000);
                    })
                    .catch((error) => {
                        console.error('Error processing video stream:', error);
                        this.predictedExpression.style.display = 'none';
                    });
            };

            // Start the recursive processing of the video stream
            processVideoRecursive();
        })
        .catch((error) => {
            console.error('Error accessing camera:', error);
            alert('Failed to access camera. Please check your camera settings and try again.');
        });
    }

    turnOffCamera() {
        // Stop the video stream
        if (this.video.srcObject) {
            this.video.srcObject.getTracks().forEach(track => track.stop());
        }

        // Hide the video element
        this.video.style.display = 'none';
        clearInterval(this.processingInterval);
    }

    openCameraControlPopup() {
        if (this.popup.style.display === 'block') {
            this.popup.style.display = 'none';
            return;
        }
        this.popup.style.display = 'block';
    }
}
