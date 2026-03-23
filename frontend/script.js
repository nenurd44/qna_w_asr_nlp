let mediaRecorder;
let audioChunks = [];
let isRecording = false;

// Tip: When you deploy, you can change this URL easily in one place
const BASE_URL = "https://unheuristically-unanecdotal-simonne.ngrok-free.dev";

/**
 * Handles the logic for recording audio from the user's microphone.
 */
async function toggleRecording() {
    const button = document.getElementById("recordBtn");
    const status = document.getElementById("status");

    if (!isRecording) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];

            mediaRecorder.ondataavailable = event => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                status.innerHTML = '<span class="loading">Transcribing Voice...</span>';
                
                const blob = new Blob(audioChunks, { type: 'audio/webm' });
                let formData = new FormData();
                formData.append("file", blob, "audio.webm");
                
                audioChunks = [];

                try {
                    const response = await fetch(`${BASE_URL}/transcribe`, {
                        method: "POST",
                        body: formData
                    });
                    
                    if (!response.ok) throw new Error("Backend error");

                    const data = await response.json();
                    document.getElementById("textbox").value = data.text;
                    status.innerText = "Status: Transcribed!";
                } catch (e) {
                    console.error("Transcription Error:", e);
                    status.innerText = "Status: Error transcribing.";
                }
            };

            mediaRecorder.start();
            isRecording = true;
            button.innerText = "Stop Recording";
            status.innerText = "Status: Recording...";
        } catch (err) {
            console.error("Mic Access Denied:", err);
            status.innerText = "Status: Microphone access denied.";
        }
    } else {
        mediaRecorder.stop();
        isRecording = false;
        button.innerText = "Start Recording";
        status.innerText = "Status: Stopping...";
    }
}

/**
 * Sends the text from the textarea to the backend /ask endpoint.
 */
async function sendText() {
    const text = document.getElementById("textbox").value;
    const answerDiv = document.getElementById("answer");
    const sendBtn = document.getElementById("sendBtn");

    if (!text.trim()) {
        alert("Please enter some text first!");
        return;
    }

    sendBtn.disabled = true;
    answerDiv.innerHTML = '<span class="loading">Processing...</span>';

    try {
        const response = await fetch(`${BASE_URL}/ask`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question: text })
        });

        const data = await response.json();
        answerDiv.innerText = data.answer;
    } catch (error) {
        console.error("Connection Error:", error);
        answerDiv.innerText = "Error: Could not connect to the backend.";
    } finally {
        sendBtn.disabled = false;
    }
}