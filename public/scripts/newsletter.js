/**
 * Newsletter subscription functionality
 */
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('newsletter-form');
    const emailInput = document.getElementById('newsletter-email');
    const submitButton = document.getElementById('newsletter-submit');
    const messageElement = document.getElementById('newsletter-message');

    if (!form || !emailInput || !submitButton || !messageElement) {
        console.error('Newsletter form elements not found');
        return;
    }

    // Supabase project details
    const SUPABASE_URL = 'https://urguvlckmcehdiibsiwf.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyZ3V2bGNrbWNlaGRpaWJzaXdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU4ODM5MzEsImV4cCI6MjA1MTQ1OTkzMX0.Hdpz9eQzLx_HlaHBF_CIpWX-xZyAbg54Po3rnUdM8Mw';

    // Function to validate email format
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Function to display messages
    function showMessage(message, isSuccess = true) {
        messageElement.textContent = message;
        messageElement.className = 'newsletter-message ' + (isSuccess ? 'success' : 'error');
        
        // Clear message after 5 seconds if it's a success message
        if (isSuccess) {
            setTimeout(() => {
                messageElement.textContent = '';
                messageElement.className = 'newsletter-message';
            }, 5000);
        }
    }

    // Function to handle form submission
    async function handleSubmit() {
        const email = emailInput.value.trim();
        
        // Validate email
        if (!email) {
            showMessage('Please enter your email address', false);
            return;
        }
        
        if (!isValidEmail(email)) {
            showMessage('Please enter a valid email address', false);
            return;
        }
        
        // Disable button and show loading state
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="bi bi-hourglass-split"></i>';
        
        try {
            // Send email to Supabase
            const response = await fetch(`${SUPABASE_URL}/rest/v1/newsletter_subscribers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                    email: email,
                    source: 'landing_page',
                    metadata: {
                        page: window.location.pathname
                    }
                })
            });
            
            console.log('Supabase response status:', response.status);
            
            if (response.ok) {
                // Success
                showMessage('Thank you for subscribing!');
                emailInput.value = ''; // Clear the input
            } else {
                // Try to get more detailed error info
                let errorText = 'Something went wrong';
                try {
                    const errorData = await response.json();
                    console.error('Supabase error response:', errorData);
                    errorText = errorData.message || errorData.error || 'Something went wrong';
                } catch (jsonError) {
                    console.error('Could not parse error response:', jsonError);
                    errorText = `Server error (${response.status})`;
                }
                
                // Handle known error cases
                if (response.status === 409) {
                    showMessage('You are already subscribed!');
                    emailInput.value = ''; // Clear the input
                } else if (response.status === 401) {
                    console.error('Authentication error - Invalid API key');
                    showMessage('Server configuration error. Please contact administrator.', false);
                } else {
                    showMessage(`Error: ${errorText}`, false);
                }
            }
        } catch (error) {
            console.error('Newsletter submission error:', error);
            showMessage('Error connecting to the server. Please try again later.', false);
        } finally {
            // Reset button state
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="bi bi-arrow-right"></i>';
        }
    }
    
    // Event listeners
    submitButton.addEventListener('click', handleSubmit);
    
    // Also allow form submission on Enter key
    emailInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
        }
    });
}); 